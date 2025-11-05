# 📦 Setup Supabase Storage untuk Berita Images

## ⚠️ Penting: Storage Bucket Tidak Dibuat via SQL

Supabase Storage bucket **TIDAK BISA** dibuat dengan SQL seperti tabel database. Bucket harus dibuat **manual via Dashboard** atau **API**.

## 🚀 Quick Setup (5 Menit)

### Step 1: Buat Bucket via Dashboard

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com/dashboard
   - Pilih project Anda

2. **Go to Storage**
   - Klik menu "Storage" di sidebar kiri

3. **Create New Bucket**
   - Klik tombol **"New bucket"** atau **"Create bucket"**
   - Atau gunakan bucket `hero-images` yang sudah ada (jika sudah ada)

4. **Bucket Configuration:**
   ```
   Name: hero-images
   Public bucket: ✅ ENABLE (WAJIB!)
   File size limit: 2 MB (atau sesuai kebutuhan)
   Allowed MIME types: 
     - image/jpeg
     - image/png
     - image/webp
   ```

5. **Click "Create bucket"**

### Step 2: Jalankan SQL untuk RLS Policies

Setelah bucket dibuat, jalankan SQL untuk set permissions:

1. **Buka SQL Editor**
   - Di Supabase Dashboard → SQL Editor

2. **Copy & Paste SQL**
   - Buka file: `sql/setup_storage_berita.sql`
   - Copy semua isinya
   - Paste ke SQL Editor

3. **Run Query**
   - Klik "Run" atau tekan `Ctrl+Enter`

4. **Verify**
   - Scroll ke bagian "VERIFY SETUP" di SQL file
   - Run query verify untuk pastikan bucket dan policies sudah benar

## 📋 Checklist Setup

- [ ] Bucket `hero-images` sudah dibuat
- [ ] Bucket setting: **Public = TRUE** ✅
- [ ] RLS Policies sudah dibuat (4 policies)
- [ ] Test upload via admin panel
- [ ] Gambar muncul di homepage

## 🔍 Verify Setup

### Via Dashboard:
1. Storage → Buckets → `hero-images`
2. Cek: Public bucket = ✅ Enabled
3. Cek: File size limit = 2 MB
4. Cek: Policies ada di tab "Policies"

### Via SQL:
```sql
-- Cek bucket
SELECT name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'hero-images';

-- Cek policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%images%';
```

## 🎯 Alternative: Gunakan Bucket yang Sudah Ada

Jika Anda sudah punya bucket `hero-images` untuk hero slider:
- ✅ **TIDAK PERLU** buat bucket baru
- ✅ Gunakan bucket yang sama
- ✅ Folder berbeda: `berita/` vs `hero/`
- ✅ Jalankan SQL policies saja

**File Structure:**
```
hero-images/
  ├── hero/          (untuk hero slider)
  └── berita/        (untuk berita images) ← NEW!
```

## 🔧 Troubleshooting

### Error: "Bucket not found"
**Solution:**
- Pastikan bucket `hero-images` sudah dibuat
- Cek nama bucket (case-sensitive)
- Jika bucket tidak ada, buat via Dashboard

### Error: "new row violates row-level security"
**Solution:**
1. Jalankan SQL policies dari `setup_storage_berita.sql`
2. Pastikan bucket adalah **Public**
3. Cek policies sudah dibuat:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE schemaname = 'storage' 
     AND tablename = 'objects';
   ```

### Error: "Access denied" atau 403
**Solution:**
1. Pastikan bucket **Public = TRUE**
2. Update bucket jika belum public:
   ```sql
   UPDATE storage.buckets 
   SET public = true 
   WHERE name = 'hero-images';
   ```

### Error: "File too large"
**Solution:**
- File size limit default Supabase adalah 50 MB
- Jika perlu ubah limit, edit di Dashboard:
  - Storage → Buckets → `hero-images` → Settings
  - Update "File size limit"

### Gambar tidak muncul setelah upload
**Solution:**
1. Cek apakah upload berhasil:
   - Storage → `hero-images` → `berita/` folder
   - Harus ada file baru
2. Cek URL di database:
   ```sql
   SELECT id, title_id, image_url 
   FROM berita 
   WHERE image_url IS NOT NULL 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. Test URL langsung di browser
4. Pastikan bucket Public = TRUE

## 📝 RLS Policies Explained

### Policy 1: Public Read
```sql
"Public can view images" FOR SELECT
```
- **Siapa**: Semua orang (anon + authenticated)
- **Apa**: Bisa lihat/download gambar
- **Kenapa**: Supaya gambar muncul di homepage

### Policy 2: Authenticated Upload
```sql
"Authenticated can upload images" FOR INSERT
```
- **Siapa**: User yang authenticated (admin)
- **Apa**: Bisa upload gambar baru
- **Kenapa**: Admin butuh upload gambar berita

### Policy 3 & 4: Update & Delete
- Untuk update dan delete gambar yang sudah di-upload
- Optional, bisa dihapus jika tidak diperlukan

## 🔐 Security Notes

⚠️ **WARNING**: 
- Bucket `hero-images` adalah **PUBLIC**
- Semua orang bisa lihat/download gambar
- Jangan simpan file sensitif di bucket ini
- Hanya untuk gambar public (hero slider, berita)

✅ **Best Practice**:
- Gunakan folder structure: `berita/`, `hero/`
- Validate file size & type di frontend
- Set file size limit di bucket settings
- Monitor storage usage

## 🚀 Next Steps

Setelah setup selesai:

1. **Test Upload**:
   - Buka `/admin.html` → Tab "Berita"
   - Upload gambar
   - Cek console log untuk error

2. **Verify Homepage**:
   - Buka `/index.html`
   - Scroll ke section "Berita & Artikel"
   - Gambar harus muncul

3. **Check Storage**:
   - Supabase Dashboard → Storage
   - Folder `berita/` harus ada file baru

## 📞 Need Help?

Jika masih ada masalah:
1. Cek file: `BERITA_IMAGE_UPLOAD_TROUBLESHOOTING.md`
2. Cek browser console untuk error
3. Cek Supabase Dashboard → Storage → Logs
4. Verify semua checklist di atas

---

**Files:**
- `sql/setup_storage_berita.sql` - SQL untuk RLS policies
- `SETUP_STORAGE_BERITA.md` - Dokumentasi ini
- `BERITA_IMAGE_UPLOAD_TROUBLESHOOTING.md` - Troubleshooting guide

