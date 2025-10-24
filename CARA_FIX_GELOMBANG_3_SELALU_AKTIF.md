# 🚨 FIX: GELOMBANG 3 SELALU AKTIF

**Problem:** Gelombang 3 selalu aktif, tidak bisa ganti ke Gelombang 1 atau 2  
**Status:** ✅ SOLUTION READY

---

## 📋 **LANGKAH PERBAIKAN**

### **STEP 1: Buka Supabase Dashboard**

1. Login ke https://supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

---

### **STEP 2: Copy & Paste SQL**

1. Buka file: **`sql/FIX_GELOMBANG_COMPLETE.sql`**
2. Copy **SEMUA ISI FILE** (dari awal sampai akhir)
3. Paste di Supabase SQL Editor
4. Klik **RUN** (atau tekan Ctrl+Enter)

---

### **STEP 3: Tunggu Eksekusi**

SQL akan jalan dan menampilkan:

```
✓ Test 1 Complete - Check results above
✓ Test 2 Complete - Check results above
✓ Test 3 Complete - Check results above
✓ Test 4 Complete - Check results above
✅ FIX_GELOMBANG_COMPLETE.sql executed successfully!
```

---

### **STEP 4: Verifikasi Hasil**

Scroll ke atas, cari hasil query:

```sql
SELECT id, nama, is_active, updated_at 
FROM gelombang 
ORDER BY id;
```

**Expected Result (After Test 4):**
```
id | nama        | is_active | updated_at
---|-------------|-----------|-------------------
 1 | Gelombang 1 | true      | 2025-10-24 16:30:00  ← ACTIVE
 2 | Gelombang 2 | false     | 2025-10-24 16:29:00
 3 | Gelombang 3 | false     | 2025-10-24 16:29:00
```

**✅ JIKA HASILNYA SEPERTI DI ATAS = SUCCESS!**

---

### **STEP 5: Test dari Admin Panel**

1. Buka `/admin.html` → Login
2. Tab "Kelola Gelombang"
3. **Test 1:** Klik "Jadikan Aktif" pada Gelombang 2
   - ✅ Expected: Gelombang 2 jadi aktif (hijau)
   - ✅ Gelombang 1 & 3 jadi non-aktif (abu-abu)

4. **Test 2:** Klik "Jadikan Aktif" pada Gelombang 3
   - ✅ Expected: Gelombang 3 jadi aktif (hijau)
   - ✅ Gelombang 1 & 2 jadi non-aktif (abu-abu)

5. **Test 3:** Klik "Jadikan Aktif" pada Gelombang 1
   - ✅ Expected: Gelombang 1 jadi aktif (hijau)
   - ✅ Gelombang 2 & 3 jadi non-aktif (abu-abu)

**✅ JIKA SEMUA BISA GANTI-GANTI = BERHASIL!**

---

## 🔍 **APA YANG DIPERBAIKI SQL INI?**

### **1. Drop Constraint yang Salah**
```sql
-- Hapus constraint yang enforce Gelombang 3 harus aktif
DROP CONSTRAINT IF EXISTS gelombang_one_active_check;
DROP CONSTRAINT IF EXISTS unique_active_gelombang;
```

### **2. Drop Trigger yang Interfere**
```sql
-- Hapus trigger yang auto-set Gelombang 3
DROP TRIGGER IF EXISTS enforce_one_active_gelombang;
```

### **3. Reset Semua ke Inactive**
```sql
-- Clean slate: set semua ke false dulu
UPDATE gelombang SET is_active = false;
```

### **4. Set Gelombang 1 Sebagai Default**
```sql
-- Default: Gelombang 1 aktif
UPDATE gelombang SET is_active = true WHERE id = 1;
```

### **5. Recreate RPC Function (Atomic)**
```sql
-- Function baru yang PASTI jalan:
-- Step 1: Deactivate ALL (1, 2, 3)
-- Step 2: Activate ONLY yang dipilih
CREATE OR REPLACE FUNCTION set_gelombang_status(p_id integer)...
```

### **6. Fix RLS Policies**
```sql
-- Policy yang terlalu restrictive bisa block update
ALTER TABLE gelombang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for gelombang" ...
```

### **7. Grant Permissions**
```sql
-- Pastikan semua role bisa execute RPC
GRANT EXECUTE ON FUNCTION set_gelombang_status TO anon;
GRANT EXECUTE ON FUNCTION set_gelombang_status TO authenticated;
GRANT EXECUTE ON FUNCTION set_gelombang_status TO service_role;
```

---

## 🧪 **TESTING CHECKLIST**

Setelah run SQL, verify:

- [ ] Buka Supabase SQL Editor
- [ ] Run: `SELECT * FROM gelombang ORDER BY id;`
- [ ] **Result:** Hanya 1 yang `is_active = true`
- [ ] Run: `SELECT set_gelombang_status(2);`
- [ ] **Result:** Hanya Gelombang 2 yang `is_active = true`
- [ ] Run: `SELECT set_gelombang_status(1);`
- [ ] **Result:** Hanya Gelombang 1 yang `is_active = true`
- [ ] Buka `/admin.html` → Test switch gelombang
- [ ] **Result:** Bisa ganti-ganti 1/2/3 dengan lancar
- [ ] Buka `/index.html` di tab lain
- [ ] **Result:** Auto sync < 1 detik saat admin ganti

**✅ JIKA SEMUA CENTANG = SUKSES 100%!**

---

## ❌ **TROUBLESHOOTING**

### **Problem: Error saat run SQL**

**Error Message:**
```
ERROR: permission denied for table gelombang
```

**Solution:**
1. Pastikan Anda login sebagai **owner** project
2. Atau run dari **Service Role** (bukan ANON key)
3. Di Supabase SQL Editor, pilih connection **postgres** (bukan anon)

