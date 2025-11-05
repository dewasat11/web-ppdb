-- ===================================================================
-- Supabase Storage Setup untuk Berita Images
-- ===================================================================
-- Catatan: Bucket harus dibuat manual via Supabase Dashboard
-- File ini hanya untuk RLS Policies setelah bucket dibuat
-- ===================================================================

-- ============================================
-- STEP 1: BUAT BUCKET (Manual via Dashboard)
-- ============================================
-- 1. Buka Supabase Dashboard
-- 2. Go to Storage
-- 3. Click "New bucket"
-- 4. Name: "hero-images" (atau gunakan bucket yang sudah ada)
-- 5. Public bucket: ✅ ENABLE (sangat penting!)
-- 6. File size limit: 2 MB (atau sesuai kebutuhan)
-- 7. Allowed MIME types: image/jpeg, image/png, image/webp
-- 8. Click "Create bucket"

-- ============================================
-- STEP 2: RLS POLICIES (Jalankan SQL ini)
-- ============================================
-- Note: DROP dulu jika sudah ada, baru CREATE
-- Supabase tidak support "IF NOT EXISTS" untuk CREATE POLICY

-- Policy 1: Allow public read access (untuk homepage)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

-- Policy 2: Allow authenticated users to upload (untuk admin)
-- Note: Jika menggunakan anon key, bisa allow anon juga (lihat alternative di bawah)
DROP POLICY IF EXISTS "Authenticated can upload images" ON storage.objects;
CREATE POLICY "Authenticated can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images' 
  AND (storage.foldername(name))[1] = 'berita'
);

-- Policy 3: Allow authenticated users to update their uploads
DROP POLICY IF EXISTS "Authenticated can update images" ON storage.objects;
CREATE POLICY "Authenticated can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-images'
  AND (storage.foldername(name))[1] = 'berita'
);

-- Policy 4: Allow authenticated users to delete their uploads
DROP POLICY IF EXISTS "Authenticated can delete images" ON storage.objects;
CREATE POLICY "Authenticated can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-images'
  AND (storage.foldername(name))[1] = 'berita'
);

-- ============================================
-- ALTERNATIVE: Jika ingin allow anon upload
-- (untuk admin panel yang pakai anon key)
-- ============================================
-- Jika admin panel menggunakan anon key (bukan service_role),
-- uncomment dan jalankan policy di bawah ini:

-- DROP POLICY IF EXISTS "Authenticated can upload images" ON storage.objects;
-- DROP POLICY IF EXISTS "Anon can upload images" ON storage.objects;
-- CREATE POLICY "Anon can upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'hero-images' 
--   AND (storage.foldername(name))[1] = 'berita'
-- );

-- ============================================
-- VERIFY SETUP
-- ============================================
-- Jalankan query ini untuk verifikasi:

SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'hero-images';

-- Cek policies yang sudah dibuat:
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%images%';

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- Jika upload gagal dengan error RLS:

-- 1. Pastikan bucket adalah PUBLIC:
--    UPDATE storage.buckets 
--    SET public = true 
--    WHERE name = 'hero-images';

-- 2. Pastikan policies sudah dibuat (lihat verify query di atas)

-- 3. Jika masih error, bisa bypass RLS untuk testing (HATI-HATI!):
--    ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
--    -- Setelah testing, ENABLE kembali:
--    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLEANUP (Jika perlu)
-- ============================================
-- Hapus policies:
-- DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated can upload images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated can update images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated can delete images" ON storage.objects;

-- Hapus bucket (HATI-HATI! Semua file akan terhapus):
-- DELETE FROM storage.buckets WHERE name = 'hero-images';

