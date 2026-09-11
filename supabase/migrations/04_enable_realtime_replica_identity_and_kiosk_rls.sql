-- =========================================================================
-- 04: ENABLE REALTIME BROADCAST, REPLICA IDENTITY & KIOSK RLS POLICIES
-- =========================================================================
-- Fixes real-time sync between /self_order_kiosk and /OS:
-- 1. Sets REPLICA IDENTITY FULL on orders for reliable Realtime payloads
-- 2. Ensures orders is in supabase_realtime publication
-- 3. Opens RLS permissions for Kiosk (anon) order creation & live listening
-- =========================================================================

-- 1. Set Replica Identity to FULL (Required for Supabase Realtime event streaming)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.shifts REPLICA IDENTITY FULL;

-- 2. Ensure supabase_realtime publication contains orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- 3. Grant RLS Permissions for Kiosks (Anon & Authenticated)
-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow Kiosks (Anon) & Staff to insert new orders
DROP POLICY IF EXISTS "Allow Kiosk and Staff to insert orders" ON public.orders;
CREATE POLICY "Allow Kiosk and Staff to insert orders" ON public.orders
FOR INSERT WITH CHECK (true);

-- Allow Kiosks and Staff to read orders (Required for Realtime broadcasts to deliver payloads)
DROP POLICY IF EXISTS "Allow Staff and Kiosk to view orders" ON public.orders;
CREATE POLICY "Allow Staff and Kiosk to view orders" ON public.orders
FOR SELECT USING (true);

-- Allow Cashier Staff to update order status (e.g. PAYMENT_PENDING -> PREPARING)
DROP POLICY IF EXISTS "Allow Staff to update orders" ON public.orders;
CREATE POLICY "Allow Staff to update orders" ON public.orders
FOR UPDATE USING (true) WITH CHECK (true);

SELECT 'Migration 04 (Realtime Replica Identity & Kiosk RLS) executed successfully!' AS result;
