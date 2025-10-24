# 📊 Panduan Statistik Pendaftar - PPDSB Pondok Pesantren Al Ikhsan Beji

## 📚 Overview

Sistem statistik pendaftar di admin panel menampilkan breakdown jumlah pendaftar berdasarkan:
- **Program Pondok**: Pondok Putra Induk, Pondok Putra Tahfidz, Pondok Putri
- **Jenjang Pendidikan**: MTs, MA, Kuliah
- **Hanya Sekolah**: MTs (L/P), MA (L/P)

## 🔍 Cara Kerja Sistem

### 1. **Database Schema** (`pendaftar` table)

Field yang digunakan untuk statistik:
```sql
-- Field untuk filtering statistik
rencanaprogram VARCHAR(100)  -- Contoh: "Pondok Putra Induk", "Pondok Putri", "Hanya Sekolah"
rencanatingkat VARCHAR(50)   -- Contoh: "MTs", "MA", "Kuliah"
jeniskelamin VARCHAR(1)      -- Contoh: "L" atau "P"
```

### 2. **API Endpoint** (`/api/pendaftar_list`)

API mengembalikan data dengan field names yang konsisten:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "Ahmad Fauzi",
      "rencana_program": "Pondok Putra Induk",  // ← Field untuk statistik (underscore)
      "rencanaprogram": "Pondok Putra Induk",    // ← Field asli database (lowercase)
      "rencanatingkat": "MTs",
      "jeniskelamin": "L",
      "status": "pending",
      "createdat": "2025-01-20T10:00:00Z"
    }
  ]
}
```

**Update Terbaru (2025-10-24):**
- ✅ API sekarang mengembalikan `rencana_program` (dengan underscore) untuk kompatibilitas
- ✅ Tetap mempertahankan `rencanaprogram` (lowercase) untuk backward compatibility
- ✅ Field `rencanatingkat` dan `jeniskelamin` juga dipastikan ada di response

### 3. **Frontend JavaScript** (`admin.js`)

Fungsi helper untuk membaca data dengan fallback:
```javascript
const getRencanaProgram = (d) =>
  d.rencana_program ||     // ← Prioritas pertama (underscore)
  d.rencanaProgram ||      // ← CamelCase fallback
  d.rencanakelas ||        // ← Alias lama
  d.rencanaprogram ||      // ← Lowercase fallback
  "";

const getJenjang = (d) => 
  d.rencanatingkat ||      // ← Lowercase (sesuai database)
  d.rencanaTingkat ||      // ← CamelCase fallback
  "";
