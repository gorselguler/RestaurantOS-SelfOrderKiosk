-- =========================================================================
-- 02: DEVICES, UPSELL ENGINE, SHIFTS, ORDERS & REALTIME
-- =========================================================================
-- Sets up operational tables, stored procedures, and realtime replication:
-- - Devices with 6-Digit Pairing Codes & Status
-- - Menu Categories & Items
-- - Upsell Engine (Rule-based Cross-selling)
-- - Shifts & Cash Drawer Tracking (Z Reports)
-- - Orders & Order Items
-- - Customer Loyalty CRM
-- - Stored Procedures: Pairing & Fast PIN verification
-- - Realtime Publication Enablement
-- =========================================================================

-- 1. Devices Table (Kiosks, Kitchen Displays, POS)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('kiosk', 'kitchen_display', 'pos_terminal', 'mobile_waiter')),
    pairing_code VARCHAR(6) UNIQUE,
    pairing_expires_at TIMESTAMPTZ,
    is_paired BOOLEAN NOT NULL DEFAULT false,
    device_token TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'maintenance')),
    ip_address TEXT,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_pairing ON public.devices(pairing_code) WHERE is_paired = false;

-- 2. Menu Categories & Items
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name JSONB NOT NULL, -- {"en": "Kebabs", "tr": "Döner & Kebap", "pl": "Kebab"}
    icon TEXT DEFAULT 'Utensils',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name JSONB NOT NULL,
    description JSONB DEFAULT '{}'::jsonb,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    preparation_time_minutes INT DEFAULT 5,
    calories INT,
    allergens TEXT[] DEFAULT '{}',
    customizations JSONB NOT NULL DEFAULT '{"sauces": [], "addons": [], "removals": []}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Upsell Engine (Rule-based Cross-selling)
CREATE TABLE IF NOT EXISTS public.upsell_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_item_ids UUID[] NOT NULL,
    suggested_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    prompt_title JSONB NOT NULL,
    prompt_message JSONB DEFAULT '{}'::jsonb,
    discount_price NUMERIC(10, 2),
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Shifts & Cash Management
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES public.profiles(id),
    closed_by UUID REFERENCES public.profiles(id),
    start_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    end_cash NUMERIC(10, 2),
    total_cash_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_card_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discrepancy NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_number INT NOT NULL,
    daily_seq INT,
    source TEXT NOT NULL DEFAULT 'kiosk' CHECK (source IN ('kiosk', 'cashier', 'qr_table', 'online_delivery')),
    order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway')),
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('pending_payment', 'received', 'preparing', 'ready', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
    payment_method TEXT NOT NULL DEFAULT 'card' CHECK (payment_method IN ('cash', 'card', 'kiosk_pos', 'blik', 'apple_pay')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Customer Loyalty CRM
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    full_name TEXT,
    email TEXT,
    loyalty_points INT NOT NULL DEFAULT 0,
    total_orders_count INT NOT NULL DEFAULT 0,
    total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_order_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Enable RLS on all tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Apply Tenant Isolation
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        'categories', 'menu_items', 'upsell_rules', 'shifts', 'orders', 'customers'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation for %I" ON public.%I', t, t);
        EXECUTE format('
            CREATE POLICY "Tenant isolation for %I" ON public.%I
            FOR ALL
            USING (restaurant_id = public.current_user_restaurant_id())
            WITH CHECK (restaurant_id = public.current_user_restaurant_id())
        ', t, t);
    END LOOP;
END $$;

-- Device RLS Policy
DROP POLICY IF EXISTS "Tenant isolation for devices" ON public.devices;
CREATE POLICY "Tenant isolation for devices" ON public.devices
FOR ALL USING (
    restaurant_id = public.current_user_restaurant_id() OR is_paired = false
);

-- =========================================================================
-- STORED PROCEDURES
-- =========================================================================

-- Function: Generate 6-Digit Device Pairing Code
CREATE OR REPLACE FUNCTION public.generate_device_pairing_code(
    p_restaurant_id UUID,
    p_device_name TEXT,
    p_device_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code VARCHAR(6);
    v_device_id UUID;
BEGIN
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    INSERT INTO public.devices (
        restaurant_id,
        name,
        device_type,
        pairing_code,
        pairing_expires_at,
        is_paired,
        status
    )
    VALUES (
        p_restaurant_id,
        p_device_name,
        p_device_type,
        v_code,
        NOW() + INTERVAL '15 minutes',
        false,
        'offline'
    )
    RETURNING id INTO v_device_id;

    RETURN jsonb_build_object(
        'device_id', v_device_id,
        'pairing_code', v_code,
        'expires_at', NOW() + INTERVAL '15 minutes'
    );
END;
$$;

-- Function: Pair Device with 6-Digit Code
CREATE OR REPLACE FUNCTION public.pair_device_with_code(p_pairing_code VARCHAR(6))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device RECORD;
    v_restaurant RECORD;
BEGIN
    SELECT * INTO v_device 
    FROM public.devices 
    WHERE pairing_code = p_pairing_code 
      AND is_paired = false 
      AND pairing_expires_at > NOW();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired pairing code.');
    END IF;

    SELECT * INTO v_restaurant FROM public.restaurants WHERE id = v_device.restaurant_id;

    UPDATE public.devices
    SET is_paired = true,
        status = 'online',
        last_heartbeat = NOW(),
        pairing_code = NULL
    WHERE id = v_device.id;

    RETURN jsonb_build_object(
        'success', true,
        'device_id', v_device.id,
        'device_name', v_device.name,
        'device_type', v_device.device_type,
        'restaurant_id', v_restaurant.id,
        'restaurant_name', v_restaurant.name,
        'currency', v_restaurant.currency
    );
END;
$$;

-- Function: Verify Staff Floor PIN
CREATE OR REPLACE FUNCTION public.verify_staff_pin(p_restaurant_id UUID, p_pin VARCHAR(6))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT * INTO v_profile 
    FROM public.profiles 
    WHERE restaurant_id = p_restaurant_id 
      AND pin_code = p_pin 
      AND is_active = true 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN code.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'profile', jsonb_build_object(
            'id', v_profile.id,
            'full_name', v_profile.full_name,
            'role', v_profile.role,
            'language_pref', v_profile.language_pref,
            'avatar_url', v_profile.avatar_url
        )
    );
END;
$$;

-- =========================================================================
-- SUPABASE REALTIME PUBLICATION
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upsell_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
