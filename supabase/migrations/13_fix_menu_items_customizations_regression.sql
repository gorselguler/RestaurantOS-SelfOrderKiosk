-- =========================================================================
-- MIGRATION 13: Deep Fix & Regression-proof for menu_items JSONB Customizations
-- Run this in Supabase SQL Editor to fully stabilize the schema.
-- =========================================================================

-- STEP 1: Ensure the column exists and is not null
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]'::jsonb;

-- STEP 2: Fix any NULL or malformed rows inserted by seed scripts or old code
UPDATE public.menu_items 
SET customizations = '[]'::jsonb 
WHERE customizations IS NULL 
   OR jsonb_typeof(customizations) <> 'array';

-- STEP 3: Lock in DEFAULT + NOT NULL at schema level
ALTER TABLE public.menu_items 
ALTER COLUMN customizations SET DEFAULT '[]'::jsonb;

ALTER TABLE public.menu_items 
ALTER COLUMN customizations SET NOT NULL;

-- STEP 4: Ensure GIN index exists for high-performance JSONB querying
CREATE INDEX IF NOT EXISTS idx_menu_items_customizations 
ON public.menu_items USING gin (customizations);

-- STEP 5: Schema documentation
COMMENT ON COLUMN public.menu_items.customizations IS 
'JSONB array of modifier groups. Schema: [{ id: string, name: string, type: "single"|"multiple", required: boolean, maxSelections: number, options: [{ id: string, name: string, price: number }] }]. Always defaults to empty array [].';