```

Filtering statistik:
```javascript
// Contoh: Pondok Putra Induk - MTs
const putraIndukMts = result.data.filter(
  (d) =>
    getRencanaProgram(d) === "Pondok Putra Induk" &&
    getJenjang(d) === "MTs"
).length;
```

## 📋 Kategori Statistik

### 1. **Pondok Putra Induk**
- **MTs** (Tsanawiyah)
- **MA** (Aliyah)
- **Kuliah**
- **Total**

### 2. **Pondok Putra Tahfidz**
- **MTs** (Tsanawiyah)
- **MA** (Aliyah)
- **Kuliah**
- **Total**

### 3. **Pondok Putri**
- **MTs** (Tsanawiyah)
- **MA** (Aliyah)
- **Kuliah**
- **Total**

### 4. **Hanya Sekolah**
- **MTs Laki-laki**
- **MTs Perempuan**
- **MA Laki-laki**
- **MA Perempuan**
- **Total**

## 🧪 Testing & Verifikasi

### 1. **Insert Sample Data** (SQL)

```sql
-- Sample data untuk testing statistik
INSERT INTO pendaftar (
    nisn, nikcalon, namalengkap, tempatlahir, tanggallahir, jeniskelamin,
    emailcalon, telepon_orang_tua, alamatjalan, desa, kecamatan, 
    kotakabupaten, provinsi, 
    ijazahformalterakhir, rencanatingkat, rencanaprogram,
    namaayah, nikayah, statusayah, pekerjaanayah,
    namaibu, nikibu, statusibu, pekerjaanibu,
    statusberkas
) VALUES 
-- Pondok Putra Induk - MTs
('1234567890', '3302012345670001', 'Ahmad Fauzi', 'Beji', '2010-05-15', 'L',
 'ahmad@example.com', '081234567890', 'Jl. Merdeka No. 123',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Pondok Putra Induk',
 'Bapak Ahmad', '3302011234560001', 'Hidup', 'Wiraswasta',
 'Ibu Ahmad', '3302011234560002', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING'),

-- Pondok Putra Tahfidz - MA
('1234567891', '3302012345670002', 'Muhammad Ali', 'Beji', '2008-03-20', 'L',
 'ali@example.com', '081234567891', 'Jl. Merdeka No. 124',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Pondok Putra Tahfidz',
 'Bapak Ali', '3302011234560003', 'Hidup', 'PNS',
 'Ibu Ali', '3302011234560004', 'Hidup', 'Guru',
 'PENDING'),

-- Pondok Putri - MTs
('1234567892', '3302012345670003', 'Fatimah Azzahra', 'Beji', '2010-07-10', 'P',
 'fatimah@example.com', '081234567892', 'Jl. Merdeka No. 125',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Pondok Putri',
 'Bapak Fatimah', '3302011234560005', 'Hidup', 'Petani',
 'Ibu Fatimah', '3302011234560006', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING'),

-- Hanya Sekolah - MTs Laki-laki
('1234567893', '3302012345670004', 'Budi Santoso', 'Beji', '2010-09-05', 'L',
 'budi@example.com', '081234567893', 'Jl. Merdeka No. 126',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'SD/MI', 'MTs', 'Hanya Sekolah',
 'Bapak Budi', '3302011234560007', 'Hidup', 'Buruh',
 'Ibu Budi', '3302011234560008', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING'),

-- Hanya Sekolah - MA Perempuan
('1234567894', '3302012345670005', 'Siti Nurhaliza', 'Beji', '2008-11-15', 'P',
 'siti@example.com', '081234567894', 'Jl. Merdeka No. 127',
 'Beji', 'Kedungbanteng', 'Banyumas', 'Jawa Tengah',
 'MTs', 'MA', 'Hanya Sekolah',
 'Bapak Siti', '3302011234560009', 'Hidup', 'Pedagang',
 'Ibu Siti', '3302011234560010', 'Hidup', 'Ibu Rumah Tangga',
 'PENDING');
```

### 2. **Verifikasi di Browser Console**

Buka **Admin Panel → Tab Statistik**, lalu buka **Browser Console (F12)**:

```javascript
// Console akan menampilkan:
[STATISTIK] Sample data untuk verifikasi:
Total pendaftar: 5

[STATISTIK] Hasil perhitungan:
Pondok Putra Induk: { MTs: 1, MA: 0, Kuliah: 0, Total: 1 }
Pondok Putra Tahfidz: { MTs: 0, MA: 1, Kuliah: 0, Total: 1 }
Pondok Putri: { MTs: 1, MA: 0, Kuliah: 0, Total: 1 }
Hanya Sekolah: { MTs_L: 1, MTs_P: 0, MA_L: 0, MA_P: 1, Total: 2 }
```

### 3. **Query Verifikasi Manual** (SQL)

```sql
-- Verifikasi jumlah per program
SELECT 
    rencanaprogram,
    rencanatingkat,
    jeniskelamin,
    COUNT(*) as jumlah
FROM pendaftar
WHERE rencanaprogram IS NOT NULL
GROUP BY rencanaprogram, rencanatingkat, jeniskelamin
ORDER BY rencanaprogram, rencanatingkat, jeniskelamin;

-- Verifikasi total per program
SELECT 
    rencanaprogram,
    COUNT(*) as total
FROM pendaftar
WHERE rencanaprogram IS NOT NULL
GROUP BY rencanaprogram
ORDER BY rencanaprogram;
```

## 🐛 Troubleshooting

### Problem: Statistik menampilkan angka 0 semua

**Possible Causes:**
1. ❌ Tidak ada data pendaftar di database
2. ❌ Field `rencanaprogram` atau `rencanatingkat` kosong (NULL)
3. ❌ Nilai field tidak match dengan filter (typo/case sensitivity)

**Solutions:**
1. ✅ Periksa apakah ada data: `SELECT COUNT(*) FROM pendaftar;`
2. ✅ Periksa field NULL: `SELECT COUNT(*) FROM pendaftar WHERE rencanaprogram IS NULL;`
3. ✅ Periksa nilai field: `SELECT DISTINCT rencanaprogram, rencanatingkat FROM pendaftar;`
4. ✅ Cek Browser Console untuk debug logs (F12)

### Problem: Statistik tidak update setelah tambah data baru

**Solutions:**
1. ✅ Refresh halaman admin (Ctrl + R)
2. ✅ Klik tab "Statistik" lagi untuk re-load data
3. ✅ Clear browser cache (Ctrl + Shift + Delete)

### Problem: Nilai field tidak sesuai ekspektasi

**Common Issues:**
- ❌ Typo: `"Pondok Putra Induk"` vs `"Pondok Putra  Induk"` (double space)
- ❌ Case sensitivity: `"MTs"` vs `"mts"` vs `"MTS"`
- ❌ Extra spaces: `"MTs "` (trailing space)

**Solutions:**
```sql
-- Update semua data untuk standardisasi
UPDATE pendaftar 
SET rencanaprogram = TRIM(rencanaprogram),
    rencanatingkat = TRIM(rencanatingkat)
WHERE rencanaprogram IS NOT NULL;

-- Standardisasi case untuk jenjang
UPDATE pendaftar 
SET rencanatingkat = 'MTs' 
WHERE LOWER(rencanatingkat) = 'mts';

UPDATE pendaftar 
SET rencanatingkat = 'MA' 
WHERE LOWER(rencanatingkat) = 'ma';

UPDATE pendaftar 
SET rencanatingkat = 'Kuliah' 
WHERE LOWER(rencanatingkat) = 'kuliah';
```

## 📊 Expected Values

### Field: `rencanaprogram`
Nilai yang valid:
- `"Pondok Putra Induk"`
- `"Pondok Putra Tahfidz"`
- `"Pondok Putri"`
- `"Hanya Sekolah"`

### Field: `rencanatingkat`
Nilai yang valid:
- `"MTs"` (Tsanawiyah)
- `"MA"` (Aliyah)
- `"Kuliah"` (Mahasiswa)

### Field: `jeniskelamin`
Nilai yang valid:
- `"L"` (Laki-laki)
- `"P"` (Perempuan)

## 📝 Update Log

### 2025-10-24
- ✅ **FIXED**: API `pendaftar_list` sekarang mengembalikan field `rencana_program` (underscore)
- ✅ **ADDED**: Debug logging di JavaScript untuk troubleshooting
- ✅ **IMPROVED**: Backward compatibility dengan multiple field name fallbacks
- ✅ **DOCUMENTED**: Panduan lengkap untuk statistik dan troubleshooting

## 🔗 Related Files

- **API Handler**: `lib/handlers/pendaftar_list.py`
- **Frontend JS**: `public/assets/js/admin.js` (line 217-335)
- **Admin UI**: `public/admin.html` (Statistik Tab)
- **Database Schema**: `sql/smp_sains_najah_full_schema.sql`

---

**Developed with ❤️ for Pondok Pesantren Al Ikhsan Beji**

