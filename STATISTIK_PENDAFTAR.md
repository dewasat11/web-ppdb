# 📊 Dokumentasi Statistik Pendaftar

## Cara Kerja Statistik

Statistik pendaftar di dashboard admin **HANYA menghitung pendaftar dengan pembayaran yang sudah VERIFIED**. Ini memastikan data yang ditampilkan akurat dan sesuai dengan pembayaran yang sudah dikonfirmasi.

### Alur Perhitungan Statistik

```
1. Fetch data pendaftar dari /api/pendaftar_list
2. Fetch data pembayaran dari /api/pembayaran_list
3. Buat Map dari semua pembayaran dengan status VERIFIED
4. Filter pendaftar yang memiliki pembayaran VERIFIED (matching by NISN/NIK)
5. Hitung statistik berdasarkan:
   - Rencana Program (Pondok Putra Induk, Pondok Putra Tahfidz, Pondok Putri, Hanya Sekolah)
   - Jenjang (MTs, MA, Kuliah)
   - Jenis Kelamin (untuk Hanya Sekolah)
```

## Matching Pendaftar dengan Pembayaran

### Field Identifier yang Digunakan

System menggunakan 3 kemungkinan identifier untuk matching:
1. **NISN** (Nomor Induk Siswa Nasional)
2. **NIK** (Nomor Induk Kependudukan)
3. **NIKCalon** (alternative NIK field)

### Logika Matching

```javascript
// Pendaftar dianggap VERIFIED jika salah satu dari identifiernya
// cocok dengan Map pembayaran yang sudah VERIFIED
hasVerifiedPayment(pendaftar) {
  identifiers = [pendaftar.nisn, pendaftar.nikcalon, pendaftar.nik]
  return identifiers ada yang match di verifiedPayments Map
}
```

### Backend Processing

**Pembayaran (`lib/handlers/pembayaran_list.py`)**:
- Membaca semua pembayaran dari database
- Map field `status_pembayaran` ke `status`
- Include semua identifier: `nisn`, `nik`, `nikcalon`
- Filter hanya yang status = "VERIFIED" di frontend

**Pendaftar (`lib/handlers/pendaftar_list.py`)**:
- Membaca semua pendaftar dari database
- Normalize field identifier (nisn, nik, nikcalon)
- Include semua field untuk statistik (rencana_program, rencanatingkat, jeniskelamin)

## Statistik yang Dihitung

### 1. Status Pendaftar (Semua Pendaftar)
- Total Count
- Pending Count
- Revisi Count
- Diterima Count
- Ditolak Count

**Note**: Status counts TIDAK memerlukan filter pembayaran verified

### 2. Breakdown Program (Hanya Verified)

#### Pondok Putra Induk
- MTs
- MA
- Kuliah
- **Total**

#### Pondok Putra Tahfidz
- MTs
- MA
- Kuliah
- **Total**

#### Pondok Putri
- MTs
- MA
- Kuliah
- **Total**

#### Hanya Sekolah
- MTs Laki-laki
- MTs Perempuan
- MA Laki-laki
- MA Perempuan
- **Total**

## Debug & Troubleshooting

### 1. Console Logs (Otomatis)

Setiap kali halaman admin pendaftar di-load, system akan log:

```
[STATISTIK] ========================================
[STATISTIK] Total pendaftar: XX
[STATISTIK] Pendaftar dengan pembayaran VERIFIED: XX
[STATISTIK] Verified payments map size: XX
[STATISTIK] Persentase verified: XX%
[STATISTIK] Sample pendaftar VERIFIED pertama: {...}
[STATISTIK] Pendaftar tanpa pembayaran VERIFIED: XX
[STATISTIK] Sample pendaftar tanpa pembayaran: {...}
[STATISTIK] ========================================
💡 Tip: Aktifkan debug matching dengan: window.debugStatistik = true
```

### 2. Debug Matching Detail

Untuk melihat detail matching setiap pendaftar:

1. Buka Browser Console (F12)
2. Ketik: `window.debugStatistik = true`
3. Refresh halaman admin

Anda akan melihat log seperti:
```
[MATCH DEBUG] {
  nama: "Ahmad Yusuf",
  identifiers: ["1234567890", "9876543210"],
  isVerified: true,
  hasInMap: [
    { id: "1234567890", exists: true },
    { id: "9876543210", exists: false }
  ]
}
```

### 3. Hasil Perhitungan Statistik

Console juga menampilkan hasil perhitungan:
```
[STATISTIK] Hasil perhitungan (HANYA yang pembayaran VERIFIED):
Pondok Putra Induk: { MTs: X, MA: X, Kuliah: X, Total: X }
Pondok Putra Tahfidz: { MTs: X, MA: X, Kuliah: X, Total: X }
Pondok Putri: { MTs: X, MA: X, Kuliah: X, Total: X }
Hanya Sekolah: { MTs_L: X, MTs_P: X, MA_L: X, MA_P: X, Total: X }
```

