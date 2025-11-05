# 🔧 Berita Image Upload - Troubleshooting Guide

## Masalah: Gambar Upload Tidak Muncul

### ✅ Checklist Debugging

#### 1. **Cek Browser Console**
Buka Developer Tools (F12) → Console tab, cari log dengan prefix `[BERITA]`:

```javascript
// Log yang seharusnya muncul:
[BERITA] File selected: image.jpg Size: 123456 Type: image/jpeg
[BERITA] Preview shown
[BERITA] Starting upload...
[BERITA] Upload path: berita/berita_1234567890_abc123.jpg
[BERITA] Upload data: { path: "berita/..." }
[BERITA] URL data: { publicUrl: "https://..." }
[BERITA] ✅ Upload success! Public URL: https://...
```

#### 2. **Cek Supabase Client**
Pastikan Supabase client sudah terinisialisasi:

```javascript
// Di browser console, ketik:
console.log(window.supabase);

// Harus return object, bukan undefined
```

**Jika undefined:**
- Refresh halaman
- Cek apakah script Supabase di `admin.html` sudah load
- Pastikan tidak ada error di Network tab

#### 3. **Cek Supabase Storage Bucket**

**A. Bucket harus ada:**
1. Buka Supabase Dashboard
2. Go to Storage
3. Pastikan bucket `hero-images` ada
4. Jika tidak ada, buat bucket baru dengan nama `hero-images`

**B. Bucket harus Public:**
1. Klik bucket `hero-images`
2. Settings → Make sure "Public bucket" is enabled
3. Jika tidak, enable public access

**C. RLS Policy harus benar:**
1. Go to Storage → Policies
2. Bucket: `hero-images`
3. Policy harus allow:
   - **SELECT** (read) untuk `anon` role
   - **INSERT** (upload) untuk `authenticated` atau `anon` role
   
   Contoh policy:
   ```sql
   -- Allow public read
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'hero-images');
   
   -- Allow upload (adjust sesuai kebutuhan)
   CREATE POLICY "Allow Upload" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'hero-images');
   ```

#### 4. **Cek File Size & Type**
- Max size: **2MB**
- Format: JPG, PNG, WebP
- Error akan muncul jika file terlalu besar atau format tidak didukung

#### 5. **Cek Preview Elements**
Pastikan elemen HTML ada:

```javascript
// Di browser console:
$("#beritaImageFile")      // File input
$("#beritaPreviewImg")     // Preview image
$("#beritaImagePreview")   // Preview container
$("#beritaImageUrl")       // Hidden URL field
```

Jika ada yang `null`, berarti HTML tidak lengkap.

#### 6. **Cek Network Tab**
Buka Developer Tools → Network tab:
1. Filter: "Supabase" atau "storage"
2. Upload gambar
3. Cek apakah ada request ke Supabase Storage
4. Lihat response status:
   - ✅ 200 = Success
   - ❌ 400/403 = Permission issue
   - ❌ 404 = Bucket not found
   - ❌ 413 = File too large

### 🔍 Common Errors & Solutions

#### Error: "Supabase client tidak tersedia"
**Solution:**
- Pastikan script Supabase di `admin.html` sudah load
- Tunggu sampai halaman selesai dimuat
- Refresh halaman

#### Error: "Bucket 'hero-images' tidak ditemukan"
**Solution:**
1. Buka Supabase Dashboard → Storage
2. Create bucket baru dengan nama `hero-images`
3. Set as Public bucket
4. Refresh admin page

#### Error: "Akses ditolak. Periksa RLS policy"
**Solution:**
1. Go to Storage → Policies
2. Create policy untuk bucket `hero-images`:
   ```sql
   -- Read policy
   CREATE POLICY "Public Read" 
   ON storage.objects FOR SELECT
   USING (bucket_id = 'hero-images');
   
   -- Insert policy (for authenticated users)
   CREATE POLICY "Allow Upload" 
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'hero-images');
   ```

#### Error: "Gagal mendapatkan URL gambar"
**Solution:**
- Pastikan bucket adalah Public
- Cek apakah upload berhasil (lihat Network tab)
- Pastikan file path benar: `berita/berita_[timestamp]_[random].jpg`

#### Preview Tidak Muncul Setelah Upload
**Solution:**
1. Cek console log untuk error
2. Pastikan preview div ada di HTML
3. Cek apakah URL sudah tersimpan di hidden field
4. Manually test: `$("#beritaPreviewImg").src = "https://...";`

#### Gambar Tidak Muncul di Homepage
**Solution:**
1. Cek apakah berita sudah di-publish (`is_published = true`)
2. Cek di database apakah `image_url` sudah terisi
3. Test URL langsung di browser: paste URL dari database
4. Cek apakah URL valid (tidak 404)
5. Pastikan bucket `hero-images` adalah Public

### 📝 Manual Testing Steps

#### Test 1: Upload Image
```javascript
// Di browser console admin page:
const fileInput = document.getElementById("beritaImageFile");
const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
const dataTransfer = new DataTransfer();
dataTransfer.items.add(file);
fileInput.files = dataTransfer.files;
fileInput.dispatchEvent(new Event("change"));
```

#### Test 2: Check Supabase Client
```javascript
// Di browser console:
console.log(window.supabase);
console.log(window.supabase.storage);
```

#### Test 3: Test Upload Directly
```javascript
// Di browser console:
const file = document.getElementById("beritaImageFile").files[0];
if (file && window.supabase) {
  window.supabase.storage
    .from("hero-images")
    .upload(`berita/test_${Date.now()}.jpg`, file)
    .then(console.log)
    .catch(console.error);
}
```

#### Test 4: Check Database
```sql
-- Di Supabase SQL Editor:
SELECT id, title_id, image_url, is_published 
FROM berita 
ORDER BY created_at DESC 
LIMIT 5;

-- Cek apakah image_url terisi dan valid
```

### 🛠️ Quick Fixes

#### Fix 1: Re-initialize Supabase
Jika Supabase client hilang, tambahkan di console:
```javascript
import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
  .then(({ createClient }) => {
    window.supabase = createClient(
      'https://sxbvadzcwpaovkhghttv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    );
    console.log('Supabase re-initialized');
  });
```

#### Fix 2: Clear Preview & Retry
```javascript
// Di browser console:
clearBeritaImage();
// Lalu pilih file lagi
```

#### Fix 3: Check Image URL Manually
```javascript
// Di browser console:
const url = $("#beritaImageUrl").value;
console.log("Image URL:", url);
// Test di browser: window.open(url);
```

### 📞 Still Not Working?

1. **Check all console logs** - Copy semua log dengan prefix `[BERITA]`
2. **Check Network tab** - Screenshot semua request ke Supabase
3. **Check Supabase Dashboard**:
   - Storage → `hero-images` bucket exists?
   - Storage → Policies → RLS enabled?
   - Database → `berita` table → `image_url` column filled?
4. **Check browser compatibility**:
   - Chrome/Edge recommended
   - Firefox should work
   - Safari may have issues with FileReader

### ✅ Success Indicators

Gambar upload berhasil jika:
1. ✅ Preview muncul setelah pilih file
2. ✅ Console log: `[BERITA] ✅ Upload success!`
3. ✅ Preview update dengan URL Supabase setelah upload
4. ✅ Database `image_url` terisi dengan URL Supabase
5. ✅ Gambar muncul di homepage setelah publish

---

**Last Updated**: 2025-11-05

