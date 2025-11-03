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
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alur_steps_order ON alur_pendaftaran_steps(order_index);

INSERT INTO alur_pendaftaran_steps (title, description, order_index)
SELECT title, description, order_index FROM (VALUES
  ('Pendaftaran Online', 'Calon santri mengisi formulir pendaftaran secara online melalui situs web ini.', 1),
  ('Pembayaran Biaya Pendaftaran', 'Melakukan pembayaran biaya pendaftaran sesuai dengan instruksi yang diberikan.', 2),
  ('Verifikasi Dokumen', 'Mengunggah dokumen-dokumen yang diperlukan untuk verifikasi.', 3),
  ('Tes Seleksi', 'Mengikuti tes seleksi yang diselenggarakan oleh pondok pesantren.', 4),
  ('Pengumuman Hasil', 'Melihat hasil tes seleksi melalui situs web.', 5),
  ('Daftar Ulang', 'Melakukan daftar ulang bagi calon santri yang dinyatakan lolos seleksi.', 6)
) AS seed(title, description, order_index)
WHERE NOT EXISTS (SELECT 1 FROM alur_pendaftaran_steps);

ALTER TABLE alur_pendaftaran_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alur steps readable"
  ON alur_pendaftaran_steps
  FOR SELECT
  USING (true);

CREATE POLICY "Alur steps insert blocked"
  ON alur_pendaftaran_steps
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Alur steps update blocked"
  ON alur_pendaftaran_steps
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Alur steps delete blocked"
  ON alur_pendaftaran_steps
  FOR DELETE
  USING (false);

GRANT SELECT ON alur_pendaftaran_steps TO anon;
GRANT SELECT ON alur_pendaftaran_steps TO authenticated;

COMMENT ON TABLE alur_pendaftaran_steps IS 'Langkah alur pendaftaran santri, bisa diatur lewat admin panel';
COMMENT ON COLUMN alur_pendaftaran_steps.order_index IS 'Urutan tampil (lebih kecil = ditampilkan lebih awal)';

-- =========================
-- 2. Syarat Pendaftaran Items
-- =========================
CREATE TABLE IF NOT EXISTS syarat_pendaftaran_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syarat_items_order ON syarat_pendaftaran_items(order_index);

INSERT INTO syarat_pendaftaran_items (name, order_index)
SELECT name, order_index FROM (VALUES
  ('Fotokopi Akta Kelahiran', 1),
  ('Fotokopi Kartu Keluarga (KK)', 2),
  ('Fotokopi Ijazah terakhir (legalisir)', 3),
  ('Pas foto berwarna ukuran 3x4 (2 lembar)', 4),
  ('Surat Keterangan Sehat dari dokter', 5),
  ('Mengisi formulir pendaftaran', 6),
  ('Membayar biaya pendaftaran', 7)
) AS seed(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM syarat_pendaftaran_items);

ALTER TABLE syarat_pendaftaran_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Syarat items readable"
  ON syarat_pendaftaran_items
  FOR SELECT
  USING (true);

CREATE POLICY "Syarat items insert blocked"
  ON syarat_pendaftaran_items
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Syarat items update blocked"
  ON syarat_pendaftaran_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Syarat items delete blocked"
  ON syarat_pendaftaran_items
  FOR DELETE
  USING (false);

GRANT SELECT ON syarat_pendaftaran_items TO anon;
GRANT SELECT ON syarat_pendaftaran_items TO authenticated;

COMMENT ON TABLE syarat_pendaftaran_items IS 'Daftar persyaratan dokumen pendaftaran santri baru';

