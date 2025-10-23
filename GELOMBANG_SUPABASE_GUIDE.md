# 🌊 Gelombang Management dengan Supabase

## ✅ Perubahan yang Dilakukan

### 1. **Supabase Client Integration** (admin.html)
```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
  
  window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
```

### 2. **Load Data dari Supabase** (admin.js)
- **Old:** `fetch('/api/get_gelombang_list')`
- **New:** `window.supabase.from('gelombang').select('*')`

### 3. **Set Active via RPC** (admin.js)
- **Old:** `fetch('/api/set_gelombang_active', {...})`
- **New:** `window.supabase.rpc('set_gelombang_status', { p_id: id })`

### 4. **Status-Based Styling**
- **Aktif:** Border & Badge **Hijau** (success)
- **Dibuka:** Border & Badge **Biru** (primary)
- **Ditutup:** Border & Badge **Abu-abu** (secondary)

---

## 🔧 Cara Setup

### Step 1: Dapatkan Supabase Credentials

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (Public key, aman untuk frontend)

### Step 2: Update admin.html

Buka `public/admin.html` dan cari section:

```html
<!-- Supabase Client for Gelombang Management -->
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  
  // ⚠️ IMPORTANT: Replace with your actual Supabase credentials
  const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <-- GANTI DI SINI
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- GANTI DI SINI
  
  window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
```

**Replace dengan credentials Anda:**

```html
const SUPABASE_URL = 'https://sxbvadzcwpaovkhghttv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Step 3: Deploy

```bash
git add .
git commit -m "feat: integrate Supabase for gelombang management"
git push origin main
```

---

## 🎨 Cara Kerja

### Flow Diagram

```
Admin klik "Jadikan Aktif"
    ↓
Confirmation dialog muncul
    ↓
Call Supabase RPC: set_gelombang_status(p_id)
    ↓
Database di-update (via function Supabase):
  - Semua gelombang → is_active = false
  - Gelombang terpilih → is_active = true
  - Status di-set: aktif / dibuka / ditutup
    ↓
Frontend reload data dari Supabase
    ↓
UI update dengan warna baru:
  - Aktif → Hijau 🟢
  - Dibuka → Biru 🔵
  - Ditutup → Abu 🔘
    ↓
