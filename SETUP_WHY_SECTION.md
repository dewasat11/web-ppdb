# Setup Why Section Table

## ⚠️ Error: Table 'why_section' Not Found

Jika Anda mendapatkan error:
```
Could not find the table 'public.why_section' in the schema cache
```

Ini berarti tabel `why_section` belum dibuat di database Supabase Anda.

## 📋 Cara Setup

### 1. Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri

### 2. Jalankan SQL Script
1. Klik tombol **New Query**
2. Copy-paste isi file `sql/create_table_why_section.sql`
3. Klik **Run** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)

### 3. Verifikasi
Setelah script berhasil dijalankan, verifikasi tabel sudah dibuat:
- Klik menu **Table Editor** di sidebar
- Cari tabel `why_section`
- Pastikan ada 1 row dengan data default

## ✅ SQL Script yang Perlu Dijalankan

File: `sql/create_table_why_section.sql`

Script ini akan:
- ✅ Membuat tabel `why_section` dengan kolom: id, title, subtitle, content, created_at, updated_at
- ✅ Insert data default (jika belum ada)
- ✅ Setup Row Level Security (RLS) policies
- ✅ Grant permissions untuk public read access

## 🔍 Troubleshooting

### Error: "relation already exists"
- **Solusi**: Hapus tabel lama terlebih dahulu, atau skip bagian CREATE TABLE

### Error: "permission denied"
- **Solusi**: Pastikan Anda login sebagai service role atau memiliki hak admin

### Tabel dibuat tapi masih error
- **Solusi**: 
  1. Refresh schema cache di Supabase Dashboard
  2. Atau tunggu beberapa detik untuk schema cache update
  3. Coba reload halaman admin

## 📝 Catatan

- Tabel `why_section` hanya menyimpan **1 record** (bukan multiple records)
- API akan selalu mengambil record pertama (LIMIT 1)
- Update akan menggunakan INSERT ... ON CONFLICT atau UPDATE berdasarkan ID

