-- ============================================================================
-- SAMPLE DATA untuk Testing Statistik Pendaftar
-- Pondok Pesantren Al Ikhsan Beji - PPDSB System
-- ============================================================================

-- IMPORTANT: Pastikan NISN dan NIK unique!
-- Jalankan query ini di Supabase SQL Editor atau psql

-- ============================================================================
-- 1. PONDOK PUTRA INDUK (3 pendaftar: 1 MTs, 1 MA, 1 Kuliah)
-- ============================================================================

-- Pondok Putra Induk - MTs
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('1000000001', '3302012010050001', 'Ahmad Fauzi bin Abdullah', 'Beji', '2010-05-15', 'L',
 'ahmad.fauzi@example.com', '081234567890', 'Jl. Merdeka No. 123',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Pondok Putra Induk',
 'Abdullah bin Ahmad', '3302011980010001', 'Hidup', 'Wiraswasta',
 'Siti Aminah', '3302011985010001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Pondok Putra Induk - MA
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('1000000002', '3302012008030002', 'Muhammad Hasan bin Zakariya', 'Beji', '2008-03-20', 'L',
 'hasan.zakariya@example.com', '081234567891', 'Jl. Merdeka No. 124',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Pondok Putra Induk',
 'Zakariya bin Hasan', '3302011975020001', 'Hidup', 'PNS',
 'Fatimah binti Ahmad', '3302011978020001', 'Hidup', 'Guru',
 'PENDING');

-- Pondok Putra Induk - Kuliah
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('1000000003', '3302012005120003', 'Ali bin Ibrahim', 'Beji', '2005-12-10', 'L',
 'ali.ibrahim@example.com', '081234567892', 'Jl. Merdeka No. 125',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MA', 'Kuliah', 'Pondok Putra Induk',
 'Ibrahim bin Muhammad', '3302011970030001', 'Hidup', 'Pedagang',
 'Khadijah binti Umar', '3302011973030001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- ============================================================================
-- 2. PONDOK PUTRA TAHFIDZ (3 pendaftar: 1 MTs, 1 MA, 1 Kuliah)
-- ============================================================================

-- Pondok Putra Tahfidz - MTs
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('2000000001', '3302012010070004', 'Usman bin Affan', 'Beji', '2010-07-25', 'L',
 'usman.affan@example.com', '081234567893', 'Jl. Pemuda No. 10',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Pondok Putra Tahfidz',
 'Affan bin Usman', '3302011982040001', 'Hidup', 'Petani',
 'Aisyah binti Abdullah', '3302011984040001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Pondok Putra Tahfidz - MA
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('2000000002', '3302012008090005', 'Zaid bin Haritsah', 'Beji', '2008-09-15', 'L',
 'zaid.haritsah@example.com', '081234567894', 'Jl. Pemuda No. 11',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Pondok Putra Tahfidz',
 'Haritsah bin Zaid', '3302011977050001', 'Hidup', 'Buruh',
 'Maryam binti Imran', '3302011980050001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Pondok Putra Tahfidz - Kuliah
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('2000000003', '3302012005110006', 'Bilal bin Rabah', 'Beji', '2005-11-20', 'L',
 'bilal.rabah@example.com', '081234567895', 'Jl. Pemuda No. 12',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MA', 'Kuliah', 'Pondok Putra Tahfidz',
 'Rabah bin Bilal', '3302011972060001', 'Hidup', 'Wiraswasta',
 'Halimah binti Abdullah', '3302011975060001', 'Hidup', 'Guru',
 'PENDING');

-- ============================================================================
-- 3. PONDOK PUTRI (3 pendaftar: 1 MTs, 1 MA, 1 Kuliah)
-- ============================================================================

-- Pondok Putri - MTs
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('3000000001', '3302012010060007', 'Fatimah Azzahra binti Ali', 'Beji', '2010-06-10', 'P',
 'fatimah.azzahra@example.com', '081234567896', 'Jl. Kartini No. 20',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Pondok Putri',
 'Ali bin Abu Thalib', '3302011983070001', 'Hidup', 'PNS',
 'Zainab binti Jahsy', '3302011986070001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Pondok Putri - MA
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('3000000002', '3302012008080008', 'Aisyah binti Abu Bakar', 'Beji', '2008-08-12', 'P',
 'aisyah.abubakar@example.com', '081234567897', 'Jl. Kartini No. 21',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Pondok Putri',
 'Abu Bakar bin Quhafah', '3302011976080001', 'Hidup', 'Pedagang',
 'Asma binti Abu Bakar', '3302011979080001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Pondok Putri - Kuliah
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('3000000003', '3302012005100009', 'Khadijah binti Khuwaylid', 'Beji', '2005-10-05', 'P',
 'khadijah.khuwaylid@example.com', '081234567898', 'Jl. Kartini No. 22',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MA', 'Kuliah', 'Pondok Putri',
 'Khuwaylid bin Asad', '3302011971090001', 'Hidup', 'Wiraswasta',
 'Fatimah binti Za-idah', '3302011974090001', 'Hidup', 'Guru',
 'PENDING');

-- ============================================================================
-- 4. HANYA SEKOLAH (4 pendaftar: 1 MTs L, 1 MTs P, 1 MA L, 1 MA P)
-- ============================================================================

-- Hanya Sekolah - MTs Laki-laki
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('4000000001', '3302012010040010', 'Budi Santoso', 'Beji', '2010-04-20', 'L',
 'budi.santoso@example.com', '081234567899', 'Jl. Diponegoro No. 30',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Hanya Sekolah',
 'Santoso bin Suparman', '3302011985100001', 'Hidup', 'Buruh',
 'Siti Rohmah', '3302011987100001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Hanya Sekolah - MTs Perempuan
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('4000000002', '3302012010050011', 'Dewi Lestari', 'Beji', '2010-05-25', 'P',
 'dewi.lestari@example.com', '081234567900', 'Jl. Diponegoro No. 31',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Hanya Sekolah',
 'Lestari bin Sutrisno', '3302011984110001', 'Hidup', 'Petani',
 'Sri Wahyuni', '3302011986110001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Hanya Sekolah - MA Laki-laki
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('4000000003', '3302012008070012', 'Agus Prasetyo', 'Beji', '2008-07-18', 'L',
 'agus.prasetyo@example.com', '081234567901', 'Jl. Diponegoro No. 32',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Hanya Sekolah',
 'Prasetyo bin Sukirman', '3302011981120001', 'Hidup', 'Pedagang',
 'Endang Susilowati', '3302011983120001', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');

-- Hanya Sekolah - MA Perempuan
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
('4000000004', '3302012008090013', 'Siti Nurhaliza', 'Beji', '2008-09-22', 'P',
 'siti.nurhaliza@example.com', '081234567902', 'Jl. Diponegoro No. 33',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Hanya Sekolah',
 'Nurhalim bin Suratman', '3302011980130001', 'Hidup', 'Wiraswasta',
 'Siti Aisyah', '3302011982130001', 'Hidup', 'Guru',
 'PENDING');

-- ============================================================================
-- SUMMARY: Expected Statistics
-- ============================================================================

-- Setelah insert semua data di atas, statistik akan menampilkan:

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  EXPECTED STATISTICS RESULT                                      ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  1. Pondok Putra Induk                                           ║
-- ║     - MTs: 1                                                     ║
-- ║     - MA: 1                                                      ║
-- ║     - Kuliah: 1                                                  ║
-- ║     - Total: 3                                                   ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  2. Pondok Putra Tahfidz                                         ║
-- ║     - MTs: 1                                                     ║
-- ║     - MA: 1                                                      ║
-- ║     - Kuliah: 1                                                  ║
-- ║     - Total: 3                                                   ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  3. Pondok Putri                                                 ║
-- ║     - MTs: 1                                                     ║
-- ║     - MA: 1                                                      ║
-- ║     - Kuliah: 1                                                  ║
-- ║     - Total: 3                                                   ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  4. Hanya Sekolah                                                ║
-- ║     - MTs Laki-laki: 1                                           ║
-- ║     - MTs Perempuan: 1                                           ║
-- ║     - MA Laki-laki: 1                                            ║
-- ║     - MA Perempuan: 1                                            ║
-- ║     - Total: 4                                                   ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  GRAND TOTAL: 13 pendaftar                                       ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Jalankan query ini untuk memverifikasi hasil insert:
SELECT 
    rencanaprogram AS "Program",
    rencanatingkat AS "Jenjang",
    jeniskelamin AS "JK",
    COUNT(*) AS "Jumlah"
FROM pendaftar
WHERE rencanaprogram IS NOT NULL
GROUP BY rencanaprogram, rencanatingkat, jeniskelamin
ORDER BY rencanaprogram, rencanatingkat, jeniskelamin;

-- ============================================================================
-- CLEANUP (Optional - untuk reset data testing)
-- ============================================================================

-- HATI-HATI! Ini akan menghapus semua data testing
-- DELETE FROM pendaftar WHERE nisn LIKE '1000000%' OR nisn LIKE '2000000%' OR nisn LIKE '3000000%' OR nisn LIKE '4000000%';

