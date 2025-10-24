# 🎯 GELOMBANG FINAL FIX - Solusi Lengkap

## ❌ **Masalah:**
- Gelombang 2 selalu aktif walau klik yang lain
- Button tidak switch dengan benar

## ✅ **Solusi:**
Backend sekarang menggunakan **RPC function database** yang lebih atomic dan reliable.

---

## 📋 **LANGKAH INSTALASI (WAJIB!):**

### **STEP 1: Verifikasi RPC Function Ada**

Buka **Supabase SQL Editor**, run query ini:

```sql
-- Cek apakah RPC function ada
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'set_gelombang_status';
```

**Expected Result:**
- Jika ada 1 row → ✅ RPC function sudah ada, lanjut ke STEP 3
- Jika **TIDAK ADA** (0 rows) → ⚠️ Lanjut ke STEP 2

---

### **STEP 2: Install RPC Function (Jika Belum Ada)**

Copy & paste SQL ini ke Supabase SQL Editor, lalu **RUN:**

```sql
-- ========================================
-- RPC FUNCTION: set_gelombang_status
-- ========================================

CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS json AS $$
DECLARE
  v_gelombang_exists boolean;
BEGIN
  -- Check if gelombang exists
  SELECT EXISTS(SELECT 1 FROM public.gelombang WHERE id = p_id) INTO v_gelombang_exists;
  
  IF NOT v_gelombang_exists THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Gelombang dengan ID ' || p_id || ' tidak ditemukan',
      'active_id', NULL
    );
  END IF;
  
  -- ATOMIC OPERATION: Deactivate all gelombang first
  UPDATE public.gelombang 
  SET is_active = false, status = 'ditutup', updated_at = NOW()
  WHERE is_active = true;
  
  -- Activate the selected gelombang
  UPDATE public.gelombang 
  SET is_active = true, status = 'aktif', updated_at = NOW()
  WHERE id = p_id;
  
  -- Return success
  RETURN json_build_object(
    'ok', true,
    'message', 'Gelombang ' || p_id || ' berhasil diaktifkan',
    'active_id', p_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Error: ' || SQLERRM,
      'active_id', NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO service_role;

-- Test the function
SELECT public.set_gelombang_status(1);
SELECT id, nama, is_active FROM gelombang ORDER BY urutan;
```

**Expected Output:**
```
✅ Function created successfully
✅ Test result: {"ok": true, "message": "Gelombang 1 berhasil diaktifkan", "active_id": 1}
```

---

### **STEP 3: Reset Database State**

Pastikan database dalam keadaan bersih:

```sql
-- Reset all gelombang
UPDATE public.gelombang SET is_active = false, status = 'ditutup';
UPDATE public.gelombang SET is_active = true, status = 'aktif' WHERE id = 1;

-- Verify
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;
```

**Expected:**
```
id | nama        | is_active | status
---|-------------|-----------|--------
1  | Gelombang 1 | true      | aktif    ← ONLY THIS ONE
2  | Gelombang 2 | false     | ditutup
3  | Gelombang 3 | false     | ditutup
```

---

### **STEP 4: Deploy Backend Changes**

```bash
git add lib/handlers/gelombang_set_active.py
git add public/assets/js/admin.js
git commit -m "Fix: Use RPC function for atomic gelombang activation"
git push
```

Wait **2-3 minutes** for Vercel to deploy.

---

### **STEP 5: Test di Browser**

1. **Hard refresh browser:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Buka admin.html** → Tab "Kelola Gelombang"

3. **Open Console (F12)**

4. **Test Switch Gelombang 1:**
   - Klik "Jadikan Aktif" pada Gelombang 1
   - Expected console logs:
   ```
   [GELOMBANG] 🚀 START: Activating Gelombang 1
   [SET_GELOMBANG_ACTIVE] Using RPC function 'set_gelombang_status' with p_id=1
   [SET_GELOMBANG_ACTIVE] RPC result: {ok: true, message: "...", active_id: 1}
   [GELOMBANG] ✅ SUCCESS: Gelombang 1 is now ACTIVE
   ```
   - Expected UI: Card Gelombang 1 jadi hijau, button disabled
   - Expected Alert: "✅ Gelombang 1 berhasil diaktifkan!"

