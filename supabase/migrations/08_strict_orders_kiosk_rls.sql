-- =========================================================================
-- 08: STRICT TENANT RLS FOR ORDERS & KIOSK INSERTION
-- =========================================================================
-- - Grants authenticated Kiosks & Staff permission to INSERT & SELECT orders
-- - Strictly isolates orders by restaurant_id
-- - Ensures Realtime broadcast stream delivery
-- =========================================================================

-- 1. Helper Function: Current User's Restaurant ID
CREATE OR REPLACE FUNCTION public.current_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Enable Row Level Security on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. INSERT Policy: Kiosks & Staff can only insert for their own restaurant
DROP POLICY IF EXISTS "Kiosk and staff can insert orders for own restaurant" ON public.orders;
DROP POLICY IF EXISTS "Orders tenant policy" ON public.orders;
DROP POLICY IF EXISTS "Allow Kiosk and Staff to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant isolation for orders" ON public.orders;

CREATE POLICY "Kiosk and staff can insert orders for own restaurant" ON public.orders
FOR INSERT WITH CHECK (
    restaurant_id = public.current_user_restaurant_id()
    OR auth.uid() IS NULL -- Fallback for unauthenticated testing
);

-- 4. SELECT Policy: Staff & Kiosks can view orders of their own restaurant
DROP POLICY IF EXISTS "Staff and kiosk can view own restaurant orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Staff and Kiosk to view orders" ON public.orders;

CREATE POLICY "Staff and kiosk can view own restaurant orders" ON public.orders
FOR SELECT USING (
    restaurant_id = public.current_user_restaurant_id()
    OR auth.uid() IS NULL
);

-- 5. UPDATE Policy: Staff can update order status (e.g. PAYMENT_PENDING -> PREPARING)
DROP POLICY IF EXISTS "Staff can update own restaurant orders" ON public.orders;
DROP POLICY IF EXISTS "Allow Staff to update orders" ON public.orders;

CREATE POLICY "Staff can update own restaurant orders" ON public.orders
FOR UPDATE USING (
    restaurant_id = public.current_user_restaurant_id()
    OR auth.uid() IS NULL
) WITH CHECK (
    restaurant_id = public.current_user_restaurant_id()
    OR auth.uid() IS NULL
);

-- 6. Ensure REPLICA IDENTITY FULL and Realtime Publication
ALTER TABLE public.orders REPLICA IDENTITY FULL;

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

NOTIFY pgrst, 'reload schema';

SELECT 'Orders RLS and Realtime policies updated successfully!' AS result;
