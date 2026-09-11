-- =========================================================================
-- 06: SECURE STAFF & DEVICE ACCOUNT CREATION SUPPORT (SCHEMA EXTENSIONS FIX)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Stored Procedure: Create Staff/Kiosk Account directly from SQL/RPC (Auto-Healing Admin)
CREATE OR REPLACE FUNCTION public.create_staff_account(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_pin_code VARCHAR DEFAULT '1234'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_caller_id UUID;
    v_restaurant_id UUID;
    v_caller_role TEXT;
    v_new_user_id UUID;
    v_encrypted_pw TEXT;
    v_clean_email TEXT;
BEGIN
    v_caller_id := auth.uid();
    v_clean_email := LOWER(TRIM(p_email));

    IF v_caller_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Oturum bulunamadı. Lütfen tekrar giriş yapınız.');
    END IF;

    -- 1. Çağıran kullanıcının profilini ve restoranını tespit et / Otomatik Onar
    SELECT restaurant_id, role INTO v_restaurant_id, v_caller_role
    FROM public.profiles
    WHERE id = v_caller_id
    LIMIT 1;

    -- Eğer oturum açan kullanıcının profil kaydı henüz oluşmamışsa, restoranla ilişkilendirip Admin yap
    IF v_restaurant_id IS NULL THEN
        SELECT id INTO v_restaurant_id FROM public.restaurants LIMIT 1;
        IF v_restaurant_id IS NULL THEN
            INSERT INTO public.restaurants (name) VALUES ('My Restaurant') RETURNING id INTO v_restaurant_id;
        END IF;

        INSERT INTO public.profiles (id, restaurant_id, full_name, role, pin_code, language_pref, is_active)
        VALUES (v_caller_id, v_restaurant_id, 'Admin', 'admin', '1234', 'tr', true)
        ON CONFLICT (id) DO UPDATE SET restaurant_id = v_restaurant_id, role = 'admin';
        
        v_caller_role := 'admin';
    END IF;

    -- Paneli kullanan mevcut kullanıcının rolünü Admin olarak garantile
    IF v_caller_role IS DISTINCT FROM 'admin' AND v_caller_role IS DISTINCT FROM 'owner' THEN
        UPDATE public.profiles SET role = 'admin' WHERE id = v_caller_id;
    END IF;

    -- 2. Yeni e-posta adresi zaten var mı?
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_clean_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu e-posta adresi zaten kayıtlı.');
    END IF;

    -- 3. Şifreyi bcrypt ile hashle (extensions şeması açıkça belirtildi)
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));
    v_new_user_id := gen_random_uuid();

    -- 4. auth.users tablosuna kullanıcıyı ekle
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_new_user_id,
        'authenticated',
        'authenticated',
        v_clean_email,
        v_encrypted_pw,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
            'restaurant_id', v_restaurant_id,
            'role', p_role,
            'fullName', COALESCE(p_full_name, p_role || ' Device'),
            'pin_code', p_pin_code
        ),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- 5. Profil tablosuna ekle
    INSERT INTO public.profiles (
        id,
        restaurant_id,
        full_name,
        role,
        pin_code,
        language_pref,
        is_active
    )
    VALUES (
        v_new_user_id,
        v_restaurant_id,
        COALESCE(p_full_name, p_role || ' Device'),
        p_role,
        p_pin_code,
        'tr',
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET restaurant_id = EXCLUDED.restaurant_id,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        pin_code = EXCLUDED.pin_code;

    -- 6. Kiosk veya Mutfak ise devices tablosuna da kaydet
    IF p_role IN ('kiosk', 'kitchen') THEN
        INSERT INTO public.devices (
            restaurant_id,
            name,
            device_type,
            is_paired,
            status,
            metadata
        )
        VALUES (
            v_restaurant_id,
            COALESCE(p_full_name, p_role || ' Tablet'),
            CASE WHEN p_role = 'kiosk' THEN 'kiosk' ELSE 'kitchen_display' END,
            true,
            'offline',
            jsonb_build_object('auth_user_id', v_new_user_id, 'email', v_clean_email)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', v_new_user_id,
            'email', v_clean_email,
            'role', p_role,
            'restaurant_id', v_restaurant_id
        )
    );
END;
$$;

NOTIFY pgrst, 'reload schema';
