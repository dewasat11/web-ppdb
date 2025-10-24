# Sistem PPDSB Pondok Pesantren Al Ikhsan Beji

Web application untuk Penerimaan Peserta Didik dan Santri Baru (PPDSB) Pondok Pesantren Al Ikhsan Beji dengan sistem pembayaran online.

## 🚀 Fitur

- ✅ Pendaftaran Santri Online
- ✅ Upload Dokumen (Ijazah, Akta, Foto, BPJS)
- ✅ Cek Status Pendaftaran dengan NISN
- ✅ Sistem Pembayaran dengan Upload Bukti
- ✅ Dashboard Admin untuk Verifikasi
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

## 🔧 Setup Database

### Schema Setup
Jalankan file SQL di folder `sql/` **SESUAI URUTAN**:

1. **`smp_sains_najah_full_schema.sql`** - Full schema (pendaftar, pembayaran)
2. **`create_table_gelombang.sql`** - ⚠️ Table gelombang (3 sample data)
3. **`create_rpc_set_gelombang_status.sql`** - ⚠️ **CRITICAL** RPC function untuk gelombang
4. **`grant_rpc_gelombang.sql`** - Grant permissions untuk RPC
5. **`sample_data_statistik.sql`** - (Optional) Sample data untuk testing statistik

**⚠️ PENTING**: File #2, #3, #4 wajib dijalankan untuk fix bug gelombang!  
Lihat panduan lengkap di: **[FIX_GELOMBANG_BUG.md](./FIX_GELOMBANG_BUG.md)**

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

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

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
