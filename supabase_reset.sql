-- =========================================================================
-- RESTAURANT OS - COMPLETE DATABASE RESET & CLEANUP SCRIPT
-- =========================================================================
-- Run this script in Supabase SQL Editor to completely wipe and reset
-- all existing tables, triggers, and functions created for Restaurant OS.
-- =========================================================================

-- 1. Drop Triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_restaurant_id() CASCADE;
DROP FUNCTION IF EXISTS public.generate_device_pairing_code(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.pair_device_with_code(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.verify_staff_pin(UUID, VARCHAR) CASCADE;

-- 3. Drop Tables with CASCADE
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.upsell_rules CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;

-- Confirmation
SELECT 'All Restaurant OS tables and functions have been completely reset.' AS status;
