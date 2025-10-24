# 🚨 URGENT FIX: Gelombang Button Tidak Bekerja

## ❌ **Problem**
**Klik "Jadikan Aktif" pada Gelombang 1/3 → Hasil: Tetap Gelombang 2 yang aktif**

---

## 🔍 **Diagnosis Cepat (5 Menit)**

### **Step 1: Test di Supabase SQL Editor**

Buka **Supabase SQL Editor**, copy-paste query ini **SATU PER SATU**:

#### **Test 1: Cek Status Sekarang**
```sql
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Hasil Anda Sekarang:**
```
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | ?
 2 | Gelombang 2 | true     ← Ini yang aktif sekarang
 3 | Gelombang 3 | ?
```

---

#### **Test 2: Cek Function Ada**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'set_gelombang_status';
```

**❓ Apakah muncul 1 row?**
- ✅ **YES (muncul 1 row)** → Function ada, lanjut ke Test 3
- ❌ **NO (kosong/empty)** → **Function belum dibuat!** Jump ke **Quick Fix A**

---

#### **Test 3: Test Manual Activate Gelombang 1**
```sql
SELECT set_gelombang_status(1);
```

**❓ Apa yang muncul?**

**A) Muncul JSON sukses:**
```json
{
  "success": true,
  "message": "Gelombang berhasil diaktifkan",
  ...
}
```
→ ✅ Function BEKERJA! Masalah ada di **Frontend**. Jump ke **Quick Fix B**

---

**B) Error: "function set_gelombang_status does not exist"**
```
ERROR: function set_gelombang_status(integer) does not exist
```
→ ❌ Function TIDAK ADA! Jump ke **Quick Fix A**

---

**C) Error: "permission denied"**
```
ERROR: permission denied for function set_gelombang_status
```
→ ❌ Permission TIDAK DI-GRANT! Jump ke **Quick Fix C**

---

**D) Error lain atau tidak ada response**
→ Jump ke **Quick Fix D**

---

## ⚡ **QUICK FIX A: Function Tidak Ada**

Copy-paste script ini di **Supabase SQL Editor**:

```sql
-- DROP existing (if any)
DROP FUNCTION IF EXISTS public.set_gelombang_status(p_id integer);

-- CREATE FUNCTION
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_gelombang_record record;
    v_result json;
BEGIN
    RAISE NOTICE 'Activating gelombang ID: %', p_id;
    
    -- Deactivate ALL
    UPDATE gelombang SET is_active = FALSE WHERE id != 0;
    
    -- Activate specified
    UPDATE gelombang SET is_active = TRUE WHERE id = p_id
    RETURNING * INTO v_gelombang_record;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gelombang dengan ID % tidak ditemukan', p_id;
    END IF;
    
    v_result := json_build_object(
        'success', true,
        'message', 'Gelombang berhasil diaktifkan',
        'data', row_to_json(v_gelombang_record)
    );
    
    RETURN v_result;
END;
$$;

-- GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;
```

**Klik "Run"**, lalu test ulang:

```sql
-- Test
SELECT set_gelombang_status(1);

-- Check result
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Expected:**
```
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | true      ← ONLY THIS
 2 | Gelombang 2 | false
 3 | Gelombang 3 | false
```

**✅ Jika berhasil** → Test di **Admin Panel**, klik "Jadikan Aktif" lagi

---

## ⚡ **QUICK FIX B: Function Bekerja Tapi UI Tidak Update**

**Artinya:** Database update berhasil, tapi Frontend tidak panggil function.

### **Step 1: Buka Admin Panel**
Login: `https://your-domain.com/admin.html`

### **Step 2: Buka Browser Console**
Tekan **F12** → Klik tab **"Console"**

### **Step 3: Klik "Jadikan Aktif" pada Gelombang 1**

### **Step 4: Lihat Console - Ada Error?**

**Possible Errors:**

#### **Error 1: "Supabase client not initialized"**
```
[GELOMBANG] ❌ Supabase client not initialized!
```