5. **Test Switch Gelombang 2:**
   - Klik "Jadikan Aktif" pada Gelombang 2
   - Expected: Sama seperti di atas, tapi untuk Gelombang 2
   - Gelombang 1 harus jadi abu-abu

6. **Test Switch Gelombang 3:**
   - Klik "Jadikan Aktif" pada Gelombang 3
   - Expected: Sama seperti di atas, tapi untuk Gelombang 3
   - Gelombang 1 & 2 harus jadi abu-abu

7. **Verify Database After Each Switch:**
   
   Run di Supabase SQL Editor:
   ```sql
   SELECT id, nama, is_active FROM gelombang ORDER BY urutan;
   ```
   
   **Setelah activate Gelombang 2:**
   ```
   id | nama        | is_active
   ---|-------------|-----------
   1  | Gelombang 1 | false
   2  | Gelombang 2 | true      ← ACTIVE!
   3  | Gelombang 3 | false
   ```

---

## 🐛 **Troubleshooting:**

### **Error: "function set_gelombang_status does not exist"**

**Penyebab:** RPC function belum dibuat di database

**Solusi:** Jalankan STEP 2 di atas (install RPC function)

---

### **Error: "Gelombang 2 masih selalu aktif"**

**Diagnosis:**

1. Cek **Vercel Logs** untuk server-side logs:
   - Buka Vercel Dashboard → Project → Deployments → Latest → View Logs
   - Cari log: `[SET_GELOMBANG_ACTIVE] Using RPC function 'set_gelombang_status' with p_id=X`
   - Cek apakah `p_id` sesuai dengan yang diklik

2. Cek **browser console**:
   ```javascript
   // Run ini di console
   fetch('/api/set_gelombang_active', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({id: 3})  // Test Gelombang 3
   })
   .then(r => r.json())
   .then(d => console.log('API Response:', d));
   
   // Tunggu 2 detik, lalu verify database:
   setTimeout(() => {
     fetch('/api/get_gelombang_list')
       .then(r => r.json())
       .then(d => {
         d.data.forEach(g => console.log(g.id, g.nama, 'is_active:', g.is_active));
       });
   }, 2000);
   ```

3. Jika **API response OK** tapi **database tidak berubah:**
   - Kemungkinan ada trigger atau constraint di database
   - Run di Supabase:
   ```sql
   -- Cek triggers
   SELECT trigger_name, event_manipulation, action_statement
   FROM information_schema.triggers
   WHERE event_object_table = 'gelombang';
   
   -- Cek constraints
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'public.gelombang'::regclass;
   ```

---

### **Error: "Multiple gelombang aktif"**

**Solusi:** Manual reset

```sql
-- Force reset
UPDATE gelombang SET is_active = false;
UPDATE gelombang SET is_active = true WHERE id = 1;

-- Verify
SELECT id, nama, is_active FROM gelombang ORDER BY urutan;
```

---

## ✅ **Success Criteria:**

Sistem dianggap **BERHASIL** jika:

- [ ] Klik "Jadikan Aktif" Gelombang 1 → Card G1 hijau, G2 & G3 abu-abu
- [ ] Klik "Jadikan Aktif" Gelombang 2 → Card G2 hijau, G1 & G3 abu-abu
- [ ] Klik "Jadikan Aktif" Gelombang 3 → Card G3 hijau, G1 & G2 abu-abu
- [ ] Database selalu hanya 1 gelombang `is_active = true`
- [ ] Console logs menunjukkan RPC call berhasil
- [ ] Tidak ada error merah di console
- [ ] Alert muncul: "✅ Gelombang X berhasil diaktifkan!"

---

## 📸 **Screenshot Request:**

**Setelah test, kirim screenshot:**

1. **Console logs** saat switch ke Gelombang 3 (full logs dari START sampai SUCCESS)
2. **UI cards** setelah activate Gelombang 3 (harus: G3 hijau, G1 & G2 abu)
3. **Vercel logs** (optional, kalau masih error)

---

## 🚀 **Deploy Commands:**

```bash
# Add changes
git add lib/handlers/gelombang_set_active.py
git add public/assets/js/admin.js

# Commit
git commit -m "Fix: Use atomic RPC function for gelombang activation"

# Push (auto-deploy ke Vercel)
git push

# Wait 2-3 minutes, then test!
```

---

**Status:** ✅ Ready for deployment
**Last Updated:** 2025-10-24
**Version:** 3.0 - RPC-based atomic activation

