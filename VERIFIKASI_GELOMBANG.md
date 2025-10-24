# ✅ Verifikasi: Sistem Gelombang Berjalan Dengan Benar

## 🎯 Tujuan
Memastikan sistem gelombang sudah berjalan 100% setelah Anda menjalankan 3 file SQL.

---

## 📋 Quick Check (5 Menit)

### **Step 1: Cek Database (Supabase SQL Editor)**

Copy-paste query ini di **Supabase SQL Editor**:

```sql
-- Quick Health Check
SELECT 
    '🏥 HEALTH CHECK: Sistem Gelombang' as title,
    (SELECT COUNT(*) FROM gelombang) as total_gelombang,
    (SELECT COUNT(*) FROM gelombang WHERE is_active = true) as gelombang_aktif,
    (SELECT nama FROM gelombang WHERE is_active = true LIMIT 1) as nama_aktif,
    CASE 
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 1 
        THEN '✅ SEHAT: Sistem berjalan normal'
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 0 
        THEN '⚠️ WARNING: Tidak ada gelombang aktif'
        ELSE '❌ ERROR: Ada ' || (SELECT COUNT(*) FROM gelombang WHERE is_active = true) || ' gelombang aktif!'
    END as status
;
```

**✅ Expected Output:**
```
title                              | total_gelombang | gelombang_aktif | nama_aktif  | status
-----------------------------------|-----------------|-----------------|-------------|---------------------------
🏥 HEALTH CHECK: Sistem Gelombang | 3               | 1               | Gelombang 1 | ✅ SEHAT: Sistem berjalan normal
```

**❌ Jika Output Berbeda:**
- `total_gelombang = 0` → Jalankan ulang `sql/create_table_gelombang.sql`
- `gelombang_aktif = 0` → Run: `SELECT set_gelombang_status(1);`
- `gelombang_aktif > 1` → Ada bug! Lihat troubleshooting di bawah

---

### **Step 2: Test RPC Function**

Copy-paste di **Supabase SQL Editor**:

```sql
-- Test 1: Activate Gelombang 2
SELECT set_gelombang_status(2);

-- Test 2: Check hasil (hanya gelombang 2 yang aktif)
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**✅ Expected Output:**
```
-- Query 1 Result (JSON):
{
  "success": true,
  "message": "Gelombang berhasil diaktifkan",
  "data": { ... }
}

-- Query 2 Result:
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | false      ← Deactivated
 2 | Gelombang 2 | true       ← ACTIVE (CORRECT!)
 3 | Gelombang 3 | false      ← Deactivated
```

**❌ Jika Error:**
- `function set_gelombang_status does not exist` → Jalankan ulang `sql/create_rpc_set_gelombang_status.sql`
- `permission denied` → Jalankan ulang `sql/grant_rpc_gelombang.sql`

---

### **Step 3: Test di Admin Panel**

1. **Login Admin**: `https://your-domain.com/admin.html`
2. **Klik tab "Kelola Gelombang"**
3. **Klik "Jadikan Aktif"** pada Gelombang 3

**✅ Expected Behavior:**

| Gelombang | Button | Border | Badge |
|-----------|--------|--------|-------|
| Gelombang 1 | "Jadikan Aktif" (enabled) | Abu-abu | "Ditutup" |
| Gelombang 2 | "Jadikan Aktif" (enabled) | Abu-abu | "Ditutup" |
| Gelombang 3 | "Gelombang Aktif" (disabled) | **Hijau** | **"Aktif"** |

4. **Refresh halaman** (Ctrl + R)
5. ✅ **Verify**: Gelombang 3 masih aktif (tersimpan di database!)

**❌ Jika Button Tidak Berubah:**
- Buka Browser Console (F12)
- Lihat error message
- Check apakah Supabase credentials benar di `admin.html`

---

## 🧪 Full Test Suite (15 Menit)

Untuk testing menyeluruh, jalankan semua test di file:

📄 **`sql/TEST_GELOMBANG_SYSTEM.sql`**

File ini berisi **12 test cases** yang komprehensif:

```bash
✅ TEST 1: Table gelombang exists
✅ TEST 2: Table structure correct (9 columns)
✅ TEST 3: Sample data inserted (3 gelombang)
✅ TEST 4: RPC function exists
✅ TEST 5: Permissions granted
✅ TEST 6: Only 1 gelombang is active
✅ TEST 7-8: Can activate Gelombang 2
✅ TEST 9-10: Can activate Gelombang 3
✅ TEST 11: Error handling works
✅ TEST 12: Can reset to Gelombang 1
```

**Cara Run:**
1. Buka `sql/TEST_GELOMBANG_SYSTEM.sql`
2. Copy semua isi file
3. Paste di Supabase SQL Editor
4. Jalankan query satu per satu (atau sekaligus)
5. Verify setiap output sesuai expected

---

## 🎯 Checklist Final

### **Database Setup:**
- [ ] ✅ Table `gelombang` ada (3 rows)
- [ ] ✅ RPC function `set_gelombang_status` ada
- [ ] ✅ Permissions granted (anon, authenticated, service_role)
- [ ] ✅ Hanya 1 gelombang aktif

