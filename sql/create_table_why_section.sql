-- Create table for Why Section (Narasi)
-- Stores the content for the "Why Section" on the homepage

CREATE TABLE IF NOT EXISTS why_section (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?',
  subtitle TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default content (only if table is empty)
INSERT INTO why_section (title, subtitle, content)
SELECT 
  'Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?',
  'Pendidikan islami terpadu: tahfidz Al-Qur''an, akhlak mulia, dan ilmu pengetahuan',
  'Bergabunglah dengan Pondok Pesantren Al Ikhsan Beji untuk mendapatkan pendidikan islami terpadu yang membentuk karakter santri yang berakhlak mulia. Program tahfidz Al-Qur''an dengan metode terbukti akan membimbing santri menghafal Al-Qur''an dengan tartil dan pemahaman makna. Dengan pendampingan 24 jam, kami membentuk karakter santri yang ta''at beribadah dan santun dalam pergaulan. Fasilitas asrama yang nyaman dilengkapi dengan masjid, ruang belajar, perpustakaan, dan fasilitas olahraga yang lengkap untuk mendukung proses belajar mengajar yang optimal.'
WHERE NOT EXISTS (SELECT 1 FROM why_section);

-- Enable RLS (Row Level Security)
ALTER TABLE why_section ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Why Section is publicly readable"
  ON why_section
  FOR SELECT
  USING (true);

-- Policy: Block all modifications for anon/auth (only service role can modify)
-- Note: Service role bypasses RLS, so this policy only blocks anon/authenticated
-- Updates will be done via API with service_role=True
CREATE POLICY "Why Section inserts blocked for anon/auth"
  ON why_section
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Why Section updates blocked for anon/auth"
  ON why_section
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Why Section deletes blocked for anon/auth"
  ON why_section
  FOR DELETE
  USING (false);

-- Grant permissions
GRANT SELECT ON why_section TO anon;
GRANT SELECT ON why_section TO authenticated;

COMMENT ON TABLE why_section IS 'Stores Why Section narasi content for homepage';
COMMENT ON COLUMN why_section.title IS 'Judul utama Why Section';
COMMENT ON COLUMN why_section.subtitle IS 'Subtitle atau deskripsi singkat (opsional)';
COMMENT ON COLUMN why_section.content IS 'Konten narasi lengkap (text biasa, bukan card)';

