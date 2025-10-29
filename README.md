# Sistem PPDSB Pondok Pesantren Al Ikhsan Beji

Web application untuk Penerimaan Peserta Didik dan Santri Baru (PPDSB) Pondok Pesantren Al Ikhsan Beji dengan sistem pembayaran online.

## 🚀 Fitur

- ✅ Pendaftaran Santri Online
- ✅ Upload Dokumen (Ijazah, Akta, Foto, BPJS)
- ✅ Cek Status Pendaftaran dengan NISN
- ✅ Sistem Pembayaran dengan Upload Bukti
- ✅ Dashboard Admin untuk Verifikasi
- ✅ **WhatsApp Auto Notification** saat verifikasi berkas 📱
- ✅ Kelola Gelombang Pendaftaran
- ✅ **Statistik Pendaftar** (Breakdown per Program & Jenjang)
- ✅ Export Data ke Excel (.xlsx)
- ✅ Download Semua Berkas (ZIP)
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Real-Time Sync Gelombang Aktif

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Bootstrap 5
- **Backend**: Python (Vercel Serverless)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## 📁 Struktur Folder

```
ppdb-smp-/
├── api/                          # API endpoints (Python)
│   └── index.py                  # Main API router
├── lib/                          # Backend handlers
│   ├── handlers/                 # API handlers
│   │   ├── pendaftar_list.py     # List pendaftar API
│   │   ├── pendaftar_create.py   # Create pendaftar API
│   │   ├── export_pendaftar_xlsx.py  # Excel export
│   │   └── ...                   # Other handlers
│   └── _supabase.py              # Supabase client
├── public/                       # Frontend files (HTML)
│   ├── admin.html                # Admin dashboard
│   ├── daftar.html               # Pendaftaran form
│   ├── index.html                # Homepage
│   └── assets/                   # CSS, JS, Images
│       └── js/
│           └── admin.js          # Admin panel logic
├── sql/                          # Database schema & migrations
│   ├── smp_sains_najah_full_schema.sql   # Full schema
│   ├── sample_data_statistik.sql         # Sample data for testing
│   └── grant_rpc_gelombang.sql           # RPC permissions
├── STATISTIK_PENDAFTAR_GUIDE.md  # 📊 Statistik Guide (NEW!)
└── README.md                     # This file
```

## 🔧 Setup Database & Storage

### 1. Schema Setup
Jalankan file SQL di folder `sql/` **SESUAI URUTAN**:

1. **`smp_sains_najah_full_schema.sql`** - Full schema (pendaftar, pembayaran)
2. **`create_table_gelombang.sql`** - ⚠️ Table gelombang (3 sample data)
3. **`create_rpc_set_gelombang_status.sql`** - ⚠️ **CRITICAL** RPC function untuk gelombang
4. **`grant_rpc_gelombang.sql`** - Grant permissions untuk RPC
5. **`sample_data_statistik.sql`** - (Optional) Sample data untuk testing statistik

**⚠️ PENTING**: File #2, #3, #4 wajib dijalankan untuk fix bug gelombang!  
Lihat panduan lengkap di: **[FIX_GELOMBANG_BUG.md](./FIX_GELOMBANG_BUG.md)**

### 2. Storage Bucket Setup ⚠️ **REQUIRED**
Aplikasi memerlukan 2 storage buckets di Supabase:

1. **`pendaftar-files`** - Untuk dokumen pendaftar (ijazah, akta, foto, BPJS)
2. **`temp-downloads`** - Untuk export ZIP (auto cleanup 24 jam)

**📖 Panduan Lengkap**: [SETUP_STORAGE.md](./SETUP_STORAGE.md)

**Quick Setup:**
- Buka Supabase Dashboard → Storage
- Create bucket `pendaftar-files` (Public)
- Create bucket `temp-downloads` (Public dengan signed URLs)
- Setup RLS policies (lihat SETUP_STORAGE.md)

### Testing Statistik Pendaftar
Untuk memverifikasi statistik berjalan dengan benar:

1. Insert sample data: `sql/sample_data_statistik.sql`
2. Buka Admin Panel → Tab **Statistik**
3. Periksa Browser Console (F12) untuk debug logs
4. Lihat dokumentasi lengkap di: **[STATISTIK_PENDAFTAR_GUIDE.md](./STATISTIK_PENDAFTAR_GUIDE.md)**

## 🌐 Deployment

Deploy otomatis via Vercel setiap push ke repository.

## 📝 Environment Variables

Perlu setup di Vercel:

**Database (Required):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**WhatsApp Notification (Optional):** 📱
- `WHATSAPP_API_TOKEN` - Token dari Fonnte/Wablas/Woowa
- `WHATSAPP_API_PROVIDER` - `fonnte` / `wablas` / `woowa`
- `WABLAS_DOMAIN` - (Hanya untuk Wablas, contoh: `solo.wablas.com`)

