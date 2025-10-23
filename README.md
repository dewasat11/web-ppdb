# Sistem Pendaftaran SMP SAINS AN NAJAH PURWOKERTO

Web application untuk pendaftaran siswa baru SMP dengan sistem pembayaran online.

## 🚀 Fitur

- ✅ Pendaftaran Siswa Online
- ✅ Upload Dokumen (Ijazah, Akta, Foto, BPJS)
- ✅ Cek Status Pendaftaran dengan NISN
- ✅ Sistem Pembayaran dengan Upload Bukti
- ✅ Dashboard Admin untuk Verifikasi
- ✅ Kelola Gelombang Pendaftaran
- ✅ Export Data ke Excel (.xlsx)
- ✅ Download Semua Berkas (ZIP)
- ✅ Responsive Design (Mobile, Tablet, Desktop)

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Bootstrap 5
- **Backend**: Python (Vercel Serverless)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## 📁 Struktur Folder

```
project python/
├── api/              # API endpoints (Python)
├── public/           # Frontend files (HTML)
├── sql/              # Database schema & migrations
└── assets/           # Static assets (CSS, images)
```

## 🔧 Setup Database

Jalankan file SQL di folder `sql/` sesuai urutan:

1. `supabase-schema.sql` - Schema awal
2. `sql_alter_pendaftar.sql` - Alter table pendaftar
3. `sql_pembayaran_simple.sql` - Tabel pembayaran
4. `supabase_storage_setup.sql` - Setup storage

## 🌐 Deployment

Deploy otomatis via Vercel setiap push ke repository.

## 📝 Environment Variables

Perlu setup di Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

**Developed with ❤️ for SMP SAINS AN NAJAH PURWOKERTO**

# ppdsb-pondok

# ppdsb-pondok

# updated last
# smp-sains
# smp-sains
