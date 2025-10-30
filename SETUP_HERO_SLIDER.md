# 🎨 Hero Slider Setup Guide

## Fitur Hero Slider
✅ Auto-slide setiap **4 detik**  
✅ Transparansi hijau **65%** untuk readability teks  
✅ Maksimal **5 gambar** hero  
✅ CRUD management di admin panel  
✅ Real-time sync (perubahan langsung terlihat di website)  
✅ Responsive & mobile-friendly  

---

## 📊 Database Setup (Supabase)

### 1. Buat Tabel `hero_images`

Jalankan SQL query berikut di **Supabase SQL Editor**:

```sql
-- Create hero_images table
CREATE TABLE hero_images (
  id BIGSERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for sorting
CREATE INDEX idx_hero_images_order ON hero_images(display_order ASC);

-- Add index for active images
CREATE INDEX idx_hero_images_active ON hero_images(is_active) WHERE is_active = true;

-- Enable RLS (Row Level Security)
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to active hero images"
ON hero_images FOR SELECT
USING (is_active = true);

-- Create policy to allow authenticated users full access (for admin)
CREATE POLICY "Allow authenticated users full access"
ON hero_images FOR ALL
USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE hero_images IS 'Stores hero slider images for homepage';
```

---

## 🗄️ Storage Setup (Supabase)

### 2. Buat Storage Bucket `hero-images`

1. **Buka Supabase Dashboard** → **Storage**
2. **Klik "New bucket"**
3. **Isi data bucket:**
   - **Name:** `hero-images`
   - **Public bucket:** ✅ **Centang** (public read access)
   - **File size limit:** `5 MB`
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`
4. **Klik "Create bucket"**

### 3. Setup Storage Policies

Jalankan SQL query berikut untuk mengatur storage policies:

```sql
-- Allow public read access to hero-images bucket
CREATE POLICY "Allow public read access to hero images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

-- Allow authenticated users to upload to hero-images bucket
CREATE POLICY "Allow authenticated users to upload hero images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete from hero-images bucket
CREATE POLICY "Allow authenticated users to delete hero images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-images' AND
  auth.role() = 'authenticated'
);
```

---

## 🚀 Cara Menggunakan

### Upload Hero Image (Admin)

1. **Login ke Admin Panel:** `/admin.html`
2. **Klik tab "Hero Slider"** di sidebar
3. **Pilih gambar** (max 5 MB, landscape recommended)
4. **Preview otomatis** muncul dengan green overlay 65%
5. **Klik "Upload Gambar"**
6. ✅ **Gambar langsung muncul** di slider homepage

### Delete Hero Image

1. **Buka tab "Hero Slider"** di admin panel
2. **Klik tombol "Delete"** di card gambar
3. **Konfirmasi delete**
4. ✅ **Gambar langsung hilang** dari slider

### Urutan Slide

- Gambar akan slide berdasarkan **`display_order`** (ascending)
- Upload pertama = `display_order: 1`
- Upload kedua = `display_order: 2`
- Dan seterusnya...

---

## 🎬 Cara Kerja Auto-Slide

1. **Interval:** 4 detik per slide
2. **Transition:** Fade in/out (1.5 detik)
3. **Loop:** Slide terakhir → kembali ke slide pertama
4. **Pause on Hidden:** Slider otomatis pause saat tab browser tidak aktif (performance optimization)

---

## 🎨 Green Overlay (65% Opacity)

**Tujuan:** Agar teks konten (putih) tetap terbaca di atas gambar hero

**CSS:**
```css
background: linear-gradient(135deg, 
  rgba(4, 120, 87, 0.65),    /* brand-800 with 65% opacity */
  rgba(6, 78, 59, 0.65)      /* brand-900 with 65% opacity */
);
```

**Preview:** Admin panel menampilkan preview dengan overlay yang sama seperti di website

---

## 📁 File Structure

```
📦 pendaftaran-web
├── 📂 lib/handlers/
│   ├── hero_images_list.py          # GET /api/hero_images_list
│   ├── hero_images_upload.py        # POST /api/hero_images_upload
│   ├── hero_images_delete.py        # DELETE /api/hero_images_delete
│   └── hero_images_update_order.py  # PUT /api/hero_images_update_order
├── 📂 public/
│   ├── index.html                   # Hero slider frontend
│   ├── admin.html                   # Hero management tab
│   └── 📂 assets/js/
│       └── admin.js                 # Hero CRUD functions
├── 📂 api/
│   └── index.py                     # Router (hero handlers registered)
└── vercel.json                      # API routes configured
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hero_images_list` | Fetch all active hero images (ordered by `display_order`) |
| `POST` | `/api/hero_images_upload` | Upload new hero image (base64) |
| `DELETE` | `/api/hero_images_delete?id={id}` | Delete hero image by ID |
| `PUT` | `/api/hero_images_update_order` | Update display order (future feature) |

---

## 🎯 Rekomendasi Gambar

- **Dimensi:** 1920x1080px (Full HD) atau 2560x1440px (2K)
- **Aspect Ratio:** 16:9 atau 21:9 (landscape)
- **Format:** JPG, PNG, atau WEBP
- **Ukuran File:** < 2 MB (optimal for loading speed)
- **Subject:** Gambar pesantren, santri belajar, masjid, dll
- **Brightness:** Pilih gambar yang tidak terlalu gelap (agar overlay tetap terbaca)

---

## 🔄 Real-Time Sync

**Supabase Real-Time** digunakan untuk sinkronisasi perubahan:

- Admin upload gambar → **Slider di homepage otomatis reload**
- Admin delete gambar → **Slider di homepage otomatis update**
- Multi-admin support (perubahan dari admin A langsung terlihat di admin B)

**Channel:** `hero-images-public`  
**Table:** `hero_images`  
**Events:** `INSERT`, `UPDATE`, `DELETE`

---

## 🐛 Troubleshooting

### Gambar tidak muncul di slider

✅ **Cek:**
1. Apakah bucket `hero-images` sudah dibuat?
2. Apakah bucket set sebagai **public**?
3. Apakah storage policies sudah dijalankan?
4. Buka Console (F12) → cari error `[HERO]`

### Upload gagal

✅ **Cek:**
1. Apakah ukuran file < 5 MB?
2. Apakah format image valid (jpg, png, webp)?
3. Apakah sudah ada 5 gambar? (max limit)

### Slider tidak auto-slide

✅ **Cek:**
1. Apakah ada minimal 2 gambar?
2. Buka Console (F12) → cari log `[HERO] Slider started`
3. Refresh halaman

---

## ✨ Tips & Best Practices

1. **3 Gambar Ideal:** Upload 3 gambar hero untuk pengalaman terbaik
2. **Konsisten:** Gunakan gambar dengan tone warna yang konsisten
3. **Compress:** Compress gambar sebelum upload untuk loading speed
4. **Test:** Selalu test di mobile dan desktop
5. **Backup:** Simpan gambar original di luar system sebagai backup

---

## 📞 Support

Jika ada kendala, check console logs:
- **Frontend:** `[HERO]` logs di browser console
- **Backend:** Check Vercel logs untuk API errors

**Database:** Supabase Dashboard → Table Editor → `hero_images`  
**Storage:** Supabase Dashboard → Storage → `hero-images`

---

**✅ Setup Complete!** Hero Slider siap digunakan! 🎉