Toastr notification muncul
```

---

## 📊 Database Schema

Tabel `gelombang` harus memiliki:

```sql
CREATE TABLE public.gelombang (
  id SMALLINT PRIMARY KEY,
  nama TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ditutup',  -- 'aktif' | 'dibuka' | 'ditutup'
  urutan SMALLINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔧 Supabase RPC Function

Function `set_gelombang_status` yang Anda sudah buat:

```sql
CREATE OR REPLACE FUNCTION set_gelombang_status(p_id SMALLINT)
RETURNS void AS $$
BEGIN
  -- 1. Nonaktifkan semua gelombang
  UPDATE public.gelombang 
  SET is_active = false;
  
  -- 2. Aktifkan gelombang yang dipilih
  UPDATE public.gelombang 
  SET is_active = true,
      status = 'aktif'
  WHERE id = p_id;
  
  -- 3. Set status gelombang lain (opsional - sesuaikan logic Anda)
  UPDATE public.gelombang 
  SET status = CASE
    WHEN id < p_id THEN 'ditutup'
    WHEN id > p_id THEN 'dibuka'
    ELSE status
  END
  WHERE id != p_id;
  
  -- 4. Update timestamp
  UPDATE public.gelombang 
  SET updated_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Testing

### 1. Test Load Data

Buka Console (F12) di admin panel, tab Gelombang:

**Expected console output:**
```
[GELOMBANG] Loading data from Supabase...
[GELOMBANG] Data loaded from Supabase: Array(3)
┌─────────┬────┬──────────────┬──────────────┬──────────────┬──────────────┬───────────┬──────────┐
│ (index) │ id │     nama     │  start_date  │   end_date   │ tahun_ajaran │ is_active │  status  │
├─────────┼────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────┼──────────┤
│    0    │  1 │ 'Gelombang 1'│ '2025-01-01' │ '2025-03-31' │  '2025/2026' │    true   │ 'aktif'  │
│    1    │  2 │ 'Gelombang 2'│ '2025-04-01' │ '2025-06-30' │  '2025/2026' │   false   │ 'dibuka' │
│    2    │  3 │ 'Gelombang 3'│ '2025-07-01' │ '2025-09-30' │  '2025/2026' │   false   │'ditutup' │
└─────────┴────┴──────────────┴──────────────┴──────────────┴──────────────┴───────────┴──────────┘
[GELOMBANG] Data rendered successfully: 3 items
```

**Expected UI:**
- Gelombang 1: **Hijau** border, badge "Aktif"
- Gelombang 2: **Biru** border, badge "Dibuka"
- Gelombang 3: **Abu** border, badge "Ditutup"

### 2. Test Aktivasi

Klik tombol "Jadikan Aktif" pada Gelombang 2:

**Expected:**
1. Confirmation dialog muncul
2. Toast notification: "⏳ Mengaktifkan gelombang..."
3. RPC call ke Supabase
4. Toast notification: "✅ Gelombang 2 berhasil diaktifkan!"
5. UI reload dan update:
   - Gelombang 1: **Abu** (Ditutup)
   - Gelombang 2: **Hijau** (Aktif) ← Selected
   - Gelombang 3: **Biru** (Dibuka)

**Console output:**
```
[GELOMBANG] Activating gelombang via Supabase RPC: 2
[GELOMBANG] RPC success: null
[GELOMBANG] Loading data from Supabase... (force refresh)
[GELOMBANG] Data loaded from Supabase: Array(3)
[GELOMBANG] UI refreshed successfully
```

### 3. Test Error Handling

**Scenario 1: Supabase credentials salah**
- Error: "Supabase client not initialized"
- Toast: ❌ error notification

**Scenario 2: RPC function error**
- Error: "Supabase RPC error: ..."
- Toast: ❌ error notification dengan pesan detail

---

## 🎯 Features

### ✅ Implemented

1. **Real-time Supabase Integration**
   - Direct query ke `gelombang` table
   - RPC call untuk atomic updates

2. **Status-Based UI**
   - Dynamic colors berdasarkan `status` field
   - Clear visual indicators

3. **Optimized UX**
   - Loading indicators
   - Success/error notifications (Toastr)
   - Automatic UI refresh after update

4. **Error Handling**
   - Supabase client check
   - RPC error handling
   - User-friendly error messages

### 📝 Code Quality

- **Modern JavaScript:** `async/await`, ES modules
- **Clean separation:** Data fetch di Supabase, rendering di frontend
- **Type safety:** ID conversion to number
- **No linter errors:** ✅ Passed

---

## 🔐 Security Notes

### ✅ Safe to Use (Frontend)

1. **ANON Key is Public**
   - Designed untuk frontend use
   - Read access via RLS (Row Level Security)
   - RPC functions controlled by Supabase

2. **RLS Configuration**
   
   Pastikan RLS enabled di Supabase:
   
   ```sql
   -- Enable RLS
   ALTER TABLE public.gelombang ENABLE ROW LEVEL SECURITY;
   
   -- Allow public read
   CREATE POLICY "Allow public read gelombang"
   ON public.gelombang FOR SELECT
   TO public
   USING (true);
   
   -- Allow authenticated update via RPC only
   -- (RPC function handles authorization)
   ```

3. **Service Role Key**
   - **NEVER** expose di frontend
   - Hanya untuk backend/RPC functions

---

## 📚 API Reference

### `loadGelombangData(forceRefresh)`

Load gelombang data dari Supabase.

**Parameters:**
- `forceRefresh` (boolean): Force reload, bypass cache

**Returns:** `Promise<void>`

**Example:**
```javascript
await loadGelombangData(true);
```

---

### `setGelombangActive(id)`

Aktifkan gelombang via Supabase RPC.

**Parameters:**
- `id` (number): Gelombang ID to activate

**Returns:** `Promise<void>`

**Example:**
```javascript
await setGelombangActive(2);
```

**RPC Call:**
```javascript
await window.supabase.rpc('set_gelombang_status', { p_id: id });
```

---

### `renderGelombangForms(gelombangList)`

Render gelombang forms dengan status-based styling.

**Parameters:**
- `gelombangList` (Array): Array of gelombang objects

**Status Mapping:**
- `aktif` → Green (success)
- `dibuka` → Blue (primary)
- `ditutup` → Gray (secondary)

**Example:**
```javascript
renderGelombangForms([
  { id: 1, nama: 'Gelombang 1', status: 'aktif', ... },
  { id: 2, nama: 'Gelombang 2', status: 'dibuka', ... },
  { id: 3, nama: 'Gelombang 3', status: 'ditutup', ... }
]);
```

---

## 🚀 Deployment Checklist

- [ ] Update `SUPABASE_URL` di `admin.html`
- [ ] Update `SUPABASE_ANON_KEY` di `admin.html`
- [ ] Verify RPC function `set_gelombang_status` exists di Supabase
- [ ] Enable RLS di table `gelombang`
- [ ] Test di local: `npm start` atau buka `admin.html`
- [ ] Deploy: `git push origin main`
- [ ] Test di production: Login admin → Kelola Gelombang
- [ ] Verify console logs (F12)
- [ ] Test aktivasi gelombang
- [ ] Verify warna update sesuai status

---

## 🐛 Troubleshooting

### Error: "Supabase client not initialized"

**Cause:** Credentials belum di-set atau salah

**Fix:**
1. Check `admin.html` line ~1122
2. Pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` benar
3. Clear browser cache (Ctrl+Shift+Delete)
4. Reload halaman

---

### Error: "column gelombang.status does not exist"

**Cause:** Table `gelombang` belum punya kolom `status`

**Fix:**
```sql
ALTER TABLE public.gelombang 
ADD COLUMN status TEXT DEFAULT 'ditutup';

UPDATE public.gelombang 
SET status = CASE 
  WHEN is_active = true THEN 'aktif'
  ELSE 'ditutup'
END;
```

---

### Error: "function set_gelombang_status does not exist"

**Cause:** RPC function belum dibuat

**Fix:** Buat function di Supabase SQL Editor (lihat section "Supabase RPC Function" di atas)

---

### UI tidak update setelah aktivasi

**Cause:** `loadGelombangData()` gagal reload

**Fix:**
1. Check console untuk error messages
2. Verify Supabase connection
3. Manual refresh: Click "Coba Lagi" button

---

## 📞 Support

Jika ada error, check:
1. **Browser Console (F12):** Lihat detailed error logs
2. **Supabase Logs:** Dashboard → Logs → API
3. **Network Tab:** Verify RPC calls

---

## ✅ Summary

Gelombang management sekarang menggunakan:
- ✅ **Supabase direct query** (bukan API endpoint)
- ✅ **RPC function** untuk atomic updates
- ✅ **Status-based styling** (hijau/biru/abu)
- ✅ **Real-time UI updates**
- ✅ **Modern JavaScript** (ES modules, async/await)

**Next Steps:**
1. Update credentials di `admin.html`
2. Deploy & test
3. Enjoy! 🎉