-- =========================
-- 3. Biaya Items
-- =========================
CREATE TABLE IF NOT EXISTS biaya_items (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  amount TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biaya_items_order ON biaya_items(order_index);

INSERT INTO biaya_items (label, amount, order_index)
SELECT label, amount, order_index FROM (VALUES
  ('Biaya Pendaftaran', 'Rp 300.000,-', 1),
  ('Uang Pangkal (Sarana & Prasarana)', 'Rp 3.000.000,-', 2),
  ('Uang DSP (Dana Sumbangan Pendidikan)', 'Rp 2.500.000,-', 3),
  ('Uang Buku & Seragam (per tahun)', 'Rp 1.500.000,-', 4),
  ('SPP Bulanan', 'Rp 750.000,-', 5)
) AS seed(label, amount, order_index)
WHERE NOT EXISTS (SELECT 1 FROM biaya_items);

ALTER TABLE biaya_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Biaya items readable"
  ON biaya_items
  FOR SELECT
  USING (true);

CREATE POLICY "Biaya items insert blocked"
  ON biaya_items
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Biaya items update blocked"
  ON biaya_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Biaya items delete blocked"
  ON biaya_items
  FOR DELETE
  USING (false);

GRANT SELECT ON biaya_items TO anon;
GRANT SELECT ON biaya_items TO authenticated;

COMMENT ON TABLE biaya_items IS 'Rincian biaya pendaftaran dan pendidikan';

-- =========================
-- 4. Brosur Items
-- =========================
CREATE TABLE IF NOT EXISTS brosur_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  button_label TEXT NOT NULL DEFAULT 'Unduh PDF',
  button_url TEXT NOT NULL,
  icon_class TEXT NOT NULL DEFAULT 'bi bi-file-earmark-arrow-down',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brosur_items_order ON brosur_items(order_index);

INSERT INTO brosur_items (title, description, button_label, button_url, icon_class, order_index)
SELECT title, description, button_label, button_url, icon_class, order_index FROM (VALUES
  ('Brosur Umum PPDSB', 'Ringkasan seluruh unit, program, dan fasilitas Pondok Pesantren Al Ikhsan Beji.', 'Unduh PDF', 'https://www.alikhsan-beji.app/downloads/brosur-ppdsb.pdf', 'bi bi-file-earmark-arrow-down', 1),
  ('Brosur Unit MTs', 'Kurikulum, kegiatan, dan fasilitas untuk santri jenjang MTs di PPDSB.', 'Unduh PDF', 'https://www.alikhsan-beji.app/downloads/brosur-mts.pdf', 'bi bi-book', 2),
  ('Brosur Unit MA', 'Program akademik, peminatan, dan fasilitas untuk santri jenjang MA di PPDSB.', 'Unduh PDF', 'https://www.alikhsan-beji.app/downloads/brosur-ma.pdf', 'bi bi-award', 3)
) AS seed(title, description, button_label, button_url, icon_class, order_index)
WHERE NOT EXISTS (SELECT 1 FROM brosur_items);

ALTER TABLE brosur_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brosur items readable"
  ON brosur_items
  FOR SELECT
  USING (true);

CREATE POLICY "Brosur items insert blocked"
  ON brosur_items
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Brosur items update blocked"
  ON brosur_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Brosur items delete blocked"
  ON brosur_items
  FOR DELETE
  USING (false);

GRANT SELECT ON brosur_items TO anon;
GRANT SELECT ON brosur_items TO authenticated;

COMMENT ON TABLE brosur_items IS 'Link unduhan brosur pendaftaran';

-- =========================
-- 5. Kontak Items & Settings
-- =========================
CREATE TABLE IF NOT EXISTS kontak_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'info',
  link_url TEXT,
  icon_class TEXT NOT NULL DEFAULT 'bi bi-info-circle',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kontak_items_order ON kontak_items(order_index);

INSERT INTO kontak_items (title, value, item_type, link_url, icon_class, order_index)
SELECT title, value, item_type, link_url, icon_class, order_index FROM (VALUES
  ('WhatsApp', '+62 812-3456-7890', 'whatsapp', 'https://wa.me/6281234567890', 'bi bi-whatsapp', 1),
  ('Email', 'info@alikhsanbeji.sch.id', 'email', 'mailto:info@alikhsanbeji.sch.id', 'bi bi-envelope-fill', 2),
  ('Alamat', 'Jl. Raya Beji No. 100, Depok, Jawa Barat', 'address', NULL, 'bi bi-geo-alt-fill', 3)
) AS seed(title, value, item_type, link_url, icon_class, order_index)
WHERE NOT EXISTS (SELECT 1 FROM kontak_items);

ALTER TABLE kontak_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kontak items readable"
  ON kontak_items
  FOR SELECT
  USING (true);

CREATE POLICY "Kontak items insert blocked"
  ON kontak_items
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Kontak items update blocked"
  ON kontak_items
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Kontak items delete blocked"
  ON kontak_items
  FOR DELETE
  USING (false);

GRANT SELECT ON kontak_items TO anon;
GRANT SELECT ON kontak_items TO authenticated;

COMMENT ON TABLE kontak_items IS 'Saluran kontak resmi pondok pesantren';

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

CREATE POLICY "Kontak settings readable"
  ON kontak_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Kontak settings insert blocked"
  ON kontak_settings
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Kontak settings update blocked"
  ON kontak_settings
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Kontak settings delete blocked"
  ON kontak_settings
  FOR DELETE
  USING (false);

GRANT SELECT ON kontak_settings TO anon;
GRANT SELECT ON kontak_settings TO authenticated;

COMMENT ON TABLE kontak_settings IS 'Pengaturan tambahan halaman kontak (embed map, dsb)';
