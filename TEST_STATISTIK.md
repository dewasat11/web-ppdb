# 🧪 Test Plan: Statistik Pendaftar dengan Pembayaran Verified

## Objective
Memastikan statistik pendaftar hanya menghitung data dengan pembayaran yang sudah VERIFIED.

## Test Scenarios

### Scenario 1: Basic Verified Payment Matching

**Setup**:
1. Buat 3 pendaftar:
   - Pendaftar A: NISN = "1111111111", Program = "Pondok Putra Induk", Jenjang = "MTs"
   - Pendaftar B: NISN = "2222222222", Program = "Pondok Putri", Jenjang = "MA"
   - Pendaftar C: NIK = "3333333333" (no NISN), Program = "Hanya Sekolah", Jenjang = "MTs", Gender = "L"

2. Buat 2 pembayaran:
   - Pembayaran 1: NISN = "1111111111", Status = "VERIFIED"
   - Pembayaran 2: NISN = "2222222222", Status = "PENDING"

**Expected Results**:
- Total pendaftar: 3
- Pendaftar dengan pembayaran VERIFIED: 1 (hanya Pendaftar A)
- Statistik Pondok Putra Induk MTs: 1
- Statistik Pondok Putri MA: 0 (karena status PENDING)
- Statistik Hanya Sekolah MTs L: 0 (tidak ada pembayaran)

**Verification Steps**:
1. Buka admin dashboard
2. Check console log: `[STATISTIK] Pendaftar dengan pembayaran VERIFIED: 1`
3. Verify kartu statistik menampilkan angka yang benar
4. Check sample data di console

---

### Scenario 2: Multiple Identifiers (NISN + NIK)

**Setup**:
1. Buat pendaftar dengan:
   - NISN = "4444444444"
   - NIK = "5555555555"
   - Program = "Pondok Putra Tahfidz", Jenjang = "MA"

2. Buat pembayaran dengan:
   - NIK = "5555555555" (using NIK, not NISN)
   - Status = "VERIFIED"

**Expected Results**:
- Pendaftar harus ter-match dengan pembayaran
- Statistik Pondok Putra Tahfidz MA: 1

**Verification**:
```javascript
// Di console, jalankan:
window.debugStatistik = true
// Refresh halaman
// Check [MATCH DEBUG] log:
// isVerified: true
// hasInMap: [{ id: "4444444444", exists: false }, { id: "5555555555", exists: true }]
```

---

### Scenario 3: Edge Case - NIKCalon Field

**Setup**:
1. Pendaftar dengan:
   - nikcalon = "6666666666" (no nisn, no nik)
   - Program = "Pondok Putri", Jenjang = "Kuliah"

2. Pembayaran dengan:
   - nik = "6666666666"
   - Status = "VERIFIED"

**Expected Results**:
- Pendaftar ter-match dengan pembayaran
- Statistik Pondok Putri Kuliah: 1

---

### Scenario 4: Status Pembayaran Variations

**Setup**:
1. Buat 4 pendaftar (Program/Jenjang acak)
2. Buat 4 pembayaran dengan status berbeda:
   - Status = "VERIFIED"
   - Status = "verified" (lowercase)
   - Status = "PENDING"
   - Status = "REJECTED"

**Expected Results**:
- Hanya pendaftar dengan status "VERIFIED" atau "verified" yang ter-count
- System case-insensitive untuk status
- Total verified: 2

**Verification**:
```
[STATISTIK] Verified payments map size: 2
[STATISTIK] Pendaftar dengan pembayaran VERIFIED: 2
```

---

### Scenario 5: Empty/Null Identifiers

**Setup**:
1. Pendaftar tanpa NISN/NIK (semua null)
2. Pendaftar dengan NISN kosong string ""
3. Pendaftar dengan NIK valid

**Expected Results**:
- Pendaftar tanpa identifier tidak akan match
- Empty string tidak dianggap valid identifier
- Hanya pendaftar dengan identifier valid yang bisa match

**Verification**:
```javascript
window.debugStatistik = true
// Check [MATCH DEBUG] untuk masing-masing pendaftar
// identifiers: [] → tidak akan match
// identifiers: [""] → tidak akan match (filtered by .filter(Boolean))
// identifiers: ["1234567890"] → bisa match jika ada pembayaran
```

---

### Scenario 6: Program & Jenjang Filtering

**Setup**:
Buat pendaftar VERIFIED untuk setiap kombinasi:

| Program | Jenjang | Gender | Count |
|---------|---------|--------|-------|
| Pondok Putra Induk | MTs | L | 2 |
| Pondok Putra Induk | MA | L | 3 |
| Pondok Putra Induk | Kuliah | L | 1 |
| Pondok Putra Tahfidz | MTs | L | 1 |
| Pondok Putra Tahfidz | MA | L | 2 |
| Pondok Putra Tahfidz | Kuliah | L | 1 |
| Pondok Putri | MTs | P | 3 |
| Pondok Putri | MA | P | 4 |
| Pondok Putri | Kuliah | P | 2 |
| Hanya Sekolah | MTs | L | 2 |
| Hanya Sekolah | MTs | P | 3 |
| Hanya Sekolah | MA | L | 1 |
| Hanya Sekolah | MA | P | 2 |

