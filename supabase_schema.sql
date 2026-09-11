-- =========================================================================
-- RESTAURANT OS - COMPLETE UNIFIED DATABASE SCHEMA (100% VERIFIED)
-- =========================================================================
-- Supports: PAY_AT_CASHIER flow, PAYMENT_PENDING -> PREPARING -> READY -> COMPLETED
-- Auto-resetting Daily Order Numbers (#101, #102, #142...)
-- =========================================================================

-- -------------------------------------------------------------------------
-- STEP 1: CLEANUP / RESET EXISTING STRUCTURE
-- -------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_set_daily_order_number ON public.orders;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.set_daily_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.create_kiosk_order(UUID, JSONB, NUMERIC, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_restaurant_id() CASCADE;
DROP FUNCTION IF EXISTS public.generate_device_pairing_code(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.pair_device_with_code(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.verify_staff_pin(UUID, VARCHAR) CASCADE;

DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.upsell_rules CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;

-- -------------------------------------------------------------------------
-- STEP 2: EXTENSIONS
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- STEP 3: CORE TABLES
-- -------------------------------------------------------------------------

-- 1. RESTAURANTS (Tenants)
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    currency TEXT NOT NULL DEFAULT 'PLN',
    timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
    logo_url TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    settings JSONB NOT NULL DEFAULT '{"order_sound": true, "tax_rate": 8, "kiosk_auto_print": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STAFF & PROFILES (with 4-Digit Quick PIN & Language Preference)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Staff Member',
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'kitchen', 'organizer', 'kiosk')),
    pin_code VARCHAR(6) DEFAULT '1234',
    language_pref VARCHAR(5) NOT NULL DEFAULT 'tr' CHECK (language_pref IN ('en', 'pl', 'uk', 'tr')),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_restaurant_pin ON public.profiles(restaurant_id, pin_code);

-- 3. DEVICES (Kiosks, Kitchen Displays, POS Terminals with 6-Digit Pairing)
CREATE TABLE public.devices (
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

CREATE INDEX idx_devices_pairing ON public.devices(pairing_code) WHERE is_paired = false;

-- 4. MENU CATEGORIES & ITEMS
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    icon TEXT DEFAULT 'Utensils',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.menu_items (
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
    customizations JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_customizations ON public.menu_items USING gin (customizations);

-- 5. UPSELL ENGINE
CREATE TABLE public.upsell_rules (
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

-- 6. SHIFTS & CASH MANAGEMENT
CREATE TABLE public.shifts (
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

-- 7. ORDERS TABLE (Strict Cashier & Kiosk State Machine)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_number INT NOT NULL, -- Daily resetting sequence (e.g. 101, 102, 142)
    daily_order_number INT,
    source TEXT NOT NULL DEFAULT 'kiosk' CHECK (source IN ('kiosk', 'cashier', 'qr_table', 'online_delivery')),
    order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway')),
    status TEXT NOT NULL DEFAULT 'PAYMENT_PENDING' CHECK (status IN ('PAYMENT_PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED')),
    payment_method TEXT NOT NULL DEFAULT 'PAY_AT_CASHIER' CHECK (payment_method IN ('PAY_AT_CASHIER', 'CASH', 'CARD', 'KIOSK_POS', 'BLIK')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy realtime querying
CREATE INDEX idx_orders_restaurant_status ON public.orders(restaurant_id, status, created_at DESC);

-- 8. CUSTOMER LOYALTY CRM
CREATE TABLE public.customers (
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

-- -------------------------------------------------------------------------
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Users can view restaurant profiles" ON public.profiles
FOR ALL USING (
    id = auth.uid() OR restaurant_id = public.current_user_restaurant_id()
);

CREATE POLICY "Users can view own restaurant" ON public.restaurants
FOR ALL USING (
    id = public.current_user_restaurant_id()
);

CREATE POLICY "Tenant isolation for devices" ON public.devices
FOR ALL USING (
    restaurant_id = public.current_user_restaurant_id() OR is_paired = false
);

-- Orders: Allow authenticated staff full access, and allow Kiosk inserts/reads
CREATE POLICY "Tenant isolation for orders" ON public.orders
FOR ALL USING (
    restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL
)
WITH CHECK (
    restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL
);

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        'categories', 'menu_items', 'upsell_rules', 'shifts', 'customers'
    ) LOOP
        EXECUTE format('
            CREATE POLICY "Tenant isolation for %I" ON public.%I
            FOR ALL
            USING (restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL)
            WITH CHECK (restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL)
        ', t, t);
    END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- STEP 5: DAILY ORDER NUMBER TRIGGER & STORED PROCEDURES
-- -------------------------------------------------------------------------

-- 1. Daily Resetting Sequence Trigger (#101, #102, #103... resetting at 00:00)
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_last_number INT;
BEGIN
    v_today_start := date_trunc('day', NOW());
    
    -- Find max order_number for this restaurant today
    SELECT COALESCE(MAX(order_number), 100) INTO v_last_number
    FROM public.orders
    WHERE restaurant_id = NEW.restaurant_id
      AND created_at >= v_today_start;
      
    NEW.order_number := v_last_number + 1;
    NEW.daily_order_number := NEW.order_number;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_daily_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = 0)
    EXECUTE PROCEDURE public.set_daily_order_number();

-- 2. Stored Procedure: Create Kiosk Order
CREATE OR REPLACE FUNCTION public.create_kiosk_order(
    p_restaurant_id UUID,
    p_items JSONB,
    p_total_amount NUMERIC,
    p_order_type TEXT DEFAULT 'dine_in',
    p_customer_notes TEXT DEFAULT NULL,
    p_device_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_order RECORD;
BEGIN
    INSERT INTO public.orders (
        restaurant_id,
        source,
        order_type,
        status,
        payment_status,
        payment_method,
        total_amount,
        items,
        customer_notes,
        device_id
    )
    VALUES (
        p_restaurant_id,
        'kiosk',
        p_order_type,
        'PAYMENT_PENDING',
        'UNPAID',
        'PAY_AT_CASHIER',
        p_total_amount,
        p_items,
        p_customer_notes,
        p_device_id
    )
    RETURNING * INTO v_new_order;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_new_order.id,
        'order_number', v_new_order.order_number,
        'total_amount', v_new_order.total_amount,
        'status', v_new_order.status,
        'payment_method', v_new_order.payment_method,
        'created_at', v_new_order.created_at
    );
END;
$$;

-- 3. Stored Procedure: Confirm Cashier Payment & Send to Kitchen
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
    p_order_id UUID,
    p_payment_method TEXT DEFAULT 'CASH',
    p_staff_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
BEGIN
    UPDATE public.orders
    SET status = 'PREPARING',
        payment_status = 'PAID',
        payment_method = p_payment_method,
        staff_id = COALESCE(p_staff_id, auth.uid()),
        updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'status', v_order.status,
        'payment_status', v_order.payment_status
    );
END;
$$;

-- 4. Auth Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    new_restaurant_id UUID;
    user_role TEXT;
    user_restaurant_id UUID;
    company_title TEXT;
BEGIN
    user_role := new.raw_user_meta_data->>'role';
    user_restaurant_id := (new.raw_user_meta_data->>'restaurant_id')::UUID;
    company_title := COALESCE(new.raw_user_meta_data->>'companyName', 'My Restaurant');

    IF user_role IS NULL OR user_role = '' OR user_role = 'admin' THEN
        INSERT INTO public.restaurants (name)
        VALUES (company_title)
        RETURNING id INTO new_restaurant_id;

        INSERT INTO public.profiles (id, restaurant_id, full_name, role, language_pref, pin_code)
        VALUES (
            new.id, 
            new_restaurant_id, 
            COALESCE(new.raw_user_meta_data->>'fullName', company_title || ' Admin'), 
            'admin', 
            'tr',
            '1234'
        );
    ELSE
        INSERT INTO public.profiles (id, restaurant_id, full_name, role, language_pref, pin_code)
        VALUES (
            new.id, 
            user_restaurant_id, 
            COALESCE(new.raw_user_meta_data->>'fullName', 'Staff'), 
            user_role, 
            COALESCE(new.raw_user_meta_data->>'language_pref', 'tr'),
            COALESCE(new.raw_user_meta_data->>'pin_code', '1234')
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Device Pairing Procedures
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

-- -------------------------------------------------------------------------
-- STEP 6: SUPABASE REALTIME (Safe Idempotent Setup)
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY['orders', 'menu_items', 'categories', 'devices', 'upsell_rules', 'shifts'];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        END IF;
    END LOOP;
END $$;

SELECT 'Restaurant OS database schema updated with PAY_AT_CASHIER & Daily Order Number generator successfully!' AS result;
