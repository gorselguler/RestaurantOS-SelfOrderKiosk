-- =========================================================================
-- MIGRATION 12: Menu Items Customizations JSONB Failsafe & Default Setup
-- =========================================================================

-- 1. Ensure the customizations column exists on menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]'::jsonb;

-- 2. Update any existing NULL or uninitialized rows to valid empty JSON array
UPDATE public.menu_items 
SET customizations = '[]'::jsonb 
WHERE customizations IS NULL;

-- 3. Enforce DEFAULT '[]'::jsonb for all future inserts
ALTER TABLE public.menu_items 
ALTER COLUMN customizations SET DEFAULT '[]'::jsonb;

-- 4. Enforce NOT NULL constraint so customizations is always a valid JSON array
ALTER TABLE public.menu_items 
ALTER COLUMN customizations SET NOT NULL;

-- 5. Create or maintain GIN index for high-speed JSONB queries
CREATE INDEX IF NOT EXISTS idx_menu_items_customizations 
ON public.menu_items USING gin (customizations);

-- 6. Schema documentation comment
COMMENT ON COLUMN public.menu_items.customizations IS 
'Stores product customization / modifier groups. Schema: [{ id: string, name: string, type: "single"|"multiple", required: boolean, maxSelections: number, options: [{ id: string, name: string, price: number }] }]';
