-- ===================================================================
-- Migration: Add published_date column to berita table
-- ===================================================================
-- Menambahkan kolom published_date untuk mengatur tanggal publikasi berita
-- ===================================================================

-- Add published_date column (nullable, bisa diisi atau tidak)
ALTER TABLE public.berita 
ADD COLUMN IF NOT EXISTS published_date DATE;

-- Set default untuk berita yang sudah ada (gunakan created_at)
UPDATE public.berita 
SET published_date = created_at::DATE 
WHERE published_date IS NULL;

-- Add comment
COMMENT ON COLUMN public.berita.published_date IS 'Tanggal publikasi berita (dapat diatur admin, default: created_at)';

-- Verify
SELECT 
    id, 
    title_id, 
    is_published, 
    published_date, 
    created_at::DATE as created_date
FROM public.berita 
ORDER BY created_at DESC 
LIMIT 5;

