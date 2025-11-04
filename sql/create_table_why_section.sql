-- Create table for Why Section (Narasi)
-- Stores the content for the "Why Section" on the homepage

CREATE TABLE IF NOT EXISTS why_section (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?',
  subtitle TEXT,
  content TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT 'Why Choose Al Ikhsan Islamic Boarding School?',
  subtitle_en TEXT,
  content_en TEXT NOT NULL DEFAULT 'Join Al Ikhsan Islamic Boarding School to experience an integrated Islamic education that shapes students with noble character. Our proven tahfidz programme guides santri to memorise the Qur''an with tartil while understanding its meaning. With round-the-clock mentoring we nurture disciplined, devout, and courteous students. Comfortable dormitories complete with a mosque, classrooms, library, and sports facilities support an optimal learning environment.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure bilingual columns exist on legacy databases
ALTER TABLE why_section ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE why_section ADD COLUMN IF NOT EXISTS subtitle_en TEXT;
ALTER TABLE why_section ADD COLUMN IF NOT EXISTS content_en TEXT;

UPDATE why_section
SET
  title_en = COALESCE(NULLIF(title_en, ''), 'Why Choose Al Ikhsan Islamic Boarding School?'),
  subtitle_en = COALESCE(subtitle_en, 'Integrated Islamic education: tahfidz al-Qur''an, noble character, and knowledge'),
  content_en = COALESCE(NULLIF(content_en, ''), 'Join Al Ikhsan Islamic Boarding School to experience an integrated Islamic education that shapes students with noble character. Our proven tahfidz programme guides santri to memorise the Qur''an with tartil while understanding its meaning. With round-the-clock mentoring we nurture disciplined, devout, and courteous students. Comfortable dormitories complete with a mosque, classrooms, library, and sports facilities support an optimal learning environment.')
WHERE title_en IS NULL OR content_en IS NULL;

ALTER TABLE why_section ALTER COLUMN title_en SET DEFAULT 'Why Choose Al Ikhsan Islamic Boarding School?';
ALTER TABLE why_section ALTER COLUMN content_en SET DEFAULT 'Join Al Ikhsan Islamic Boarding School to experience an integrated Islamic education that shapes students with noble character. Our proven tahfidz programme guides santri to memorise the Qur''an with tartil while understanding its meaning. With round-the-clock mentoring we nurture disciplined, devout, and courteous students. Comfortable dormitories complete with a mosque, classrooms, library, and sports facilities support an optimal learning environment.';
ALTER TABLE why_section ALTER COLUMN title_en SET NOT NULL;
ALTER TABLE why_section ALTER COLUMN content_en SET NOT NULL;

-- Insert default content (only if table is empty)
INSERT INTO why_section (title, subtitle, content, title_en, subtitle_en, content_en)
SELECT 
  'Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?',
  'Pendidikan islami terpadu: tahfidz Al-Qur''an, akhlak mulia, dan ilmu pengetahuan',
  'Bergabunglah dengan Pondok Pesantren Al Ikhsan Beji untuk mendapatkan pendidikan islami terpadu yang membentuk karakter santri yang berakhlak mulia. Program tahfidz Al-Qur''an dengan metode terbukti akan membimbing santri menghafal Al-Qur''an dengan tartil dan pemahaman makna. Dengan pendampingan 24 jam, kami membentuk karakter santri yang ta''at beribadah dan santun dalam pergaulan. Fasilitas asrama yang nyaman dilengkapi dengan masjid, ruang belajar, perpustakaan, dan fasilitas olahraga yang lengkap untuk mendukung proses belajar mengajar yang optimal.',
  'Why Choose Al Ikhsan Islamic Boarding School?',
  'Integrated Islamic education: tahfidz al-Qur''an, noble character, and knowledge',
  'Join Al Ikhsan Islamic Boarding School to experience an integrated Islamic education that shapes students with noble character. Our proven tahfidz programme guides santri to memorise the Qur''an with tartil while understanding its meaning. With round-the-clock mentoring we nurture disciplined, devout, and courteous students. Comfortable dormitories complete with a mosque, classrooms, library, and sports facilities support an optimal learning environment.'
WHERE NOT EXISTS (SELECT 1 FROM why_section);

-- Enable RLS (Row Level Security)
ALTER TABLE why_section ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
DROP POLICY IF EXISTS "Why Section is publicly readable" ON why_section;
CREATE POLICY "Why Section is publicly readable"
  ON why_section
  FOR SELECT
  USING (true);

-- Policy: Block all modifications for anon/auth (only service role can modify)
-- Note: Service role bypasses RLS, so this policy only blocks anon/authenticated
-- Updates will be done via API with service_role=True
DROP POLICY IF EXISTS "Why Section inserts blocked for anon/auth" ON why_section;
CREATE POLICY "Why Section inserts blocked for anon/auth"
  ON why_section
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Why Section updates blocked for anon/auth" ON why_section;
CREATE POLICY "Why Section updates blocked for anon/auth"
  ON why_section
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Why Section deletes blocked for anon/auth" ON why_section;
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
COMMENT ON COLUMN why_section.title_en IS 'Primary heading for Why Section (English)';
COMMENT ON COLUMN why_section.subtitle_en IS 'Optional subtitle/description (English)';
COMMENT ON COLUMN why_section.content_en IS 'Full narrative content in English';
