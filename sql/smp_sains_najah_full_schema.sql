-- ============================================================================
-- FULL DATABASE SCHEMA: SMP SAINS AN NAJAH PURWOKERTO
-- Sistem PPDB (Penerimaan Peserta Didik Baru)
-- Database: PostgreSQL (Supabase)
-- Versi: 2.0 (Sistem NISN)
-- Tanggal: 2025-10-22
-- ============================================================================

-- ============================================================================
-- DROP TABLES (Hati-hati! Akan menghapus semua data)
-- ============================================================================
-- DROP TABLE IF EXISTS pembayaran CASCADE;
-- DROP TABLE IF EXISTS pendaftar CASCADE;

-- ============================================================================
-- TABEL 1: PENDAFTAR
-- Tabel utama untuk menyimpan data calon siswa
-- ============================================================================

CREATE TABLE IF NOT EXISTS pendaftar (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Identitas Utama (NISN sebagai identifier)
    nisn VARCHAR(10) UNIQUE NOT NULL,
    nikcalon VARCHAR(16) NOT NULL,
    namalengkap VARCHAR(255) NOT NULL,
    
    -- Data Kelahiran
    tempatlahir VARCHAR(100),
    provinsitempatlahir VARCHAR(100),
    tanggallahir DATE,
    jeniskelamin VARCHAR(1) CHECK (jeniskelamin IN ('L', 'P')),
    
    -- Kontak
    emailcalon VARCHAR(255),
    telepon_orang_tua VARCHAR(20),
    
    -- Alamat Lengkap
    alamatjalan TEXT,
    desa VARCHAR(100),
    kecamatan VARCHAR(100),
    kotakabupaten VARCHAR(100),
    kabkota VARCHAR(100),
    provinsi VARCHAR(100),
    
    -- Data Pendidikan
    ijazahformalterakhir VARCHAR(50),
    sekolahdomisili VARCHAR(255),
    rencanatingkat VARCHAR(50),
    rencanaprogram VARCHAR(100),
    rencanakelas VARCHAR(100),
    
    -- Data Orang Tua - Ayah
    namaayah VARCHAR(255),
    nikayah VARCHAR(16),
    statusayah VARCHAR(20),
    pekerjaanayah VARCHAR(100),
    
    -- Data Orang Tua - Ibu
    namaibu VARCHAR(255),
    nikibu VARCHAR(16),
    statusibu VARCHAR(20),
    pekerjaanibu VARCHAR(100),
    
    -- File Upload
    file_ijazah TEXT,
    file_kk TEXT,
    file_akta TEXT,
    file_foto TEXT,
    
    -- Status & Verifikasi
    statusberkas VARCHAR(20) DEFAULT 'PENDING' CHECK (statusberkas IN ('PENDING', 'REVISI', 'DITERIMA', 'DITOLAK')),
    alasan TEXT,
    deskripsistatus TEXT,
    verifiedby VARCHAR(255),
    verifiedat TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Komentar tabel
COMMENT ON TABLE pendaftar IS 'Tabel data calon siswa baru SMP Sains An Najah';

-- Komentar kolom penting
COMMENT ON COLUMN pendaftar.nisn IS 'Nomor Induk Siswa Nasional (10 digit) - Identifier utama';
COMMENT ON COLUMN pendaftar.nikcalon IS 'NIK Calon Siswa (16 digit)';
COMMENT ON COLUMN pendaftar.statusberkas IS 'Status verifikasi: PENDING, REVISI, DITERIMA, DITOLAK';

-- ============================================================================
-- TABEL 2: PEMBAYARAN
-- Tabel untuk menyimpan data pembayaran pendaftaran
-- ============================================================================

CREATE TABLE IF NOT EXISTS pembayaran (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Identitas Siswa (Foreign Key ke pendaftar)
    nisn VARCHAR(10) NOT NULL,
    nik VARCHAR(16),
    nama_lengkap VARCHAR(255) NOT NULL,
    
    -- Data Pembayaran
    jumlah DECIMAL(12, 2) NOT NULL DEFAULT 500000.00,
    metode_pembayaran VARCHAR(100) DEFAULT 'Transfer Bank BRI',
    bukti_pembayaran TEXT NOT NULL,
    
    -- Status & Verifikasi
    status_pembayaran VARCHAR(20) DEFAULT 'PENDING' CHECK (status_pembayaran IN ('PENDING', 'VERIFIED', 'REJECTED')),
    catatan_admin TEXT,
    verified_by VARCHAR(255),
    tanggal_verifikasi TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    tanggal_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign Key Constraint
    CONSTRAINT fk_pembayaran_nisn FOREIGN KEY (nisn) 
        REFERENCES pendaftar(nisn) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Komentar tabel
COMMENT ON TABLE pembayaran IS 'Tabel data pembayaran pendaftaran siswa baru';

-- Komentar kolom penting
COMMENT ON COLUMN pembayaran.nisn IS 'NISN siswa (relasi ke tabel pendaftar)';
COMMENT ON COLUMN pembayaran.status_pembayaran IS 'Status verifikasi: PENDING, VERIFIED, REJECTED';
COMMENT ON COLUMN pembayaran.jumlah IS 'Jumlah pembayaran dalam Rupiah';

-- ============================================================================
-- INDEXES untuk Optimasi Query
-- ============================================================================

-- Index untuk tabel pendaftar
CREATE INDEX IF NOT EXISTS idx_pendaftar_nisn ON pendaftar(nisn);
CREATE INDEX IF NOT EXISTS idx_pendaftar_nikcalon ON pendaftar(nikcalon);
CREATE INDEX IF NOT EXISTS idx_pendaftar_statusberkas ON pendaftar(statusberkas);
CREATE INDEX IF NOT EXISTS idx_pendaftar_createdat ON pendaftar(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_pendaftar_rencanaprogram ON pendaftar(rencanaprogram);
CREATE INDEX IF NOT EXISTS idx_pendaftar_rencanatingkat ON pendaftar(rencanatingkat);

-- Index untuk tabel pembayaran
CREATE INDEX IF NOT EXISTS idx_pembayaran_nisn ON pembayaran(nisn);
CREATE INDEX IF NOT EXISTS idx_pembayaran_nik ON pembayaran(nik);
CREATE INDEX IF NOT EXISTS idx_pembayaran_status ON pembayaran(status_pembayaran);
CREATE INDEX IF NOT EXISTS idx_pembayaran_created_at ON pembayaran(created_at DESC);

-- ============================================================================
-- CONSTRAINTS Tambahan
-- ============================================================================

-- Constraint untuk validasi format NISN (10 digit angka)
ALTER TABLE pendaftar 
ADD CONSTRAINT chk_nisn_format 
CHECK (nisn ~ '^\d{10}$');

-- Constraint untuk validasi format NIK Calon (16 digit angka)
ALTER TABLE pendaftar 
ADD CONSTRAINT chk_nikcalon_format 
CHECK (nikcalon ~ '^\d{16}$');

-- Constraint untuk validasi format NISN di pembayaran
ALTER TABLE pembayaran 
ADD CONSTRAINT chk_pembayaran_nisn_format 
CHECK (nisn ~ '^\d{10}$');

-- Constraint untuk validasi NIK di pembayaran (jika diisi)
ALTER TABLE pembayaran 
ADD CONSTRAINT chk_pembayaran_nik_format 
CHECK (nik IS NULL OR nik ~ '^\d{16}$');

-- Constraint untuk memastikan jumlah pembayaran > 0
ALTER TABLE pembayaran 
ADD CONSTRAINT chk_pembayaran_jumlah 
CHECK (jumlah > 0);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function untuk auto-update timestamp 'updatedat'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update timestamp di tabel pendaftar
DROP TRIGGER IF EXISTS update_pendaftar_modtime ON pendaftar;
CREATE TRIGGER update_pendaftar_modtime
    BEFORE UPDATE ON pendaftar
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function untuk auto-update timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_pembayaran_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update timestamp di tabel pembayaran
DROP TRIGGER IF EXISTS update_pembayaran_modtime ON pembayaran;
CREATE TRIGGER update_pembayaran_modtime
    BEFORE UPDATE ON pembayaran
    FOR EACH ROW
    EXECUTE FUNCTION update_pembayaran_modified_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Opsional, sesuaikan dengan kebutuhan
-- ============================================================================

-- Enable RLS pada tabel pendaftar
-- ALTER TABLE pendaftar ENABLE ROW LEVEL SECURITY;

-- Policy: Public dapat membaca semua data (untuk cek status)
-- CREATE POLICY "Enable read access for all users" ON pendaftar
--     FOR SELECT USING (true);

-- Policy: Hanya authenticated user yang bisa insert
-- CREATE POLICY "Enable insert for authenticated users only" ON pendaftar
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Hanya authenticated user yang bisa update
-- CREATE POLICY "Enable update for authenticated users only" ON pendaftar
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable RLS pada tabel pembayaran
-- ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;

-- Policy: Public dapat membaca data pembayaran mereka sendiri
-- CREATE POLICY "Enable read access for all users" ON pembayaran
--     FOR SELECT USING (true);

-- Policy: Authenticated user bisa insert pembayaran
-- CREATE POLICY "Enable insert for authenticated users only" ON pembayaran
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Hanya admin yang bisa update status pembayaran
-- CREATE POLICY "Enable update for authenticated users only" ON pembayaran
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- SAMPLE DATA (Opsional - untuk testing)
-- ============================================================================

-- Insert sample pendaftar
-- INSERT INTO pendaftar (
--     nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
--     emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
--     kotakabupaten, provinsi, statusberkas
-- ) VALUES 
-- (
--     '1234567890', '3302012345670001', 'Ahmad Fauzi', 'Purwokerto', '2010-05-15', 'L',
--     'ahmad.fauzi@example.com', '081234567890', 'Jl. Merdeka No. 123',
--     'Purwokerto Kidul', 'Purwokerto Timur', 'Banyumas', 'Jawa Tengah', 'PENDING'
-- );

-- Insert sample pembayaran
-- INSERT INTO pembayaran (
--     nisn, nik, nama_lengkap, jumlah, metode_pembayaran, 
--     bukti_pembayaran, status_pembayaran
-- ) VALUES 
-- (
--     '1234567890', '3302012345670001', 'Ahmad Fauzi', 500000.00, 
--     'Transfer Bank BRI', 'https://storage.example.com/bukti.jpg', 'PENDING'
-- );

-- ============================================================================
-- VIEWS untuk Reporting & Analytics (Opsional)
-- ============================================================================

-- View: Summary pendaftar per status
CREATE OR REPLACE VIEW v_summary_pendaftar_status AS
SELECT 
    statusberkas,
    COUNT(*) as jumlah,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pendaftar), 2) as persentase
FROM pendaftar
GROUP BY statusberkas
ORDER BY 
    CASE statusberkas
        WHEN 'PENDING' THEN 1
        WHEN 'REVISI' THEN 2
        WHEN 'DITERIMA' THEN 3
        WHEN 'DITOLAK' THEN 4
    END;

-- View: Summary pendaftar per program
CREATE OR REPLACE VIEW v_summary_pendaftar_program AS
SELECT 
    rencanaprogram,
    rencanatingkat,
    COUNT(*) as jumlah,
    COUNT(CASE WHEN statusberkas = 'DITERIMA' THEN 1 END) as diterima,
    COUNT(CASE WHEN statusberkas = 'PENDING' THEN 1 END) as pending
FROM pendaftar
WHERE rencanaprogram IS NOT NULL
GROUP BY rencanaprogram, rencanatingkat
ORDER BY rencanaprogram, rencanatingkat;

-- View: Summary pembayaran per status
CREATE OR REPLACE VIEW v_summary_pembayaran_status AS
SELECT 
    status_pembayaran,
    COUNT(*) as jumlah,
    SUM(jumlah) as total_nominal,
    ROUND(AVG(jumlah), 2) as rata_rata
FROM pembayaran
GROUP BY status_pembayaran
ORDER BY 
    CASE status_pembayaran
        WHEN 'PENDING' THEN 1
        WHEN 'VERIFIED' THEN 2
        WHEN 'REJECTED' THEN 3
    END;

-- View: Pendaftar dengan pembayaran
CREATE OR REPLACE VIEW v_pendaftar_with_payment AS
SELECT 
    p.id,
    p.nisn,
    p.namalengkap,
    p.emailcalon,
    p.telepon_orang_tua,
    p.statusberkas,
    p.createdat as tanggal_daftar,
    b.id as pembayaran_id,
    b.jumlah as pembayaran_jumlah,
    b.status_pembayaran,
    b.tanggal_upload as tanggal_bayar,
    b.verified_by,
    b.tanggal_verifikasi
FROM pendaftar p
LEFT JOIN pembayaran b ON p.nisn = b.nisn
ORDER BY p.createdat DESC;

-- ============================================================================
-- QUERY VERIFIKASI
-- ============================================================================

-- Cek struktur tabel pendaftar
-- SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'pendaftar'
-- ORDER BY ordinal_position;

-- Cek struktur tabel pembayaran
-- SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'pembayaran'
-- ORDER BY ordinal_position;

-- Cek semua index
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('pendaftar', 'pembayaran')
-- ORDER BY tablename, indexname;

-- Cek semua constraints
-- SELECT conname, contype, pg_get_constraintdef(oid) as definition
-- FROM pg_constraint
-- WHERE conrelid IN ('pendaftar'::regclass, 'pembayaran'::regclass)
-- ORDER BY conrelid::regclass::text, conname;

-- Cek semua triggers
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table IN ('pendaftar', 'pembayaran')
-- ORDER BY event_object_table, trigger_name;

-- Test count data
-- SELECT 
--     (SELECT COUNT(*) FROM pendaftar) as total_pendaftar,
--     (SELECT COUNT(*) FROM pembayaran) as total_pembayaran,
--     (SELECT COUNT(*) FROM pendaftar WHERE statusberkas = 'PENDING') as pending,
--     (SELECT COUNT(*) FROM pembayaran WHERE status_pembayaran = 'VERIFIED') as verified;

-- ============================================================================
-- CATATAN PENTING
-- ============================================================================
-- 
-- 1. NISN adalah identifier utama untuk sistem cek status
-- 2. Tidak ada lagi nomor_registrasi atau nomor_pembayaran
-- 3. Foreign Key menggunakan NISN untuk relasi antar tabel
-- 4. Semua constraint sudah menggunakan validasi format NISN/NIK
-- 5. Index sudah dioptimasi untuk performa query
-- 6. Trigger auto-update timestamp sudah aktif
-- 7. Views untuk reporting sudah tersedia
-- 8. RLS di-comment, uncomment jika perlu security
--
-- CARA PENGGUNAAN:
-- 1. Backup database jika sudah ada data
-- 2. Jalankan script ini di Supabase SQL Editor
-- 3. Verifikasi dengan query di bagian akhir
-- 4. Test insert data sample (uncomment bagian SAMPLE DATA)
-- 5. Enable RLS jika diperlukan
--
-- ============================================================================

-- End of Schema