### **RPC Function:**
- [ ] ✅ Bisa activate Gelombang 2
- [ ] ✅ Bisa activate Gelombang 3
- [ ] ✅ Bisa activate Gelombang 1
- [ ] ✅ Error handling works (invalid ID)

### **Admin Panel:**
- [ ] ✅ Button "Jadikan Aktif" works
- [ ] ✅ Button berubah jadi "Gelombang Aktif" setelah klik
- [ ] ✅ Card border berubah hijau
- [ ] ✅ Badge berubah jadi "Aktif"
- [ ] ✅ Gelombang lain otomatis jadi "Ditutup"
- [ ] ✅ State tersimpan setelah refresh

### **Real-Time Sync:**
- [ ] ✅ Multi-tab admin sync (buka 2 tab admin)
- [ ] ✅ Homepage sync (update di admin, cek di homepage)
- [ ] ✅ Cross-device sync (desktop + mobile)

---

## 🐛 Troubleshooting

### **Problem: Table gelombang tidak ada**

**Diagnosis:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'gelombang';
```

**Solution:**
```sql
-- Jalankan ulang
sql/create_table_gelombang.sql
```

---

### **Problem: RPC function tidak ada**

**Diagnosis:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'set_gelombang_status';
```

**Solution:**
```sql
-- Jalankan ulang
sql/create_rpc_set_gelombang_status.sql
```

---

### **Problem: Permission denied**

**Diagnosis:**
```sql
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges
WHERE routine_name = 'set_gelombang_status';
```

**Solution:**
```sql
-- Jalankan ulang
sql/grant_rpc_gelombang.sql
```

---

### **Problem: Lebih dari 1 gelombang aktif**

**Diagnosis:**
```sql
SELECT COUNT(*) FROM gelombang WHERE is_active = true;
-- Jika hasilnya > 1, ada masalah!
```

**Solution:**
```sql
-- Manual fix: Deactivate semua
UPDATE gelombang SET is_active = false;

-- Activate hanya gelombang 1
SELECT set_gelombang_status(1);

-- Verify
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

---

### **Problem: Button tidak berubah di admin panel**

**Checklist:**
1. ✅ Buka Browser Console (F12)
2. ✅ Ada error message?
3. ✅ Test manual di console:
   ```javascript
   window.supabase.rpc('set_gelombang_status', { p_id: 2 })
     .then(res => console.log('✅ Success:', res))
     .catch(err => console.error('❌ Error:', err));
   ```
4. ✅ Check Supabase credentials di `admin.html` (line 1151-1152)

---

### **Problem: Data tidak tersimpan setelah refresh**

**Possible Causes:**
1. RPC function belum dibuat
2. Permissions belum di-grant
3. Browser cache (Ctrl + Shift + Delete)

**Solution:**
1. Jalankan ulang 3 SQL files sesuai urutan
2. Clear browser cache
3. Hard refresh (Ctrl + F5)

---

## 📊 Monitoring (Production)

### **Daily Health Check:**

Jalankan query ini setiap hari untuk monitor sistem:

```sql
-- Daily Gelombang Health Check
SELECT 
    NOW() as check_time,
    (SELECT COUNT(*) FROM gelombang) as total_gelombang,
    (SELECT COUNT(*) FROM gelombang WHERE is_active = true) as gelombang_aktif,
    (SELECT nama FROM gelombang WHERE is_active = true LIMIT 1) as gelombang_aktif_nama,
    (SELECT start_date FROM gelombang WHERE is_active = true LIMIT 1) as start_date,
    (SELECT end_date FROM gelombang WHERE is_active = true LIMIT 1) as end_date,
    CASE 
        WHEN (SELECT end_date FROM gelombang WHERE is_active = true) < CURRENT_DATE 
        THEN '⚠️ EXPIRED: Gelombang sudah lewat!'
        WHEN (SELECT start_date FROM gelombang WHERE is_active = true) > CURRENT_DATE 
        THEN '⏳ UPCOMING: Gelombang belum dimulai'
        ELSE '✅ ACTIVE: Gelombang sedang berjalan'
    END as timeline_status
;
```

---

## ✅ Status Akhir

Jika semua checklist di atas sudah ✅, maka:

```
╔════════════════════════════════════════════════╗
║  🎉 SISTEM GELOMBANG BERJALAN DENGAN BENAR!   ║
╠════════════════════════════════════════════════╣
║  ✅ Database: OK                               ║
║  ✅ RPC Function: OK                           ║
║  ✅ Permissions: OK                            ║
║  ✅ Admin Panel: OK                            ║
║  ✅ Real-Time Sync: OK                         ║
╠════════════════════════════════════════════════╣
║  🚀 STATUS: PRODUCTION READY                   ║
╚════════════════════════════════════════════════╝
```

---

**Developed with ❤️ for Pondok Pesantren Al Ikhsan Beji** 🕌

*Verifikasi selesai: 2025-10-24*

