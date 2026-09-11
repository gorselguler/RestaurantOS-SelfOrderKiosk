-- =========================================================================
-- 10: UNIFY ALL ORDER CHECK CONSTRAINTS (CASE-INSENSITIVE & FLEXIBLE)
-- =========================================================================
-- - Updates payment_status, payment_method, status, order_type, and source checks
-- - Supports both UPPERCASE and lowercase values seamlessly
-- =========================================================================

-- 1. Payment Status Check
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN (
    'UNPAID', 'unpaid', 
    'PAID', 'paid', 
    'PENDING', 'pending', 
    'REFUNDED', 'refunded', 
    'FAILED', 'failed'
));

-- 2. Payment Method Check
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN (
    'PAY_AT_CASHIER', 'pay_at_cashier',
    'CASH', 'cash', 
    'CARD', 'card', 
    'kiosk_pos', 'KIOSK_POS',
    'blik', 'BLIK', 
    'apple_pay', 'APPLE_PAY', 
    'online', 'ONLINE'
));

-- 3. Order Status Check
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'PAYMENT_PENDING', 'payment_pending',
    'PENDING', 'pending', 
    'PREPARING', 'preparing', 
    'READY', 'ready', 
    'COMPLETED', 'completed', 
    'CANCELLED', 'cancelled', 
    'DELIVERED', 'delivered'
));

-- 4. Order Type Check
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check 
CHECK (order_type IN (
    'dine_in', 'DINE_IN',
    'takeaway', 'TAKEAWAY',
    'delivery', 'DELIVERY'
));

-- 5. Order Source Check
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_source_check 
CHECK (source IN (
    'kiosk', 'KIOSK',
    'pos', 'POS',
    'qr', 'QR',
    'online', 'ONLINE'
));

NOTIFY pgrst, 'reload schema';

SELECT 'All order check constraints unified successfully!' AS result;