## Common Issues & Solutions

### Issue 1: Statistik Kosong atau Tidak Sesuai

**Kemungkinan Penyebab**:
- Tidak ada pembayaran dengan status VERIFIED
- Identifier (NISN/NIK) tidak match antara pendaftar dan pembayaran
- Field `status_pembayaran` di database tidak terisi dengan benar

**Solusi**:
1. Check console logs untuk jumlah verified payments
2. Verify data pembayaran di tab "Data Pembayaran"
3. Pastikan status pembayaran = "VERIFIED" (case insensitive)
4. Check sample data yang ditampilkan di console logs
5. Aktifkan `window.debugStatistik = true` untuk detail matching

### Issue 2: Pendaftar Tidak Ter-count Padahal Sudah Verified

**Kemungkinan Penyebab**:
- NISN/NIK di data pendaftar berbeda dengan data pembayaran
- Field identifier kosong atau null
- Typo dalam penulisan NISN/NIK

**Solusi**:
1. Check identifier pendaftar vs pembayaran di console
2. Pastikan setidaknya 1 identifier (nisn/nik/nikcalon) terisi dan sama
3. Gunakan debug mode untuk trace matching

### Issue 3: Angka Statistik Berbeda dengan Ekspektasi

**Kemungkinan Penyebab**:
- Filter program/jenjang tidak sesuai dengan data
- Field `rencanaprogram` atau `rencanatingkat` kosong/tidak sesuai format

**Solusi**:
1. Check sample data verified di console logs
2. Verify nilai `rencana_program` dan `rencanatingkat`
3. Pastikan value exactly match dengan:
   - "Pondok Putra Induk"
   - "Pondok Putra Tahfidz"
   - "Pondok Putri"
   - "Hanya Sekolah"
4. Jenjang: "MTs", "MA", "Kuliah"

## Testing Statistik

### Manual Test Steps

1. **Prepare Test Data**:
   - Buat minimal 5 pendaftar dengan berbagai program/jenjang
   - Upload pembayaran untuk beberapa pendaftar
   - Verify beberapa pembayaran (status = VERIFIED)

2. **Test Matching**:
   - Buka admin dashboard
   - Check console logs
   - Verify jumlah "Pendaftar dengan pembayaran VERIFIED" sesuai

3. **Test Statistics**:
   - Aktifkan `window.debugStatistik = true`
   - Refresh halaman
   - Trace setiap pendaftar apakah ter-match dengan benar
   - Verify breakdown per program/jenjang

4. **Test Edge Cases**:
   - Pendaftar dengan NISN only (no NIK)
   - Pendaftar dengan NIK only (no NISN)
   - Pendaftar dengan nikcalon field
   - Pembayaran dengan identifier yang tidak match

## Database Schema Requirement

### Table: `pendaftar`
Required fields untuk statistik:
- `nisn` (varchar/text)
- `nik` atau `nikcalon` (varchar/text)
- `rencanaprogram` (varchar/text)
- `rencanatingkat` (varchar/text)
- `jeniskelamin` (varchar/text) - untuk Hanya Sekolah
- `namalengkap` (varchar/text)
- `statusberkas` (varchar/text)

### Table: `pembayaran`
Required fields:
- `nisn` (varchar/text)
- `nik` atau `nikcalon` (varchar/text)
- `status_pembayaran` (varchar/text) - value: "VERIFIED", "PENDING", "REJECTED"
- `nama_lengkap` (varchar/text)
- `jumlah` (numeric)

## Performance Considerations

### Caching Strategy
- Frontend fetch ulang data setiap kali load/refresh
- No caching untuk memastikan data real-time
- Auto-refresh setiap 30 detik untuk tab pembayaran

### Optimization
- Matching menggunakan Map() untuk O(1) lookup
- Filter array dilakukan di client-side
- Minimal database queries (2 fetch: pendaftar + pembayaran)

## Version History

### v2.0 (Current) - 2025-10-24
✅ **Verified Payment Filtering Implemented**
- Statistik HANYA menghitung pendaftar dengan pembayaran VERIFIED
- Robust matching dengan multiple identifiers (nisn/nik/nikcalon)
- Enhanced logging & debugging capabilities
- Console logs untuk troubleshooting
- Debug mode dengan `window.debugStatistik = true`

### v1.0 (Previous)
- Statistik menghitung semua pendaftar tanpa filter pembayaran
- Basic status counting

---

## Support & Maintenance

Jika ada issue atau pertanyaan terkait statistik:
1. Check console logs terlebih dahulu
2. Aktifkan debug mode
3. Verify data di database
4. Contact developer dengan screenshot console logs

