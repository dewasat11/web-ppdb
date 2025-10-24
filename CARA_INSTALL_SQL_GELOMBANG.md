# 🚀 CARA INSTALL SQL GELOMBANG - STEP BY STEP

## 📋 Deskripsi
Panduan lengkap untuk menginstall dan mengkonfigurasi database `gelombang` di Supabase agar sistem gelombang berjalan sempurna antara `admin.html` dan `index.html`.

---

## ⚠️ PENTING - BACA SEBELUM MULAI

**PERINGATAN:** Script SQL ini akan:
- Menghapus trigger dan index lama (untuk membersihkan duplikasi)
- TIDAK menghapus data gelombang yang sudah ada (tabel tetap aman)
- Menambahkan data default HANYA jika tabel kosong
- Memperbaiki constraint dan permission

**BACKUP DATA:** Jika Anda sudah memiliki data penting, export data terlebih dahulu dari Supabase Dashboard.

---

## 📝 LANGKAH-LANGKAH INSTALASI

### **STEP 1: Buka Supabase SQL Editor**

1. Login ke [Supabase Dashboard](https://app.supabase.com/)
2. Pilih project Anda: `sxbvadzcwpaovkhghttv`
3. Di sidebar kiri, klik **"SQL Editor"**
4. Klik tombol **"+ New query"** untuk membuat query baru

---

### **STEP 2: Copy Full SQL Script**

1. Buka file: `sql/GELOMBANG_SCHEMA_COMPLETE.sql`
2. Copy **SELURUH ISI FILE** (Ctrl+A → Ctrl+C)

---

### **STEP 3: Paste & Run SQL Script**

1. Paste script ke SQL Editor (Ctrl+V)
2. **PENTING:** Scroll ke bawah dan baca komentar di script
3. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
4. Tunggu hingga eksekusi selesai (biasanya 3-5 detik)

---

### **STEP 4: Verifikasi Hasil**

Setelah script selesai dijalankan, Anda akan melihat beberapa output:

#### ✅ **Output 1: Table Structure**
```
column_name     | data_type                  | is_nullable | column_default
----------------|----------------------------|-------------|------------------
id              | smallint                   | NO          | generated always
nama            | text                       | NO          | 
start_date      | date                       | NO          | 
end_date        | date                       | NO          | 
tahun_ajaran    | text                       | NO          | 
is_active       | boolean                    | NO          | false
urutan          | smallint                   | NO          | 1
status          | text                       | NO          | 'ditutup'
created_at      | timestamp with time zone   | NO          | now()
updated_at      | timestamp with time zone   | NO          | now()
```

#### ✅ **Output 2: Current Gelombang Data**
```
id | nama        | start_date | end_date   | is_active | status  | urutan
---|-------------|------------|------------|-----------|---------|--------
1  | Gelombang 1 | 2025-10-24 | 2025-11-30 | true      | aktif   | 1
2  | Gelombang 2 | 2025-12-01 | 2026-01-31 | false     | segera  | 2
3  | Gelombang 3 | 2026-02-01 | 2026-03-31 | false     | ditutup | 3
```

#### ✅ **Output 3: Active Gelombang**
```
id | nama        | is_active | status
---|-------------|-----------|--------
1  | Gelombang 1 | true      | aktif
```

**EXPECTED:** Hanya **1 row** yang harus muncul (hanya 1 gelombang aktif).

#### ✅ **Output 4: Indexes**
```
indexname                    | indexdef
-----------------------------|--------------------------------------------------
gelombang_pkey               | CREATE UNIQUE INDEX ... ON gelombang (id)
uniq_gelombang_active_true   | CREATE UNIQUE INDEX ... WHERE (is_active = true)
idx_gelombang_is_active      | CREATE INDEX ... ON gelombang (is_active)
idx_gelombang_urutan         | CREATE INDEX ... ON gelombang (urutan)
```

#### ✅ **Output 5: Triggers**
```
trigger_name              | event_manipulation | action_timing | action_statement
--------------------------|-------------------|---------------|----------------------------------
trg_gelombang_updated_at  | UPDATE            | BEFORE        | update_updated_at_column()
```

#### ✅ **Output 6: RPC Function Test**
```
set_gelombang_status
---------------------------------------
{"ok": true, "message": "Gelombang 2 berhasil diaktifkan", "active_id": 2}
```

---

### **STEP 5: Test Manual (Opsional)**

Jika ingin test manual, jalankan query berikut di SQL Editor:

#### **Test 1: Cek Gelombang Aktif**
```sql
SELECT id, nama, is_active, status 
FROM public.gelombang 
WHERE is_active = true;
```

**Expected:** Hanya 1 row (gelombang yang aktif).

---

#### **Test 2: Aktifkan Gelombang 2**
```sql
SELECT public.set_gelombang_status(2);
```

**Expected:** 
```json
{"ok": true, "message": "Gelombang 2 berhasil diaktifkan", "active_id": 2}
```

---

#### **Test 3: Verifikasi Gelombang 2 Aktif**
```sql
SELECT id, nama, is_active, status 
FROM public.gelombang 
ORDER BY urutan;
```

**Expected:**
```
id | nama        | is_active | status
---|-------------|-----------|--------
1  | Gelombang 1 | false     | ditutup
2  | Gelombang 2 | true      | aktif    ← HANYA INI YANG TRUE
3  | Gelombang 3 | false     | ditutup
```

---

#### **Test 4: Aktifkan Gelombang 3**
```sql
SELECT public.set_gelombang_status(3);
```

**Expected:** 
```json
{"ok": true, "message": "Gelombang 3 berhasil diaktifkan", "active_id": 3}
```

---

#### **Test 5: Verifikasi Gelombang 3 Aktif**
```sql
SELECT id, nama, is_active, status 
FROM public.gelombang 
ORDER BY urutan;
```

**Expected:**
```
id | nama        | is_active | status
---|-------------|-----------|--------
1  | Gelombang 1 | false     | ditutup
2  | Gelombang 2 | false     | ditutup
3  | Gelombang 3 | true      | aktif    ← HANYA INI YANG TRUE
```

---

## 🎯 TEST DI FRONTEND

Setelah SQL berhasil dijalankan, test di browser:

### **1. Test di Admin Panel**
1. Buka: `https://your-domain.vercel.app/admin.html`
2. Login sebagai admin
3. Klik tab **"Kelola Gelombang"**
4. Klik tombol **"Aktifkan"** pada Gelombang 2
5. **Expected:** 
   - Gelombang 2 card berubah warna hijau
   - Badge berubah menjadi "Aktif"
   - Gelombang 1 & 3 berubah menjadi "Ditutup" (abu-abu)
   - Muncul toast notification: ✅ "Gelombang berhasil diaktifkan!"

---

### **2. Test Sync di Index.html**
1. **BUKA TAB BARU** di browser yang sama
2. Buka: `https://your-domain.vercel.app/`
3. Scroll ke bagian **"Gelombang Pendaftaran"**
4. **Expected:**
   - Gelombang 2 tampil dengan badge **"Pendaftaran Dibuka"** (hijau)
   - Tombol **"Daftar Sekarang"** tersedia
   - Gelombang 1 & 3 tampil dengan badge **"Ditutup"** (abu-abu)

---

### **3. Test Real-Time Sync**
1. **TANPA menutup tab index.html**, kembali ke tab admin.html
2. Klik tombol **"Aktifkan"** pada Gelombang 3
3. **LANGSUNG** switch ke tab index.html (jangan refresh!)
4. **Expected dalam 1-2 detik:**
   - Muncul toast: 📊 "Data gelombang diperbarui dari server"
   - Gelombang 3 berubah menjadi **"Pendaftaran Dibuka"** (hijau)
   - Gelombang 2 berubah menjadi **"Ditutup"** (abu-abu)
   - **TANPA PERLU REFRESH PAGE!**

---

## ✅ CHECKLIST KEBERHASILAN

Centang semua item di bawah untuk memastikan sistem berjalan sempurna:

- [ ] SQL script berhasil dijalankan tanpa error
- [ ] Hanya 1 gelombang yang `is_active = true` di database
- [ ] Function `set_gelombang_status()` dapat dipanggil tanpa error
- [ ] Admin panel dapat switch gelombang 1/2/3 dengan lancar
- [ ] Index.html menampilkan gelombang yang benar
- [ ] Real-time sync bekerja (perubahan di admin langsung muncul di index)
- [ ] Toast notification muncul saat gelombang diubah
- [ ] Tidak ada error di browser console (F12)

---

## ❌ TROUBLESHOOTING

### **Problem 1: Error "relation gelombang already exists"**
**Solusi:** Script sudah menggunakan `CREATE TABLE IF NOT EXISTS`, ini normal. Lanjutkan saja.

---

### **Problem 2: Error "permission denied for table gelombang"**
**Solusi:** 
1. Pastikan Anda menggunakan role **service_role** atau **postgres** saat run script
2. Di SQL Editor, pilih role **postgres** di dropdown (biasanya di kanan atas)
3. Run ulang script

---

### **Problem 3: Masih ada 2+ gelombang aktif sekaligus**
**Solusi:**
```sql
-- Manual fix: Deactivate all first
UPDATE public.gelombang SET is_active = false, status = 'ditutup';

-- Then activate only Gelombang 1
UPDATE public.gelombang 
SET is_active = true, status = 'aktif' 
WHERE id = 1;

-- Verify
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;
```

---

### **Problem 4: Real-time sync tidak bekerja**
**Penyebab:** Supabase Realtime tidak enabled untuk tabel `gelombang`.

**Solusi:**
1. Buka Supabase Dashboard → **Database** → **Replication**
2. Cari tabel `gelombang` di list
3. Toggle **ON** untuk enable Realtime
4. Refresh browser dan test lagi

---

### **Problem 5: Toast notification tidak muncul**
**Solusi:**
1. Buka browser console (F12)
2. Cek apakah ada error `toastr is not defined`
3. Jika ada, clear cache browser (Ctrl+Shift+Del)
4. Hard refresh (Ctrl+F5)

---

## 📊 MONITORING & MAINTENANCE

### **Query untuk Monitor Gelombang**
Simpan query ini untuk monitoring rutin:

```sql
-- Cek status semua gelombang
SELECT 
  id,
  nama,
  to_char(start_date, 'DD Mon YYYY') as mulai,
  to_char(end_date, 'DD Mon YYYY') as selesai,
  tahun_ajaran,
  is_active,
  status,
  urutan,
  to_char(updated_at, 'DD Mon YYYY HH24:MI:SS') as last_update
FROM public.gelombang
ORDER BY urutan;

-- Cek jumlah gelombang aktif (HARUS 1)
SELECT 
  COUNT(*) as total_active,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK'
    WHEN COUNT(*) > 1 THEN '❌ ERROR: Multiple active'
    ELSE '⚠️ WARNING: No active gelombang'
  END as status
FROM public.gelombang
WHERE is_active = true;

-- Cek log perubahan (via updated_at)
SELECT 
  id,
  nama,
  is_active,
  status,
  updated_at,
  NOW() - updated_at as waktu_sejak_update
FROM public.gelombang
ORDER BY updated_at DESC;
```

---

## 🎉 SELESAI!

Sistem gelombang Anda sekarang sudah:
✅ Bersih dari duplikasi  
✅ Enforced database constraints (hanya 1 gelombang aktif)  
✅ Real-time sync antara admin & public page  
✅ Auto-update timestamp  
✅ Secure dengan RLS policies  

Jika masih ada masalah, cek browser console (F12) dan Supabase logs.

---

**Created by:** AI Assistant  
**Date:** 2025-10-24  
**Version:** 1.0 - Complete & Production Ready

