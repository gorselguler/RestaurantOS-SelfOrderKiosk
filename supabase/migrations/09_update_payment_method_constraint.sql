-- =========================================================================
-- 09: UPDATE PAYMENT METHOD CONSTRAINT TO SUPPORT PAY_AT_CASHIER
-- =========================================================================
-- - Expands orders_payment_method_check to accept 'PAY_AT_CASHIER', 'cash', 'card', etc.
-- =========================================================================

-- Drop existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add updated constraint allowing PAY_AT_CASHIER
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN (
    'PAY_AT_CASHIER', 
    'cash', 
    'card', 
    'kiosk_pos', 
    'blik', 
    'apple_pay', 
    'CASH', 
    'CARD', 
    'BLIK', 
    'APPLE_PAY', 
    'online'
));

NOTIFY pgrst, 'reload schema';

SELECT 'orders_payment_method_check constraint updated successfully!' AS result;
