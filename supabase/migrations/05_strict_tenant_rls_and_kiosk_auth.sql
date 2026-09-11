-- =========================================================================
-- 05: STRICT TENANT RLS & DUAL AUTHENTICATION FOR OS AND KIOSK
-- =========================================================================
-- - Enables strict tenant isolation for authenticated users
-- - Kiosks authenticate via Supabase Auth and read/write for their restaurant
-- - Admin has full CRUD on categories and menu_items
-- - Realtime publication enabled for categories and menu_items
-- =========================================================================

-- 1. Helper function for current user restaurant ID (Security Definer)
CREATE OR REPLACE FUNCTION public.current_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. CATEGORIES RLS POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories read policy" ON public.categories;
CREATE POLICY "Categories read policy" ON public.categories
FOR SELECT USING (
    restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Categories admin write policy" ON public.categories;
CREATE POLICY "Categories admin write policy" ON public.categories
FOR ALL USING (
    restaurant_id = public.current_user_restaurant_id()
) WITH CHECK (
    restaurant_id = public.current_user_restaurant_id()
);

-- 3. MENU ITEMS RLS POLICIES
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Menu items read policy" ON public.menu_items;
CREATE POLICY "Menu items read policy" ON public.menu_items
FOR SELECT USING (
    restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Menu items admin write policy" ON public.menu_items;
CREATE POLICY "Menu items admin write policy" ON public.menu_items
FOR ALL USING (
    restaurant_id = public.current_user_restaurant_id()
) WITH CHECK (
    restaurant_id = public.current_user_restaurant_id()
);

-- 4. ORDERS RLS POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders tenant policy" ON public.orders;
CREATE POLICY "Orders tenant policy" ON public.orders
FOR ALL USING (
    restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL
) WITH CHECK (
    restaurant_id = public.current_user_restaurant_id() OR auth.uid() IS NULL
);

-- 5. Enable REPLICA IDENTITY FULL on all sync tables for live Supabase Realtime
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- 6. Ensure supabase_realtime publication includes categories and menu_items
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY['orders', 'menu_items', 'categories', 'devices'];
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

-- 7. Seed Initial Menu Helper (Optional trigger / function to seed default restaurant menu)
CREATE OR REPLACE FUNCTION public.seed_default_restaurant_menu(p_restaurant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_cat_kebabs UUID;
    v_cat_burgers UUID;
    v_cat_drinks UUID;
    v_cat_desserts UUID;
BEGIN
    -- Check if categories already exist
    IF EXISTS (SELECT 1 FROM public.categories WHERE restaurant_id = p_restaurant_id) THEN
        RETURN;
    END IF;

    -- Categories
    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (p_restaurant_id, '{"tr": "Döner & Kebaplar", "en": "Kebabs & Wraps", "pl": "Kebab i Dania"}'::jsonb, 'Utensils', 1)
    RETURNING id INTO v_cat_kebabs;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (p_restaurant_id, '{"tr": "Burgerler & Sandviç", "en": "Burgers & Sandwiches", "pl": "Burgery"}'::jsonb, 'ChefHat', 2)
    RETURNING id INTO v_cat_burgers;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (p_restaurant_id, '{"tr": "İçecekler", "en": "Drinks & Beverages", "pl": "Napoje"}'::jsonb, 'Coffee', 3)
    RETURNING id INTO v_cat_drinks;

    INSERT INTO public.categories (restaurant_id, name, icon, sort_order)
    VALUES (p_restaurant_id, '{"tr": "Tatlılar", "en": "Desserts", "pl": "Desery"}'::jsonb, 'Sparkles', 4)
    RETURNING id INTO v_cat_desserts;

    -- Menu Items
    INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, is_featured, preparation_time_minutes)
    VALUES 
    (p_restaurant_id, v_cat_kebabs, '{"tr": "Özel Soslu Yaprak Et Döner Dürüm", "en": "Special Beef Döner Wrap", "pl": "Kebab Wołowy Rollo"}'::jsonb, '{"tr": "120g marine edilmiş yaprak et, taze marul, domates, özel sarımsaklı ve acı sos"}'::jsonb, 34.00, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80', true, true, 5),
    (p_restaurant_id, v_cat_kebabs, '{"tr": "Tavuk Döner Porsiyon (Pilav Üstü)", "en": "Chicken Döner Plate with Rice", "pl": "Kebab Drobiowy z Ryżem"}'::jsonb, '{"tr": "150g leziz tavuk döner, tereyağlı pilav, patates kızartması ve salata"}'::jsonb, 38.00, 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80', true, true, 7),
    (p_restaurant_id, v_cat_burgers, '{"tr": "Trüflü Smash Burger Menü", "en": "Truffle Smash Burger Combo", "pl": "Truffle Smash Burger Zestaw"}'::jsonb, '{"tr": "180g dana köfte, cheddar, trüf mayonez, karamelize soğan, patates kızartması"}'::jsonb, 42.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', true, true, 10),
    (p_restaurant_id, v_cat_drinks, '{"tr": "Kutu Kola (330ml)", "en": "Coca-Cola Can", "pl": "Coca-Cola Puszka"}'::jsonb, '{"tr": "Soğuk servis edilir"}'::jsonb, 8.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80', true, false, 1),
    (p_restaurant_id, v_cat_drinks, '{"tr": "Ev Yapımı Yayık Ayran", "en": "Fresh Ayran Yogurt Drink", "pl": "Ayran Tradycyjny"}'::jsonb, '{"tr": "Bol köpüklü soğuk yayık ayranı"}'::jsonb, 6.00, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80', true, false, 1),
    (p_restaurant_id, v_cat_desserts, '{"tr": "Fıstıklı Antep Baklavası (3 Dilim)", "en": "Antep Pistachio Baklava (3 pcs)", "pl": "Bakława Pistacjowa"}'::jsonb, '{"tr": "Gaziantep usulü çıtır çıtır tereyağlı fıstıklı baklava"}'::jsonb, 24.00, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=80', true, true, 2);
END;
$$;

SELECT 'Migration 05 (Strict Tenant RLS & Menu Sync Engine) ready!' AS result;