**Fix:** Check credentials di `admin.html` (line 1151-1152):
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';  // ← Check ini
const SUPABASE_ANON_KEY = 'eyJ...';  // ← Check ini
```

---

#### **Error 2: "function does not exist"**
```
Error: function set_gelombang_status(integer) does not exist
```

**Fix:** Function belum dibuat atau salah nama. Jalankan **Quick Fix A**.

---

#### **Error 3: "Failed to fetch" atau "NetworkError"**
```
Error: Failed to fetch
```

**Fix:** 
1. Check internet connection
2. Check Supabase URL di `admin.html`
3. Check Supabase project status (apakah down?)

---

#### **Error 4: Tidak ada error, tapi tidak ada log**

**Diagnosis:**
```javascript
// Test manual di Console:
window.supabase.rpc('set_gelombang_status', { p_id: 1 })
  .then(res => console.log('✅ Success:', res))
  .catch(err => console.error('❌ Error:', err));
```

Lihat hasilnya:
- ✅ Success → Function bekerja! Masalah di event handler
- ❌ Error → Lihat error message

---

## ⚡ **QUICK FIX C: Permission Denied**

Copy-paste di **Supabase SQL Editor**:

```sql
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;
```

**Test ulang:**
```sql
SELECT set_gelombang_status(1);
```

---

## ⚡ **QUICK FIX D: Force Reset Database**

Jika semua gagal, reset manual:

```sql
-- Force reset: Deactivate all
UPDATE gelombang SET is_active = false;

-- Activate hanya gelombang 1
UPDATE gelombang SET is_active = true WHERE id = 1;

-- Verify
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Expected:**
```
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | true      ← ONLY THIS
 2 | Gelombang 2 | false
 3 | Gelombang 3 | false
```

Lalu jalankan **Quick Fix A** untuk create function.

---

## 🎯 **Checklist Debugging**

Ikuti checklist ini **STEP BY STEP**:

### **Database Side (Supabase SQL Editor):**
- [ ] **Step 1:** Check status sekarang → Gelombang mana yang aktif?
- [ ] **Step 2:** Check function ada → `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'set_gelombang_status'`
- [ ] **Step 3:** Test manual → `SELECT set_gelombang_status(1);`
- [ ] **Step 4:** Verify result → Apakah Gelombang 1 jadi aktif?

### **Frontend Side (Admin Panel):**
- [ ] **Step 5:** Clear browser cache (Ctrl + Shift + Delete)
- [ ] **Step 6:** Refresh admin panel (Ctrl + F5)
- [ ] **Step 7:** Open console (F12)
- [ ] **Step 8:** Click "Jadikan Aktif" → Lihat console logs
- [ ] **Step 9:** Ada error? Lihat Quick Fix B

---

## 📊 **Debug File Lengkap**

Untuk debugging detail, saya sudah buat file:

📄 **`sql/DEBUG_GELOMBANG.sql`**

File ini berisi **12 test cases** lengkap untuk debug sistematis.

---

## 🆘 **Jika Masih Gagal**

**Beri tahu saya:**

1. **Hasil Test 2** (function ada atau tidak?)
   ```
   ✅ Ada 1 row
   atau
   ❌ Kosong (empty)
   ```

2. **Hasil Test 3** (test manual di SQL Editor)
   ```
   ✅ JSON sukses
   atau
   ❌ Error: [copy error message di sini]
   ```

3. **Console logs** (dari Browser F12)
   ```
   [copy semua logs di sini]
   ```

---

## ✅ **Expected Final Result**

Setelah fix, ini yang harus terjadi:

```
Admin klik "Jadikan Aktif" pada Gelombang 1
    ↓
⚡ UI update instant
    ↓
💾 Database update (via RPC)
    ↓
✅ Gelombang 1 jadi AKTIF
✅ Gelombang 2 & 3 jadi NON-AKTIF
    ↓
Refresh halaman
    ↓
✅ Gelombang 1 masih AKTIF (tersimpan!)
```

---

**Silakan jalankan Test 1, 2, 3 di Supabase SQL Editor dan beri tahu saya hasilnya!** 🚀

