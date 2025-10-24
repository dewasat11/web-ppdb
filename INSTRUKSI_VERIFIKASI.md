# ⚡ Instruksi Quick: Verifikasi Sistem Gelombang

## ✅ Anda Sudah Menjalankan 3 File SQL - Sekarang Verifikasi!

---

## 🚀 Quick Test (2 Menit)

### **Step 1: Buka Supabase SQL Editor**

Login ke [Supabase Dashboard](https://supabase.com/dashboard) → Pilih Project → Klik **SQL Editor**

### **Step 2: Copy-Paste Query Ini:**

```sql
-- Quick Health Check
SELECT 
    '🏥 HEALTH CHECK' as title,
    (SELECT COUNT(*) FROM gelombang) as total,
    (SELECT COUNT(*) FROM gelombang WHERE is_active = true) as aktif,
    (SELECT nama FROM gelombang WHERE is_active = true) as nama_aktif,
    CASE 
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 1 
        THEN '✅ SISTEM NORMAL'
        ELSE '❌ ADA MASALAH!'
    END as status;
```

### **Step 3: Klik "Run"**

---

## ✅ **Hasil Yang Benar:**

```
title             | total | aktif | nama_aktif  | status
------------------|-------|-------|-------------|------------------
🏥 HEALTH CHECK  | 3     | 1     | Gelombang 1 | ✅ SISTEM NORMAL
```

### **Artinya:**
- ✅ Table `gelombang` ada
- ✅ Ada 3 gelombang (1, 2, 3)
- ✅ Hanya 1 yang aktif (Gelombang 1)
- ✅ **SISTEM BERJALAN DENGAN BAIK!**

---

## ❌ **Jika Hasil Berbeda:**

### **Problem 1: ERROR - relation "gelombang" does not exist**

**Artinya:** Table belum dibuat  
**Solusi:** Jalankan ulang `sql/create_table_gelombang.sql`

---

### **Problem 2: total = 0 (tidak ada data)**

**Artinya:** Table ada tapi data belum di-insert  
**Solusi:** Jalankan query ini:

```sql
INSERT INTO gelombang (nama, start_date, end_date, tahun_ajaran, is_active, urutan)
VALUES 
    ('Gelombang 1', '2025-10-23', '2025-11-30', '2025/2026', true, 1),
    ('Gelombang 2', '2025-12-01', '2026-01-31', '2025/2026', false, 2),
    ('Gelombang 3', '2026-02-01', '2026-03-31', '2025/2026', false, 3);
```

---

### **Problem 3: aktif = 0 (tidak ada yang aktif)**

**Solusi:** Activate gelombang 1:

```sql
SELECT set_gelombang_status(1);
```

---

### **Problem 4: aktif > 1 (lebih dari 1 aktif)**

**Solusi:** Reset semua, lalu activate gelombang 1:

```sql
UPDATE gelombang SET is_active = false;
SELECT set_gelombang_status(1);
```

---

## 🧪 Test RPC Function (1 Menit)

### **Test 1: Activate Gelombang 2**

```sql
SELECT set_gelombang_status(2);
```

**Expected:** Muncul JSON:
```json
{
  "success": true,
  "message": "Gelombang berhasil diaktifkan",
  "data": { ... }
}
```

### **Test 2: Check Hasil**

```sql
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Expected:**
```
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | false
 2 | Gelombang 2 | true      ← HANYA INI YANG TRUE
 3 | Gelombang 3 | false
```

**✅ Jika Hasilnya Seperti Ini = RPC FUNCTION BERJALAN!**

---

## 🎯 Test di Admin Panel (2 Menit)

### **Step 1: Login Admin**

Buka: `https://your-domain.vercel.app/admin.html`

### **Step 2: Klik Tab "Kelola Gelombang"**

### **Step 3: Klik "Jadikan Aktif" pada Gelombang 3**

**Expected:**
- ✅ Button berubah jadi "Gelombang Aktif" (disabled)
- ✅ Card border jadi hijau
- ✅ Badge jadi "Aktif"
- ✅ Gelombang 1 & 2 kembali ke button "Jadikan Aktif"

### **Step 4: Refresh Halaman (Ctrl + R)**

**Expected:**
- ✅ Gelombang 3 masih aktif (state tersimpan!)

---

## ✅ **Jika Semua Test Passed:**

```
╔═══════════════════════════════════════════════╗
║  🎉 SISTEM GELOMBANG BERJALAN 100%!          ║
╠═══════════════════════════════════════════════╣
║  ✅ Database: OK                              ║
║  ✅ RPC Function: OK                          ║
║  ✅ Admin Panel: OK                           ║
╠═══════════════════════════════════════════════╣
║  🚀 SIAP DIGUNAKAN!                           ║
╚═══════════════════════════════════════════════╝
```

---

## 📖 Dokumentasi Lengkap

Jika butuh detail lebih atau troubleshooting:

| File | Purpose |
|------|---------|
| **`VERIFIKASI_GELOMBANG.md`** | Panduan verifikasi lengkap + troubleshooting |
| **`sql/TEST_GELOMBANG_SYSTEM.sql`** | 12 test cases komprehensif |
| **`FIX_GELOMBANG_BUG.md`** | Penjelasan bug + solusi detail |
| **`QUICK_FIX_GELOMBANG.md`** | 3 langkah quick fix |

---

## 🆘 Butuh Bantuan?

Jika ada masalah:

1. **Buka Browser Console (F12)** di admin panel
2. **Lihat error message**
3. **Buka dokumentasi** di atas sesuai error
4. **Test manual** di Supabase SQL Editor

---

**Developed with ❤️ for Pondok Pesantren Al Ikhsan Beji** 🕌