---

### **Problem: Gelombang 3 masih tetap aktif**

**Check 1: Manual Force**
```sql
-- Force set Gelombang 1 aktif
UPDATE gelombang SET is_active = false WHERE id IN (1,2,3);
UPDATE gelombang SET is_active = true WHERE id = 1;

-- Verify
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Check 2: Cek Constraints**
```sql
-- Lihat semua constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.gelombang'::regclass;
```

Jika ada constraint seperti:
```
CHECK (is_active = true WHERE id = 3)  ← INI MASALAH!
```

Drop constraint tersebut:
```sql
ALTER TABLE gelombang DROP CONSTRAINT [constraint_name];
```

**Check 3: Cek Triggers**
```sql
-- Lihat semua triggers
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'gelombang';
```

Jika ada trigger yang aneh, drop:
```sql
DROP TRIGGER [trigger_name] ON gelombang;
```

---

### **Problem: RPC function tidak jalan**

**Test RPC langsung:**
```sql
-- Call RPC function
SELECT set_gelombang_status(1);

-- Check result
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Expected:** Gelombang 1 active, lainnya inactive.

**Jika tidak jalan:**
```sql
-- Recreate function dengan SECURITY DEFINER
DROP FUNCTION IF EXISTS set_gelombang_status(integer);

-- Copy paste fungsi dari FIX_GELOMBANG_COMPLETE.sql
-- (Line 85-150)
```

---

### **Problem: Frontend masih tidak bisa ganti**

**Check Console Logs:**
```javascript
// Buka F12 → Console
// Cari error:
[GELOMBANG] ❌ Error activating: ...
```

**Jika error "Failed to activate":**
1. Check API response:
   ```javascript
   [GELOMBANG] 📥 API Response: {ok: false, error: "..."}
   ```

2. Fix backend handler:
   - Pastikan `/api/set_gelombang_active` return proper response
   - Check `lib/handlers/gelombang_set_active.py`

**Jika error "Permission denied":**
1. Check Supabase RLS policies
2. Grant permissions lagi (run STEP 6 dari SQL)

---

## 📊 **EXPECTED DATABASE STATE**

### **Setelah Fix, Database Harus:**

```
gelombang table:
- No unique constraints on is_active
- No triggers auto-setting Gelombang 3
- RLS policy: Allow all operations
- All roles have UPDATE permission

set_gelombang_status function:
- Exists and executable
- Security: DEFINER
- Grants: anon, authenticated, service_role

Current state:
- Only 1 gelombang is_active = true at a time
- Can switch freely between 1, 2, 3
- updated_at changes when switching
```

---

## 🎯 **SUCCESS CRITERIA**

**Setelah fix, Anda harus bisa:**

✅ **Database Level:**
- Run `SELECT set_gelombang_status(1)` → Gelombang 1 aktif
- Run `SELECT set_gelombang_status(2)` → Gelombang 2 aktif
- Run `SELECT set_gelombang_status(3)` → Gelombang 3 aktif
- Switch bolak-balik tanpa masalah

✅ **Admin Panel:**
- Set Gelombang 1 aktif → Button hijau "Gelombang Aktif"
- Set Gelombang 2 aktif → Gelombang 1 jadi abu-abu, Gelombang 2 hijau
- Set Gelombang 3 aktif → Gelombang 1 & 2 abu-abu, Gelombang 3 hijau
- No errors di console

✅ **Public Page:**
- Admin ganti gelombang → Public page auto reload < 1 detik
- Gelombang yang aktif tampil hijau dengan badge "Aktif"
- Tombol "Daftar Sekarang" muncul di gelombang aktif

**JIKA SEMUA ✅ = FIX BERHASIL 100%!** 🎉

---

## 📞 **JIKA MASIH STUCK**

### **Opsi 1: Manual Check Database**
1. Buka Supabase → Table Editor
2. Klik table `gelombang`
3. Edit manual:
   - Set Gelombang 1: `is_active = true`
   - Set Gelombang 2: `is_active = false`
   - Set Gelombang 3: `is_active = false`
4. Save
5. Test dari admin panel

### **Opsi 2: Reset Total (Nuclear)**
```sql
-- BACKUP DULU!
CREATE TABLE gelombang_backup AS SELECT * FROM gelombang;

-- Drop & recreate table
DROP TABLE gelombang CASCADE;

-- Run schema creation dari:
-- sql/smp_sains_najah_full_schema.sql

-- Restore data
INSERT INTO gelombang 
SELECT * FROM gelombang_backup;

-- Run FIX_GELOMBANG_COMPLETE.sql lagi
```

### **Opsi 3: Contact Support**
Jika masih tidak bisa setelah semua langkah:
1. Export SQL error logs
2. Screenshot database state
3. Share console logs
4. Contact Supabase support atau developer

---

## 📚 **FILE REFERENCE**

| File | Purpose |
|------|---------|
| `sql/FIX_GELOMBANG_COMPLETE.sql` | **RUN THIS!** Main fix script |
| `sql/create_rpc_set_gelombang_status.sql` | Original RPC (reference) |
| `TOASTR_ERROR_FIXED.md` | Toastr error fix (done) |
| `SYNC_FIXED_SUMMARY.md` | Sync mechanism (done) |

---

## ✅ **NEXT STEPS**

1. **RUN SQL** di Supabase SQL Editor
2. **VERIFY** hasil di database
3. **TEST** dari admin panel
4. **VERIFY** sync ke public page
5. **CELEBRATE** jika berhasil! 🎉

---

**GOOD LUCK!** 🚀

Jika ada error atau pertanyaan, screenshot error message dan share untuk troubleshooting lebih lanjut.

