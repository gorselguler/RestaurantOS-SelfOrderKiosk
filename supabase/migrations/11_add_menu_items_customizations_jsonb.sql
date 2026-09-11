-- =========================================================================
-- MIGRATION 11: Add & Standardize JSONB Customizations / Modifiers Engine
-- =========================================================================

-- 1. Ensure customizations column exists with default '[]'::jsonb
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS customizations JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Ensure default is '[]'::jsonb for newly created rows
ALTER TABLE public.menu_items 
ALTER COLUMN customizations SET DEFAULT '[]'::jsonb;

-- 3. GIN index for high-performance JSONB querying
CREATE INDEX IF NOT EXISTS idx_menu_items_customizations 
ON public.menu_items USING gin (customizations);

-- 4. Add comment for standard JSONB structure documentation
COMMENT ON COLUMN public.menu_items.customizations IS 
'Array of modifier groups: [{ id: string, name: string, type: "single" | "multiple", required?: boolean, maxSelections?: number, options: [{ id: string, name: string, price: number }] }]';
