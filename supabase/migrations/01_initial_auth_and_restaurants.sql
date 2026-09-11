-- =========================================================================
-- 01: INITIAL AUTH, RESTAURANTS & PROFILES
-- =========================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
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

-- 3. Staff Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Safe Column Alterations in case table already existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_code VARCHAR(6) DEFAULT '1234';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_pref VARCHAR(5) DEFAULT 'tr';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Staff Member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_pin ON public.profiles(restaurant_id, pin_code);

-- 4. Row Level Security (RLS)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "Users can view restaurant profiles" ON public.profiles;
CREATE POLICY "Users can view restaurant profiles" ON public.profiles
FOR ALL USING (
    id = auth.uid() OR restaurant_id = public.current_user_restaurant_id()
);

DROP POLICY IF EXISTS "Users can view own restaurant" ON public.restaurants;
CREATE POLICY "Users can view own restaurant" ON public.restaurants
FOR ALL USING (
    id = public.current_user_restaurant_id()
);

-- 5. Trigger Function: New User Signup Handler
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
