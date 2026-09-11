-- =========================================================================
-- 07: SUPABASE STORAGE BUCKET FOR MENU IMAGES
-- =========================================================================
-- - Creates public storage bucket 'menu-images'
-- - Grants public read access and authenticated admin upload/delete access
-- =========================================================================

-- 1. Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS Policies
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
CREATE POLICY "Public can view menu images" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated staff can upload menu images" ON storage.objects;
CREATE POLICY "Authenticated staff can upload menu images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated staff can update menu images" ON storage.objects;
CREATE POLICY "Authenticated staff can update menu images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated staff can delete menu images" ON storage.objects;
CREATE POLICY "Authenticated staff can delete menu images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);

SELECT 'Storage bucket menu-images configured successfully!' AS result;
