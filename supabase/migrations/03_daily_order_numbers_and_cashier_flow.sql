-- =========================================================================
-- 03: DAILY ORDER NUMBERS, PAY_AT_CASHIER & CASHIER CONFIRMATION WORKFLOW
-- =========================================================================
-- - Daily auto-resetting order numbers (#101, #102, #142... resets at 00:00)
-- - Strict status machine: PAYMENT_PENDING -> PREPARING -> READY -> COMPLETED
-- - Stored procedures for atomic Kiosk order creation & Cashier payment confirmation
-- =========================================================================

-- 1. Ensure columns exist on orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS daily_order_number INT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- 2. Index for high-performance Cashier Realtime queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status 
ON public.orders(restaurant_id, status, created_at DESC);

-- 3. Daily Resetting Sequence Trigger Function (#101, #102, #142... resetting at 00:00)
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

DROP TRIGGER IF EXISTS trg_set_daily_order_number ON public.orders;
CREATE TRIGGER trg_set_daily_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = 0)
    EXECUTE PROCEDURE public.set_daily_order_number();

-- 4. Stored Procedure: Create Kiosk Order
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

-- 5. Stored Procedure: Confirm Cashier Payment & Send to Kitchen
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

SELECT 'Migration 03 (Daily Order Numbers & Cashier Flow) executed successfully!' AS result;
