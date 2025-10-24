# 🔍 DIAGNOSTIC: Notifikasi Masih Merah

## 📋 LANGKAH DEBUGGING

Ikuti langkah-langkah ini untuk mendiagnosis masalah:

---

## **STEP 1: Cek SQL Function di Database**

Buka **Supabase SQL Editor** dan jalankan query ini:

```sql
-- Query 1: Cek berapa banyak function set_gelombang_status
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type,
  oid
FROM pg_proc 
WHERE proname = 'set_gelombang_status';
```

**CRITICAL CHECK:**

✅ **HARUS hanya 1 row** dengan:
- `return_type` = `jsonb` (BUKAN `json`)
- `arguments` = `p_id integer`

❌ **Jika lebih dari 1 row** → Ada duplicate function!
❌ **Jika return_type = `json`** → Function belum diupdate!

---

### **Jika Ada Duplicate atau Return Type Masih `json`:**

Jalankan SQL ini untuk **FORCE FIX**:

```sql
-- Force drop ALL versions
DROP FUNCTION IF EXISTS public.set_gelombang_status(integer) CASCADE;
DROP FUNCTION IF EXISTS public.set_gelombang_status(smallint) CASCADE;
DROP FUNCTION IF EXISTS public.set_gelombang_status(bigint) CASCADE;

-- Recreate dengan JSONB
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS jsonb AS $$
DECLARE
  v_gelombang_exists boolean;
  v_gelombang_nama text;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.gelombang WHERE id = p_id) INTO v_gelombang_exists;
  
  IF NOT v_gelombang_exists THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Gelombang tidak ditemukan', 'active_id', NULL);
  END IF;
  
  SELECT nama INTO v_gelombang_nama FROM public.gelombang WHERE id = p_id;
  
  UPDATE public.gelombang SET is_active = false, status = 'ditutup', updated_at = NOW() WHERE is_active = true;
  UPDATE public.gelombang SET is_active = true, status = 'aktif', updated_at = NOW() WHERE id = p_id;
  
  RETURN jsonb_build_object('ok', true, 'message', v_gelombang_nama || ' berhasil diaktifkan', 'active_id', p_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM, 'active_id', NULL);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO service_role;

-- Verify
SELECT pg_get_function_result(oid) as return_type
FROM pg_proc WHERE proname = 'set_gelombang_status';
```

**Expected:** `return_type` = `jsonb`

---

## **STEP 2: Test Function Directly**

Masih di Supabase SQL Editor, test function:

```sql
SELECT public.set_gelombang_status(1);
```

**Expected Output:**
```json
{"ok": true, "message": "Gelombang 1 berhasil diaktifkan", "active_id": 1}
```

❌ **Jika error** → Screenshot error dan kirim!

---

## **STEP 3: Cek Console Browser**

1. Buka **admin.html**
2. Tekan **F12** untuk buka Console
3. Klik **"Jadikan Aktif"** pada Gelombang 1
4. **COPY SEMUA console log** dan kirim!

**Yang harus dicari:**

```
[GELOMBANG] → Response status: ???     ← Apakah 200 atau 500?
[GELOMBANG] Step 2: API Response received: ???   ← Apa isi response?
```

---

## **STEP 4: Cek Network Tab**

1. Buka **F12** → Tab **"Network"**
2. Klik **"Jadikan Aktif"** pada Gelombang 1
3. Cari request **"set_gelombang_active"**
4. Klik request tersebut
5. Lihat:
   - **Status Code:** Harus `200` (bukan `500`)
   - **Response:** Klik tab "Response" dan lihat isinya

**Screenshot dan kirim:**
- Status code
- Response body

---

## **STEP 5: Cek Vercel Logs (Server Side)**

1. Buka **Vercel Dashboard**
2. Klik project Anda
3. Klik **"Deployments"** → Latest deployment
4. Klik **"View Function Logs"**
5. Klik **"Jadikan Aktif"** pada admin.html
6. Cari log yang muncul dengan keyword:
   - `[SET_GELOMBANG_ACTIVE]`

**Screenshot dan kirim log yang muncul!**

---

## 🐛 **KEMUNGKINAN MASALAH:**

### **Masalah A: SQL Function Belum Berubah**

**Gejala:**
- Console: `Response status: 500`
- Error message: "JSON could not be generated" atau "function overloading"

**Solusi:**
→ Ulangi STEP 1 (Force drop & recreate function)

---

### **Masalah B: Vercel Belum Deploy Code Terbaru**

**Gejala:**
- Console: `Response status: 500`
- Vercel logs: Error dari code lama

**Solusi:**
```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

---

### **Masalah C: Browser Cache**

**Gejala:**
- Console: Masih pakai code JavaScript lama
- `toastr` not defined

**Solusi:**
```bash
# Clear cache
1. Ctrl + Shift + Del
2. Centang "Cached images and files"
3. Clear data
4. Hard refresh: Ctrl + Shift + R
```

---

### **Masalah D: Toastr Library Tidak Load**

**Gejala:**
- Console error: `toastr is not defined`
- Notifikasi pakai alert() (bukan toastr)

**Solusi:**
Cek apakah CDN toastr berhasil load:

1. F12 → Console
2. Ketik: `typeof toastr`
3. Expected: `"object"`
4. Jika `"undefined"` → CDN gagal load

**Fix:**
- Cek koneksi internet
- Atau ganti CDN di admin.html

---

## 📸 **YANG PERLU DIKIRIM:**

Tolong kirim screenshot/copy text dari:

1. ✅ **Supabase Query Result (STEP 1):**
   - Berapa banyak function?
   - Return type apa? (json atau jsonb?)

2. ✅ **Console Logs (STEP 3):**
   - Response status: ???
   - API Response received: ???
   - Full error message (jika ada)

3. ✅ **Network Tab (STEP 4):**
   - Status code
   - Response body

4. ✅ **Screenshot Notifikasi:**
   - Apakah alert() merah atau toastr merah?
   - Apa teks error yang muncul?

---

## ⚡ **QUICK FIX (Jika Terburu-buru):**

Jika tidak ada waktu untuk debugging, coba langkah cepat ini:

```bash
# 1. Force drop & recreate SQL function (copy dari STEP 1)
# 2. Clear browser cache total
Ctrl + Shift + Del → Clear ALL

# 3. Force redeploy Vercel
git commit --allow-empty -m "Force redeploy"
git push

# 4. Tunggu 3 menit
# 5. Buka browser baru (incognito mode)
# 6. Test lagi
```

---

**Kirim hasil diagnostic ke saya agar saya bisa bantu fix lebih spesifik!** 🚀

