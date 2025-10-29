# Setup Supabase Storage untuk ZIP Download

## 📦 Bucket yang Diperlukan

Aplikasi ini membutuhkan bucket Supabase Storage berikut:

### 1. `temp-downloads` (Baru)
Bucket untuk menyimpan file ZIP export yang dibuat saat admin download semua berkas pendaftar.

**Konfigurasi:**
- **Name:** `temp-downloads`
- **Public:** ✅ Yes (atau enable signed URLs)
- **File size limit:** 500 MB (sesuaikan dengan kebutuhan)
- **Allowed MIME types:** `application/zip`

**Folder Structure:**
```
temp-downloads/
└── exports/
    ├── semua-berkas_20250129_143022.zip
    ├── semua-berkas_20250129_151530.zip
    └── ... (auto cleanup setelah 24 jam)
```

### 2. `pendaftar-files` (Existing)
Bucket untuk menyimpan dokumen pendaftar (ijazah, akta, foto, BPJS).

**Folder Structure:**
```
pendaftar-files/
├── {NISN}/
│   ├── ijazah.pdf
│   ├── akta.jpg
│   ├── pas-foto.jpg
│   └── bpjs.pdf
└── ...
```

---

## 🔧 Cara Setup Bucket `temp-downloads`

### Langkah 1: Login ke Supabase Dashboard
1. Buka https://app.supabase.com
2. Pilih project Anda

### Langkah 2: Buat Bucket Baru
1. Pergi ke **Storage** di sidebar kiri
2. Klik **New bucket**
3. Isi form:
   - **Name:** `temp-downloads`
   - **Public bucket:** ✅ Centang (atau setup signed URLs)
   - **File size limit:** `500 MB`
4. Klik **Create bucket**

### Langkah 3: Setup RLS Policies (Opsional, Recommended)

Untuk keamanan, buat RLS policy yang hanya allow admin upload:

```sql
-- Allow authenticated admin users to upload
CREATE POLICY "Admin can upload to temp-downloads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'temp-downloads' AND
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow public to download (or use signed URLs)
CREATE POLICY "Public can download from temp-downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-downloads');

-- Allow system to delete old files
CREATE POLICY "System can delete old exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-downloads' AND
  (storage.foldername(name))[1] = 'exports'
);
```

### Langkah 4: Test
1. Login sebagai admin di aplikasi
2. Buka halaman **Data Pendaftar**
3. Klik **Download Semua ZIP**
4. Tunggu proses (akan muncul alert dengan info file)
5. Download otomatis dimulai
6. Cek bucket `temp-downloads/exports/` di Supabase Dashboard

---

## ✨ Keuntungan Arsitektur Baru

### Sebelumnya (❌ Masalah):
```
[Vercel Function] 
  → Generate ZIP di memory
  → Send buffer besar via HTTP response
  → ❌ Memory limit exceeded (max 3GB)
  → ❌ Timeout (max 60s)
  → ❌ Slow untuk file besar
```

### Sekarang (✅ Solusi):
```
[Vercel Function]
  → Generate ZIP di memory
  → Upload ke Supabase Storage
  → Return signed URL (expires 1 jam)
  
[User Browser]
  → Terima JSON response dengan download_url
  → Redirect ke signed URL
  → Download langsung dari Supabase CDN
  
[Auto Cleanup]
  → Hapus file >24 jam otomatis
```

### Benefits:
- ✅ **No memory limits** - file disimpan di storage, bukan di function memory
- ✅ **No timeouts** - download via CDN, bukan via function
- ✅ **Faster** - Supabase CDN lebih cepat untuk file besar
- ✅ **Secure** - signed URLs dengan expiration
- ✅ **Auto cleanup** - file lama dihapus otomatis
- ✅ **Scalable** - support file size berapapun

---

## 🔍 Monitoring & Troubleshooting

### Check Bucket Contents
```sql
-- List all files in temp-downloads
SELECT * FROM storage.objects 
WHERE bucket_id = 'temp-downloads'
ORDER BY created_at DESC;

-- Check file sizes
SELECT 
  name,
  metadata->>'size' as size_bytes,
  (metadata->>'size')::bigint / 1024 / 1024 as size_mb,
  created_at
FROM storage.objects 
WHERE bucket_id = 'temp-downloads'
ORDER BY created_at DESC;

-- Delete old files manually (if cleanup fails)
DELETE FROM storage.objects
WHERE bucket_id = 'temp-downloads'
  AND created_at < NOW() - INTERVAL '24 hours';
```

### Check Function Logs
Vercel logs akan menampilkan:
```
[ZIP_DOWNLOAD] Starting ZIP download request
[ZIP_DOWNLOAD] ✓ Query successful, found 50 pendaftar
[ZIP_DOWNLOAD] Creating ZIP file...
[ZIP_DOWNLOAD] ZIP size: 15.32 MB
[ZIP_DOWNLOAD] Uploading ZIP to storage: exports/semua-berkas_20250129_143022.zip
[ZIP_DOWNLOAD] ✓ Upload successful
[ZIP_DOWNLOAD] ✓ Signed URL generated
[ZIP_DOWNLOAD] Cleaning up old export files...
[ZIP_DOWNLOAD] Deleting 3 old files...
[ZIP_DOWNLOAD] ✓✓✓ SUCCESS - ZIP uploaded to storage!
```

### Troubleshooting

**Error: "Failed to upload ZIP to storage"**
- ✅ Check bucket `temp-downloads` exists
- ✅ Check service role key has storage permissions
- ✅ Check bucket RLS policies allow authenticated upload

**Error: "Failed to generate download URL"**
- ✅ Check bucket is PUBLIC or has signed URLs enabled
- ✅ Check storage API settings

**ZIP download tidak dimulai**
- ✅ Check browser console for errors
- ✅ Check signed URL is valid (not expired)
- ✅ Try direct URL in browser

---

## 📝 Related Files

- **Backend:** `lib/handlers/pendaftar_download_zip.py`
- **Frontend:** `public/assets/js/admin.js` (function `downloadAllZip`)
- **Config:** `vercel.json` (function memory & timeout settings)

---

**Last Updated:** 2025-01-29

