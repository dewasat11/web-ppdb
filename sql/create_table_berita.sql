-- ===================================================================
-- Tabel: berita (Bilingual News/Articles)
-- ===================================================================
-- Deskripsi: Menyimpan berita/artikel untuk ditampilkan di website
--            dengan dukungan bilingual (Indonesia & English)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.berita (
    id BIGSERIAL PRIMARY KEY,
    
    -- Bilingual Title
    title_id TEXT NOT NULL,
    title_en TEXT NOT NULL,
    
    -- Bilingual Content/Description
    content_id TEXT NOT NULL,
    content_en TEXT NOT NULL,
    
    -- Optional Image URL
    image_url TEXT,
    
    -- Status & Display
    is_published BOOLEAN DEFAULT false,
    published_date DATE, -- Tanggal publikasi (dapat diatur admin)
    order_index INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk sorting dan filtering
CREATE INDEX IF NOT EXISTS idx_berita_order ON public.berita(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_berita_published ON public.berita(is_published, order_index ASC);

-- RLS Policies (Row Level Security)
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published berita
CREATE POLICY "Anyone can view published berita"
ON public.berita FOR SELECT
USING (is_published = true);

-- Policy: Service role can do everything (admin)
CREATE POLICY "Service role has full access"
ON public.berita FOR ALL
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.berita TO anon, authenticated;
GRANT ALL ON public.berita TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.berita_id_seq TO service_role;

-- Sample data (optional)
INSERT INTO public.berita (title_id, title_en, content_id, content_en, is_published, order_index)
VALUES 
(
    'Selamat Datang Santri Baru 2026',
    'Welcome New Students 2026',
    'Pondok Pesantren Al Ikhsan Beji menyambut santri baru tahun ajaran 2026/2027 dengan penuh suka cita. Semoga santri baru dapat beradaptasi dengan baik dan meraih prestasi gemilang.',
    'Al Ikhsan Beji Islamic Boarding School welcomes new students for the 2026/2027 academic year with great joy. May new students adapt well and achieve brilliant achievements.',
    true,
    1
),
(
    'Kegiatan Tahfidz Al-Qur''an',
    'Quran Memorization Activities',
    'Program tahfidz Al-Qur''an terus berjalan dengan lancar. Para santri menunjukkan semangat tinggi dalam menghafal Al-Qur''an. Alhamdulillah, sudah ada beberapa santri yang menyelesaikan hafalan 30 juz.',
    'The Quran memorization program continues to run smoothly. Students show high enthusiasm in memorizing the Quran. Alhamdulillah, several students have completed memorizing 30 juz.',
    true,
    2
),
(
    'Prestasi Santri di Lomba Tahfidz Regional',
    'Student Achievement in Regional Tahfidz Competition',
    'Alhamdulillah, santri kami berhasil meraih juara 1 di lomba tahfidz tingkat regional. Ini merupakan prestasi membanggakan yang membuktikan kualitas pendidikan di pondok kami.',
    'Alhamdulillah, our students successfully won 1st place in the regional tahfidz competition. This is a proud achievement that proves the quality of education at our boarding school.',
    true,
    3
);

-- Verify insertion
SELECT id, title_id, title_en, is_published, order_index 
FROM public.berita 
ORDER BY order_index;

COMMENT ON TABLE public.berita IS 'Tabel berita/artikel bilingual untuk website PPDSB';
COMMENT ON COLUMN public.berita.title_id IS 'Judul berita dalam Bahasa Indonesia';
COMMENT ON COLUMN public.berita.title_en IS 'Judul berita dalam Bahasa Inggris';
COMMENT ON COLUMN public.berita.content_id IS 'Konten berita dalam Bahasa Indonesia';
COMMENT ON COLUMN public.berita.content_en IS 'Konten berita dalam Bahasa Inggris';
COMMENT ON COLUMN public.berita.image_url IS 'URL gambar berita (opsional)';
COMMENT ON COLUMN public.berita.is_published IS 'Status publikasi berita';
COMMENT ON COLUMN public.berita.order_index IS 'Urutan tampilan berita';