**📖 Panduan Setup WhatsApp**: [SETUP_WHATSAPP.md](./SETUP_WHATSAPP.md)

---

**Developed with ❤️ for Pondok Pesantren Al Ikhsan Beji**

## 📊 Statistik Pendaftar

Sistem statistik menampilkan breakdown pendaftar berdasarkan:

1. **Pondok Putra Induk** (MTs, MA, Kuliah)
2. **Pondok Putra Tahfidz** (MTs, MA, Kuliah)
3. **Pondok Putri** (MTs, MA, Kuliah)
4. **Hanya Sekolah** (MTs L/P, MA L/P)

**Dokumentasi Lengkap**: [STATISTIK_PENDAFTAR_GUIDE.md](./STATISTIK_PENDAFTAR_GUIDE.md)

## 📌 Update Log

### 2025-10-29 - Performance & Architecture

#### ⚡ **ZIP Download Optimization**
**Problem**: Large ZIP files sent directly from Vercel Function causing memory limits & timeouts  
**Solution**: 
- ✅ **NEW**: Upload ZIP to Supabase Storage bucket `temp-downloads`
- ✅ **NEW**: Return signed download URL (expires 1 hour) instead of file buffer
- ✅ **NEW**: Auto cleanup files older than 24 hours
- ✅ **BENEFIT**: No memory limits, faster downloads via CDN, more scalable
- 📖 **Guide**: [SETUP_STORAGE.md](./SETUP_STORAGE.md)

**Changes:**
- 📝 Modified: `lib/handlers/pendaftar_download_zip.py` - Upload to storage instead of direct send
- 📝 Modified: `public/assets/js/admin.js` - Handle JSON response with download URL
- 📝 Added: `SETUP_STORAGE.md` - Complete storage bucket setup guide

#### 📱 **WhatsApp Auto Notification**
**Feature**: Automatic WhatsApp notification when admin verifies applicant (status = DITERIMA)  
**Benefits**:
- ✅ **AUTO**: No manual copy-paste nomor HP & pesan
- ✅ **INSTANT**: Pendaftar langsung tahu berkas diverifikasi
- ✅ **PERSONALIZED**: Pesan include nama, NISN, link cek status
- ✅ **FLEXIBLE**: Support Fonnte, Wablas, Woowa provider
- 📖 **Guide**: [SETUP_WHATSAPP.md](./SETUP_WHATSAPP.md)

**Message Flow:**
```
Admin klik "Diterima" 
  → Status berkas = DITERIMA ✅
  → Auto kirim WhatsApp ke pendaftar 📱
  → Pesan berisi: "Berkas terverifikasi, silakan bayar"
  → Link ke halaman cek status
```

**Changes:**
- 📝 Added: `lib/whatsapp_notifier.py` - WhatsApp API helper (Fonnte/Wablas/Woowa)
- 📝 Modified: `lib/handlers/pendaftar_status.py` - Send WA after status update
- 📝 Modified: `public/assets/js/admin.js` - Show WA notification status in alert
- 📝 Added: `SETUP_WHATSAPP.md` - Complete WhatsApp API setup guide

### 2025-10-24 - Bug Fixes

#### 🐛 **CRITICAL FIX: Gelombang Always Active Bug**
**Problem**: Gelombang 1 selalu aktif meskipun admin pilih gelombang lain  
**Solution**: 
- ✅ **ADDED**: RPC function `set_gelombang_status` di database (`sql/create_rpc_set_gelombang_status.sql`)
- ✅ **ADDED**: Table `gelombang` creation script (`sql/create_table_gelombang.sql`)
- ✅ **ADDED**: Comprehensive fix guide (`FIX_GELOMBANG_BUG.md`)
- ✅ **FIXED**: Atomic transaction untuk ensure hanya 1 gelombang aktif
- 📖 **Guide**: [FIX_GELOMBANG_BUG.md](./FIX_GELOMBANG_BUG.md)

#### 📊 **Statistik Pendaftar Fix**
- ✅ **FIXED**: API `pendaftar_list` mengembalikan field names konsisten (`rencana_program`, `rencanatingkat`, `jeniskelamin`)
- ✅ **ADDED**: Debug logging di JavaScript untuk troubleshooting statistik
- ✅ **ADDED**: Dokumentasi lengkap statistik (`STATISTIK_PENDAFTAR_GUIDE.md`)
- ✅ **ADDED**: Sample data SQL untuk testing (`sql/sample_data_statistik.sql`)
- 📖 **Guide**: [STATISTIK_PENDAFTAR_GUIDE.md](./STATISTIK_PENDAFTAR_GUIDE.md)

### Latest Update - PPDSB Al Ikhsan Beji
- ✅ Sistem pendaftaran santri baru
- ✅ Real-time sync gelombang pendaftaran
- ✅ Responsive untuk semua device
- ✅ Statistik pendaftar per program & jenjang
