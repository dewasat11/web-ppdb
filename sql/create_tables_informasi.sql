-- ============================================================
-- Informasi Pages Content Tables
-- Tables to support CRUD for Alur, Syarat, Biaya, Brosur, Kontak pages
-- ============================================================

-- =========================
-- 1. Alur Pendaftaran Steps
-- =========================
CREATE TABLE IF NOT EXISTS alur_pendaftaran_steps (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE alur_pendaftaran_steps ADD COLUMN IF NOT EXISTS title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE alur_pendaftaran_steps ADD COLUMN IF NOT EXISTS description_en TEXT NOT NULL DEFAULT '';

UPDATE alur_pendaftaran_steps
SET
  title_en = CASE
    WHEN title_en IS NULL OR title_en = '' THEN title
    ELSE title_en
  END,
  description_en = CASE
    WHEN description_en IS NULL OR description_en = '' THEN description
    ELSE description_en
  END;

CREATE INDEX IF NOT EXISTS idx_alur_steps_order ON alur_pendaftaran_steps(order_index);

INSERT INTO alur_pendaftaran_steps (title, description, title_en, description_en, order_index)
SELECT title, description, title_en, description_en, order_index FROM (VALUES
  (
    'Pendaftaran Online',
    'Calon santri mengisi formulir pendaftaran secara online melalui situs web ini.',
    'Online Registration',
    'Prospective students complete the registration form online through this website.',
    1
  ),
  (
    'Pembayaran Biaya Pendaftaran',
    'Melakukan pembayaran biaya pendaftaran sesuai dengan instruksi yang diberikan.',
    'Registration Fee Payment',
    'Settle the registration fee according to the instructions provided.',
    2
  ),
  (
    'Verifikasi Dokumen',
    'Mengunggah dokumen-dokumen yang diperlukan untuk verifikasi.',
    'Document Verification',
    'Upload the required documents for verification.',
    3
  ),
  (
    'Tes Seleksi',
    'Mengikuti tes seleksi yang diselenggarakan oleh pondok pesantren.',
    'Selection Test',
    'Attend the selection test organised by the boarding school.',
    4
  ),
  (
    'Pengumuman Hasil',
    'Melihat hasil tes seleksi melalui situs web.',
    'Result Announcement',
    'Check the selection results through the website.',
    5
  ),
  (
    'Daftar Ulang',
    'Melakukan daftar ulang bagi calon santri yang dinyatakan lolos seleksi.',
    'Re-registration',
    'Complete re-registration for candidates who have passed the selection.',
    6
  )
) AS seed(title, description, title_en, description_en, order_index)
WHERE NOT EXISTS (SELECT 1 FROM alur_pendaftaran_steps);

ALTER TABLE alur_pendaftaran_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alur steps readable" ON alur_pendaftaran_steps;
CREATE POLICY "Alur steps readable"
  ON alur_pendaftaran_steps
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Alur steps insert blocked" ON alur_pendaftaran_steps;
CREATE POLICY "Alur steps insert blocked"
  ON alur_pendaftaran_steps
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Alur steps update blocked" ON alur_pendaftaran_steps;
CREATE POLICY "Alur steps update blocked"
  ON alur_pendaftaran_steps
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Alur steps delete blocked" ON alur_pendaftaran_steps;
CREATE POLICY "Alur steps delete blocked"
  ON alur_pendaftaran_steps
  FOR DELETE
  USING (false);

GRANT SELECT ON alur_pendaftaran_steps TO anon;
GRANT SELECT ON alur_pendaftaran_steps TO authenticated;

COMMENT ON TABLE alur_pendaftaran_steps IS 'Langkah alur pendaftaran santri, bisa diatur lewat admin panel';
COMMENT ON COLUMN alur_pendaftaran_steps.title_en IS 'Judul langkah alur (Bahasa Inggris)';
COMMENT ON COLUMN alur_pendaftaran_steps.description_en IS 'Deskripsi langkah alur (Bahasa Inggris)';
COMMENT ON COLUMN alur_pendaftaran_steps.order_index IS 'Urutan tampil (lebih kecil = ditampilkan lebih awal)';

-- =========================
-- 2. Syarat Pendaftaran Items
-- =========================
CREATE TABLE IF NOT EXISTS syarat_pendaftaran_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE syarat_pendaftaran_items ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT '';

UPDATE syarat_pendaftaran_items
SET
  name_en = CASE
    WHEN name_en IS NULL OR name_en = '' THEN name
    ELSE name_en
  END;

CREATE INDEX IF NOT EXISTS idx_syarat_items_order ON syarat_pendaftaran_items(order_index);

INSERT INTO syarat_pendaftaran_items (name, name_en, order_index)
SELECT name, name_en, order_index FROM (VALUES
  ('Fotokopi Akta Kelahiran', 'Birth Certificate Copy', 1),
  ('Fotokopi Kartu Keluarga (KK)', 'Family Card Copy', 2),
  ('Fotokopi Ijazah terakhir (legalisir)', 'Latest Diploma Copy (legalised)', 3),
  ('Pas foto berwarna ukuran 3x4 (2 lembar)', 'Two 3x4 cm colour photographs', 4),
  ('Surat Keterangan Sehat dari dokter', 'Medical Certificate from a doctor', 5),
  ('Mengisi formulir pendaftaran', 'Completed registration form', 6),
  ('Membayar biaya pendaftaran', 'Paid registration fee', 7)
) AS seed(name, name_en, order_index)
WHERE NOT EXISTS (SELECT 1 FROM syarat_pendaftaran_items);

ALTER TABLE syarat_pendaftaran_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Syarat items readable" ON syarat_pendaftaran_items;
CREATE POLICY "Syarat items readable"
  ON syarat_pendaftaran_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Syarat items insert blocked" ON syarat_pendaftaran_items;
CREATE POLICY "Syarat items insert blocked"
  ON syarat_pendaftaran_items
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Syarat items update blocked" ON syarat_pendaftaran_items;
CREATE POLICY "Syarat items update blocked"
  ON syarat_pendaftaran_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Syarat items delete blocked" ON syarat_pendaftaran_items;
CREATE POLICY "Syarat items delete blocked"
  ON syarat_pendaftaran_items
  FOR DELETE
  USING (false);

GRANT SELECT ON syarat_pendaftaran_items TO anon;
GRANT SELECT ON syarat_pendaftaran_items TO authenticated;

COMMENT ON TABLE syarat_pendaftaran_items IS 'Daftar persyaratan dokumen pendaftaran santri baru';
COMMENT ON COLUMN syarat_pendaftaran_items.name_en IS 'Nama persyaratan dalam Bahasa Inggris';

-- =========================
-- 3. Biaya Items
-- =========================
CREATE TABLE IF NOT EXISTS biaya_items (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  amount TEXT NOT NULL,
  label_en TEXT NOT NULL DEFAULT '',
  amount_en TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE biaya_items ADD COLUMN IF NOT EXISTS label_en TEXT NOT NULL DEFAULT '';
ALTER TABLE biaya_items ADD COLUMN IF NOT EXISTS amount_en TEXT NOT NULL DEFAULT '';

UPDATE biaya_items
SET
  label_en = CASE WHEN label_en IS NULL OR label_en = '' THEN label ELSE label_en END,
  amount_en = CASE WHEN amount_en IS NULL OR amount_en = '' THEN amount ELSE amount_en END;

CREATE INDEX IF NOT EXISTS idx_biaya_items_order ON biaya_items(order_index);

INSERT INTO biaya_items (label, amount, label_en, amount_en, order_index)
SELECT label, amount, label_en, amount_en, order_index FROM (VALUES
  ('Biaya Pendaftaran', 'Rp 300.000,-', 'Registration Fee', 'IDR 300,000', 1),
  ('Uang Pangkal (Sarana & Prasarana)', 'Rp 3.000.000,-', 'Facility & Infrastructure Fee', 'IDR 3,000,000', 2),
  ('Uang DSP (Dana Sumbangan Pendidikan)', 'Rp 2.500.000,-', 'Education Contribution Fee', 'IDR 2,500,000', 3),
  ('Uang Buku & Seragam (per tahun)', 'Rp 1.500.000,-', 'Books & Uniform (per year)', 'IDR 1,500,000', 4),
  ('SPP Bulanan', 'Rp 750.000,-', 'Monthly Tuition', 'IDR 750,000', 5)
) AS seed(label, amount, label_en, amount_en, order_index)
WHERE NOT EXISTS (SELECT 1 FROM biaya_items);

ALTER TABLE biaya_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Biaya items readable" ON biaya_items;
CREATE POLICY "Biaya items readable"
  ON biaya_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Biaya items insert blocked" ON biaya_items;
CREATE POLICY "Biaya items insert blocked"
  ON biaya_items
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Biaya items update blocked" ON biaya_items;
CREATE POLICY "Biaya items update blocked"
  ON biaya_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Biaya items delete blocked" ON biaya_items;
CREATE POLICY "Biaya items delete blocked"
  ON biaya_items
  FOR DELETE
  USING (false);

GRANT SELECT ON biaya_items TO anon;
GRANT SELECT ON biaya_items TO authenticated;

COMMENT ON TABLE biaya_items IS 'Rincian biaya pendaftaran dan pendidikan';
COMMENT ON COLUMN biaya_items.label_en IS 'Deskripsi biaya dalam Bahasa Inggris';
COMMENT ON COLUMN biaya_items.amount_en IS 'Nominal biaya dalam Bahasa Inggris';

-- =========================
-- 4. Brosur Items
-- =========================
CREATE TABLE IF NOT EXISTS brosur_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  button_label TEXT NOT NULL DEFAULT 'Unduh PDF',
  title_en TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  button_label_en TEXT NOT NULL DEFAULT 'Download PDF',
  button_url TEXT NOT NULL,
  icon_class TEXT NOT NULL DEFAULT 'bi bi-file-earmark-arrow-down',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE brosur_items ADD COLUMN IF NOT EXISTS title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE brosur_items ADD COLUMN IF NOT EXISTS description_en TEXT NOT NULL DEFAULT '';
ALTER TABLE brosur_items ADD COLUMN IF NOT EXISTS button_label_en TEXT NOT NULL DEFAULT 'Download PDF';

UPDATE brosur_items
SET
  title_en = CASE WHEN title_en IS NULL OR title_en = '' THEN title ELSE title_en END,
  description_en = CASE WHEN description_en IS NULL OR description_en = '' THEN description ELSE description_en END,
  button_label_en = CASE WHEN button_label_en IS NULL OR button_label_en = '' THEN button_label ELSE button_label_en END;

CREATE INDEX IF NOT EXISTS idx_brosur_items_order ON brosur_items(order_index);

INSERT INTO brosur_items (title, description, button_label, title_en, description_en, button_label_en, button_url, icon_class, order_index)
SELECT title, description, button_label, title_en, description_en, button_label_en, button_url, icon_class, order_index FROM (VALUES
  ('Brosur Umum PPDSB', 'Ringkasan seluruh unit, program, dan fasilitas Pondok Pesantren Al Ikhsan Beji.', 'Unduh PDF', 'General Prospectus', 'Overview of programmes, facilities, and admissions at Al Ikhsan Islamic Boarding School.', 'Download PDF', 'https://www.alikhsan-beji.app/downloads/brosur-ppdsb.pdf', 'bi bi-file-earmark-arrow-down', 1),
  ('Brosur Unit MTs', 'Kurikulum, kegiatan, dan fasilitas untuk santri jenjang MTs di PPDSB.', 'Unduh PDF', 'MTs Unit Prospectus', 'Curriculum, activities, and facilities for MTs level students at Al Ikhsan Islamic Boarding School.', 'Download PDF', 'https://www.alikhsan-beji.app/downloads/brosur-mts.pdf', 'bi bi-book', 2),
  ('Brosur Unit MA', 'Program akademik, peminatan, dan fasilitas untuk santri jenjang MA di PPDSB.', 'Unduh PDF', 'MA Unit Prospectus', 'Academic programmes, specialisations, and facilities for MA level students at Al Ikhsan Islamic Boarding School.', 'Download PDF', 'https://www.alikhsan-beji.app/downloads/brosur-ma.pdf', 'bi bi-award', 3)
) AS seed(title, description, button_label, title_en, description_en, button_label_en, button_url, icon_class, order_index)
WHERE NOT EXISTS (SELECT 1 FROM brosur_items);

ALTER TABLE brosur_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brosur items readable" ON brosur_items;
CREATE POLICY "Brosur items readable"
  ON brosur_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Brosur items insert blocked" ON brosur_items;
CREATE POLICY "Brosur items insert blocked"
  ON brosur_items
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Brosur items update blocked" ON brosur_items;
CREATE POLICY "Brosur items update blocked"
  ON brosur_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Brosur items delete blocked" ON brosur_items;
CREATE POLICY "Brosur items delete blocked"
  ON brosur_items
  FOR DELETE
  USING (false);

GRANT SELECT ON brosur_items TO anon;
GRANT SELECT ON brosur_items TO authenticated;

COMMENT ON TABLE brosur_items IS 'Link unduhan brosur pendaftaran';
COMMENT ON COLUMN brosur_items.title_en IS 'Judul brosur (Bahasa Inggris)';
COMMENT ON COLUMN brosur_items.description_en IS 'Deskripsi brosur (Bahasa Inggris)';
COMMENT ON COLUMN brosur_items.button_label_en IS 'Label tombol unduhan (Bahasa Inggris)';

-- =========================
-- 5. Kontak Items & Settings
-- =========================
CREATE TABLE IF NOT EXISTS kontak_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  value_en TEXT NOT NULL DEFAULT '',
  item_type TEXT NOT NULL DEFAULT 'info',
  link_url TEXT,
  icon_class TEXT NOT NULL DEFAULT 'bi bi-info-circle',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE kontak_items ADD COLUMN IF NOT EXISTS title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE kontak_items ADD COLUMN IF NOT EXISTS value_en TEXT NOT NULL DEFAULT '';

UPDATE kontak_items
SET
  title_en = CASE WHEN title_en IS NULL OR title_en = '' THEN title ELSE title_en END,
  value_en = CASE WHEN value_en IS NULL OR value_en = '' THEN value ELSE value_en END;

CREATE INDEX IF NOT EXISTS idx_kontak_items_order ON kontak_items(order_index);

INSERT INTO kontak_items (title, value, title_en, value_en, item_type, link_url, icon_class, order_index)
SELECT title, value, title_en, value_en, item_type, link_url, icon_class, order_index FROM (VALUES
  ('WhatsApp', '+62 812-3456-7890', 'WhatsApp', '+62 812-3456-7890', 'whatsapp', 'https://wa.me/6281234567890', 'bi bi-whatsapp', 1),
  ('Email', 'info@alikhsanbeji.sch.id', 'Email', 'info@alikhsanbeji.sch.id', 'email', 'mailto:info@alikhsanbeji.sch.id', 'bi bi-envelope-fill', 2),
  ('Alamat', 'Jl. Raya Beji No. 100, Depok, Jawa Barat', 'Address', 'Jl. Raya Beji No. 100, Depok, West Java', 'address', NULL, 'bi bi-geo-alt-fill', 3)
) AS seed(title, value, title_en, value_en, item_type, link_url, icon_class, order_index)
WHERE NOT EXISTS (SELECT 1 FROM kontak_items);

ALTER TABLE kontak_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kontak items readable" ON kontak_items;
CREATE POLICY "Kontak items readable"
  ON kontak_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Kontak items insert blocked" ON kontak_items;
CREATE POLICY "Kontak items insert blocked"
  ON kontak_items
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Kontak items update blocked" ON kontak_items;
CREATE POLICY "Kontak items update blocked"
  ON kontak_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Kontak items delete blocked" ON kontak_items;
CREATE POLICY "Kontak items delete blocked"
  ON kontak_items
  FOR DELETE
  USING (false);

GRANT SELECT ON kontak_items TO anon;
GRANT SELECT ON kontak_items TO authenticated;

COMMENT ON TABLE kontak_items IS 'Saluran kontak resmi pondok pesantren';
COMMENT ON COLUMN kontak_items.title_en IS 'Judul kontak (Bahasa Inggris)';
COMMENT ON COLUMN kontak_items.value_en IS 'Nilai kontak (Bahasa Inggris)';

CREATE TABLE IF NOT EXISTS kontak_settings (
  id SERIAL PRIMARY KEY,
  map_embed_url TEXT NOT NULL DEFAULT 'https://www.google.com/maps/embed?pb=',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO kontak_settings (map_embed_url)
SELECT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.176460965377!2d106.8291583147699!3d-6.368685995393539!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec0e7e1c1f1f%3A0x6d9f7e7e7e7e7e7e!2sPondok%20Pesantren%20Al%20Ikhsan!5e0!3m2!1sen!2sid!4v1678901234567!5m2!1sen!2sid'
WHERE NOT EXISTS (SELECT 1 FROM kontak_settings);

ALTER TABLE kontak_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kontak settings readable" ON kontak_settings;
CREATE POLICY "Kontak settings readable"
  ON kontak_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Kontak settings insert blocked" ON kontak_settings;
CREATE POLICY "Kontak settings insert blocked"
  ON kontak_settings
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Kontak settings update blocked" ON kontak_settings;
CREATE POLICY "Kontak settings update blocked"
  ON kontak_settings
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Kontak settings delete blocked" ON kontak_settings;
CREATE POLICY "Kontak settings delete blocked"
  ON kontak_settings
  FOR DELETE
  USING (false);

GRANT SELECT ON kontak_settings TO anon;
GRANT SELECT ON kontak_settings TO authenticated;

COMMENT ON TABLE kontak_settings IS 'Pengaturan tambahan halaman kontak (embed map, dsb)';