**Expected Results**:
```
[STATISTIK] Hasil perhitungan (HANYA yang pembayaran VERIFIED):
Pondok Putra Induk: { MTs: 2, MA: 3, Kuliah: 1, Total: 6 }
Pondok Putra Tahfidz: { MTs: 1, MA: 2, Kuliah: 1, Total: 4 }
Pondok Putri: { MTs: 3, MA: 4, Kuliah: 2, Total: 9 }
Hanya Sekolah: { MTs_L: 2, MTs_P: 3, MA_L: 1, MA_P: 2, Total: 8 }
```

---

### Scenario 7: Real-time Update

**Setup**:
1. Load admin dashboard (statistik showing X verified)
2. Di tab lain, verify 1 pembayaran baru
3. Refresh admin dashboard

**Expected Results**:
- Statistik bertambah +1
- Console log menunjukkan jumlah baru
- Kartu statistik update

---

### Scenario 8: Performance Test

**Setup**:
- 100 pendaftar
- 80 pembayaran verified
- 20 pembayaran pending/rejected

**Expected Results**:
- Load time < 2 detik
- Console logs menampilkan persentase: 80%
- Statistik accurate

**Verification**:
```
[STATISTIK] Total pendaftar: 100
[STATISTIK] Pendaftar dengan pembayaran VERIFIED: 80
[STATISTIK] Persentase verified: 80.0%
```

---

## Automated Test Checklist

### Backend Testing
- [ ] `pembayaran_list.py` returns nisn, nik, nikcalon fields
- [ ] `pembayaran_list.py` maps status_pembayaran correctly
- [ ] `pendaftar_list.py` returns all identifier fields
- [ ] `pendaftar_list.py` returns rencana_program, rencanatingkat, jeniskelamin

### Frontend Testing
- [ ] verifiedPayments Map created correctly
- [ ] hasVerifiedPayment() matches all identifiers
- [ ] Statistics only count verified pendaftar
- [ ] Console logs display correct information
- [ ] Debug mode works with `window.debugStatistik = true`

### Integration Testing
- [ ] Matching works with NISN only
- [ ] Matching works with NIK only
- [ ] Matching works with nikcalon
- [ ] Case-insensitive status check
- [ ] Empty/null identifiers handled correctly
- [ ] Multiple identifiers per pendaftar handled
- [ ] Program filtering works correctly
- [ ] Jenjang filtering works correctly
- [ ] Gender filtering for Hanya Sekolah works

---

## Debug Commands

### 1. Check Verified Payments Map
```javascript
// Di browser console setelah load admin page:
// Map akan tersimpan dalam closure, tidak bisa diakses langsung
// Tapi bisa lihat di console logs:
// [STATISTIK] Verified payments map size: XX
// [STATISTIK] Verified payment identifiers: [...]
```

### 2. Enable Detail Matching Debug
```javascript
window.debugStatistik = true;
// Reload halaman atau switch ke tab pendaftar
```

### 3. Check Sample Data
```javascript
// Lihat console untuk:
// [STATISTIK] Sample pendaftar VERIFIED pertama: {...}
// [STATISTIK] Sample pendaftar tanpa pembayaran: {...}
```

### 4. Manual Verification
```javascript
// Ambil data manual (di console):
fetch('/api/pendaftar_list')
  .then(r => r.json())
  .then(d => {
    console.log('Total pendaftar:', d.data.length);
    console.log('Sample:', d.data[0]);
  });

fetch('/api/pembayaran_list')
  .then(r => r.json())
  .then(d => {
    const verified = d.data.filter(p => (p.status || '').toUpperCase() === 'VERIFIED');
    console.log('Total pembayaran:', d.data.length);
    console.log('Verified pembayaran:', verified.length);
    console.log('Sample verified:', verified[0]);
  });
```

---

## Success Criteria

✅ **Test Passed If**:
1. Console logs menampilkan jumlah yang akurat
2. Statistik kartu sesuai dengan pembayaran verified
3. Matching bekerja dengan semua jenis identifier (nisn/nik/nikcalon)
4. Status pembayaran case-insensitive
5. Pendaftar tanpa pembayaran verified TIDAK ter-count di statistik
6. Debug mode memberikan informasi detail yang berguna
7. Performance acceptable (<2s untuk 100+ data)

❌ **Test Failed If**:
1. Statistik menghitung pendaftar tanpa pembayaran verified
2. Matching gagal dengan identifier yang valid
3. Console menampilkan error
4. Angka statistik tidak sesuai dengan data pembayaran
5. Debug mode tidak bekerja

---

## Rollback Plan

Jika ada masalah serius:
1. Revert ke commit sebelumnya
2. Check git log untuk commit "Fix statistik matching"
3. Deploy versi stable sebelumnya
4. Investigate issue di development

---

## Test Report Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [Production/Staging/Local]

Scenario 1: [PASS/FAIL]
- Notes: ...

Scenario 2: [PASS/FAIL]
- Notes: ...

... (all scenarios)

Overall Result: [PASS/FAIL]
Issues Found: ...
Recommendations: ...
```

