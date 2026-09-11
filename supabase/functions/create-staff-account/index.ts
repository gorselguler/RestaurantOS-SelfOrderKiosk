// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs in the Supabase Edge Functions (Deno) environment.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing Supabase environment keys" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify caller identity using the caller's JWT
    const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: userErr,
    } = await supabaseCaller.auth.getUser();

    if (userErr || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Query caller's profile to verify role === 'admin'
    const { data: callerProfile, error: profileErr } = await supabaseCaller
      .from("profiles")
      .select("id, restaurant_id, role, full_name")
      .eq("id", callerUser.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only restaurant Admins can create staff/device accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminRestaurantId = callerProfile.restaurant_id;
    if (!adminRestaurantId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin is not associated with any restaurant" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse request body
    const body = await req.json();
    const { email, password, role, fullName, pinCode } = body;

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, and role are mandatory" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["kiosk", "cashier", "kitchen", "manager", "organizer"];
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Initialize Admin Supabase Client with service_role_key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. Create new user in Auth
    const { data: newAuthUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        restaurant_id: adminRestaurantId,
        role: role,
        fullName: fullName || `${role.toUpperCase()} Device`,
        pin_code: pinCode || "1234",
      },
    });

    if (createAuthErr || !newAuthUser.user) {
      return new Response(
        JSON.stringify({ error: createAuthErr?.message || "Failed to create staff user account in Auth" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdUserId = newAuthUser.user.id;

    // 6. Upsert the profile record with the Admin's restaurant_id
    const { error: upsertProfErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: createdUserId,
        restaurant_id: adminRestaurantId,
        full_name: fullName || `${role.toUpperCase()} Account`,
        role: role,
        pin_code: pinCode || "1234",
        language_pref: "tr",
        is_active: true,
        updated_at: new Date().toISOString(),
      });

    if (upsertProfErr) {
      console.error("Profile upsert error:", upsertProfErr);
    }

    // If role is kiosk or device, also register in devices table if not exists
    if (role === "kiosk" || role === "kitchen") {
      await supabaseAdmin.from("devices").insert({
        restaurant_id: adminRestaurantId,
        name: fullName || `${role.toUpperCase()} Tablet`,
        device_type: role === "kiosk" ? "kiosk" : "kitchen_display",
        is_paired: true,
        status: "offline",
        metadata: { auth_user_id: createdUserId, email: email.trim().toLowerCase() },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Staff / Device account created successfully",
        user: {
          id: createdUserId,
          email: newAuthUser.user.email,
          role: role,
          fullName: fullName || `${role.toUpperCase()} Account`,
          restaurant_id: adminRestaurantId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
