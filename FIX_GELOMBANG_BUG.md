# 🐛 Fix Bug: Gelombang 1 Selalu Aktif

## ❌ Masalah

**Gejala:**
- Gelombang 1 selalu menampilkan status "Aktif" di admin panel
- Meskipun admin sudah klik "Jadikan Aktif" untuk Gelombang 2 atau 3
- Hasilnya tetap Gelombang 1 yang aktif
- **Screenshot bug**: Terdapat 2 gelombang yang sama-sama tampak aktif (Gelombang Aktif + badge "Aktif" hijau)

**Root Cause:**
RPC function `set_gelombang_status` yang dipanggil oleh frontend **TIDAK ADA di database**. Frontend memanggil function yang belum dibuat, sehingga perubahan gelombang aktif tidak ter-save ke database.

---

## ✅ Solusi

### **Step 1: Buat Table `gelombang` (Jika Belum Ada)**

Jalankan SQL ini di **Supabase SQL Editor**:

```sql
-- Copy semua isi file ini dan jalankan
sql/create_table_gelombang.sql
```

**What it does:**
- Membuat table `gelombang` dengan struktur lengkap
- Insert 3 sample gelombang (Gelombang 1, 2, 3)
- Set Gelombang 1 sebagai aktif (default)
- Enable RLS (Row Level Security) untuk keamanan

**Verify:**
```sql
SELECT * FROM gelombang ORDER BY urutan;
```

---

### **Step 2: Buat RPC Function `set_gelombang_status`** ⚠️ **CRITICAL**

Jalankan SQL ini di **Supabase SQL Editor**:

```sql
-- Copy semua isi file ini dan jalankan
sql/create_rpc_set_gelombang_status.sql
```

**What it does:**
- Membuat RPC function `set_gelombang_status(p_id integer)`
- Function ini **ATOMIC**: Deactivate semua gelombang, lalu activate yang dipilih
- Jika function gagal, semua perubahan di-rollback (tidak ada partial update)
- Include debug logging untuk troubleshooting

**Verify:**
```sql
-- Test activate gelombang 2
SELECT set_gelombang_status(2);

-- Check result (hanya gelombang 2 yang aktif)
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Expected Output:**
```
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | false
 2 | Gelombang 2 | true     ← ONLY THIS IS ACTIVE
 3 | Gelombang 3 | false
```

---

### **Step 3: Grant Permissions** (PENTING!)

Jalankan SQL ini di **Supabase SQL Editor**:

```sql
-- Copy semua isi file ini dan jalankan
sql/grant_rpc_gelombang.sql
```

**What it does:**
- Grant EXECUTE permission ke `anon` role (public)
- Grant EXECUTE permission ke `authenticated` role
- Grant EXECUTE permission ke `service_role` (admin)

**Verify:**
```sql
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'set_gelombang_status'
ORDER BY grantee, privilege_type;
```

**Expected Output:**
```
routine_name          | grantee        | privilege_type
----------------------|----------------|---------------
set_gelombang_status  | anon           | EXECUTE
set_gelombang_status  | authenticated  | EXECUTE
set_gelombang_status  | service_role   | EXECUTE
```

---

## 🧪 Testing

### **1. Test di Supabase SQL Editor**

```sql
-- Initial state
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- Activate Gelombang 2
SELECT set_gelombang_status(2);

-- Verify (hanya gelombang 2 aktif)
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- Activate Gelombang 3
SELECT set_gelombang_status(3);

-- Verify (hanya gelombang 3 aktif)
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

### **2. Test di Admin Panel**

1. Login ke Admin Panel: `https://your-domain.com/admin.html`
2. Klik tab **"Kelola Gelombang"**
3. Klik button **"Jadikan Aktif"** pada Gelombang 2
4. **Expected behavior:**
   - ✅ Button Gelombang 2 berubah menjadi "Gelombang Aktif" (disabled)
   - ✅ Card Gelombang 2 border hijau, badge "Aktif"
   - ✅ Gelombang 1 & 3 kembali ke button "Jadikan Aktif" (enabled)
   - ✅ Card Gelombang 1 & 3 border abu-abu, badge "Ditutup"
5. Refresh halaman (Ctrl + R)
6. Verify bahwa Gelombang 2 masih aktif (state tersimpan di database)

### **3. Test Real-Time Sync**

**Scenario A: Same Browser, Different Tabs**
1. Buka Admin Panel di Tab 1
2. Buka Admin Panel di Tab 2
3. Di Tab 1, klik "Jadikan Aktif" pada Gelombang 3
4. **Expected:** Tab 2 otomatis update dalam ~500ms (toast notification muncul)

**Scenario B: Cross-Device**
1. Buka Admin Panel di Desktop
2. Buka Admin Panel di Mobile (browser lain)
3. Di Desktop, klik "Jadikan Aktif" pada Gelombang 2
4. **Expected:** Mobile otomatis update dalam ~500-1000ms (via Supabase real-time)

### **4. Test di Homepage (index.html)**

1. Buka Homepage: `https://your-domain.com/`
2. Lihat section "Gelombang Pendaftaran"
3. Buka Admin Panel di tab lain
4. Aktivkan Gelombang 2 di admin
5. **Expected:** Homepage otomatis update dalam ~300ms (localStorage event)

---

## 🐛 Troubleshooting

### **Problem 1: Function tidak bisa dipanggil (permission denied)**

**Error:**
```
permission denied for function set_gelombang_status
```

**Solution:**
```sql
-- Jalankan ulang grant permissions
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;
```

---

### **Problem 2: Button tidak berubah di admin panel**

**Checklist:**
1. ✅ Sudah jalankan `create_rpc_set_gelombang_status.sql`?
2. ✅ Sudah jalankan `grant_rpc_gelombang.sql`?
3. ✅ Buka Browser Console (F12) - ada error?
4. ✅ Test di Supabase SQL Editor - function bisa dipanggil?

**Debug:**
```javascript
// Di Browser Console (F12), test manual:
window.supabase.rpc('set_gelombang_status', { p_id: 2 }).then(console.log).catch(console.error);
```

---

### **Problem 3: Gelombang masih bisa lebih dari 1 yang aktif**

**Diagnosis:**
```sql
-- Cek berapa gelombang yang aktif
SELECT COUNT(*) FROM gelombang WHERE is_active = true;

-- Jika lebih dari 1, ada yang salah
```

**Fix:**
```sql
-- Manual deactivate semua gelombang
UPDATE gelombang SET is_active = false;

-- Activate hanya gelombang 1
UPDATE gelombang SET is_active = true WHERE id = 1;

-- Verify
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

---

### **Problem 4: RPC function error "column status does not exist"**

**Diagnosis:**
```sql
-- Cek apakah column 'status' ada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'gelombang' AND table_schema = 'public';
```

**Solution:**
RPC function sudah dibuat dengan dynamic check untuk column `status`. Jika column tidak ada, function akan skip update status dan hanya update `is_active`.

---

## 📊 Database Schema

### **Table: `gelombang`**

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment ID |
| `nama` | VARCHAR(100) | NOT NULL | Nama gelombang (e.g., "Gelombang 1") |
| `start_date` | DATE | NOT NULL | Tanggal mulai pendaftaran |
| `end_date` | DATE | NOT NULL | Tanggal akhir pendaftaran |
| `tahun_ajaran` | VARCHAR(20) | NOT NULL | Tahun ajaran (e.g., "2025/2026") |
| `is_active` | BOOLEAN | DEFAULT FALSE | Status aktif (ONLY ONE should be TRUE) |
| `urutan` | INTEGER | DEFAULT 0 | Urutan tampilan |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Tanggal dibuat |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Tanggal update terakhir |

### **RPC Function: `set_gelombang_status`**

**Signature:**
```sql
set_gelombang_status(p_id integer) RETURNS json
```

**Logic:**
```sql
1. Deactivate ALL gelombang (is_active = FALSE)
2. Activate specified gelombang (is_active = TRUE WHERE id = p_id)
3. Return JSON with success status and data
```

**Security:**
- `SECURITY DEFINER`: Function runs with creator's permissions (bypasses RLS)
- Atomic transaction: If fails, all changes are rolled back

---

## 📁 Files Involved

| File | Purpose | Status |
|------|---------|--------|
| `sql/create_table_gelombang.sql` | Create table gelombang | ✨ NEW |
| `sql/create_rpc_set_gelombang_status.sql` | Create RPC function | ✨ NEW |
| `sql/grant_rpc_gelombang.sql` | Grant permissions | ✅ EXISTING |
| `lib/handlers/gelombang_set_active.py` | Backend API (unused now) | ℹ️ INFO |
| `public/assets/js/admin.js` | Frontend JavaScript | ✅ NO CHANGE |

---

## ✅ Checklist Final

- [ ] **Step 1:** Jalankan `sql/create_table_gelombang.sql` di Supabase SQL Editor
- [ ] **Step 2:** Jalankan `sql/create_rpc_set_gelombang_status.sql` di Supabase SQL Editor
- [ ] **Step 3:** Jalankan `sql/grant_rpc_gelombang.sql` di Supabase SQL Editor
- [ ] **Step 4:** Test di Supabase SQL Editor: `SELECT set_gelombang_status(2);`
- [ ] **Step 5:** Test di Admin Panel: Klik "Jadikan Aktif" pada Gelombang 2
- [ ] **Step 6:** Verify: Refresh admin panel, check status still correct
- [ ] **Step 7:** Test real-time sync: Buka 2 tab admin, ubah gelombang di tab 1, cek tab 2 auto-update
- [ ] **Step 8:** Test homepage sync: Ubah gelombang di admin, cek homepage auto-update

---

## 🎯 Expected Result After Fix

### **Before (BUG):**
```
Admin Panel (Kelola Gelombang):
┌─────────────────────────────────────────┐
│ ✅ Gelombang 1 - Badge: "Aktif"        │ ← STUCK ACTIVE
│    Button: "Gelombang Aktif" (disabled)│
├─────────────────────────────────────────┤
│ ❌ Gelombang 2 - Badge: "Aktif"        │ ← ALSO SHOWS ACTIVE (BUG!)
│    Button: "Gelombang Aktif" (disabled)│
├─────────────────────────────────────────┤
│ ❌ Gelombang 3 - Badge: "Ditutup"      │
│    Button: "Jadikan Aktif" (enabled)   │
└─────────────────────────────────────────┘
```

### **After (FIXED):**
```
Admin Panel (Kelola Gelombang):
┌─────────────────────────────────────────┐
│ ⚪ Gelombang 1 - Badge: "Ditutup"       │
│    Button: "Jadikan Aktif" (enabled)   │
├─────────────────────────────────────────┤
│ ✅ Gelombang 2 - Badge: "Aktif"        │ ← ONLY THIS IS ACTIVE
│    Button: "Gelombang Aktif" (disabled)│
├─────────────────────────────────────────┤
│ ⚪ Gelombang 3 - Badge: "Ditutup"       │
│    Button: "Jadikan Aktif" (enabled)   │
└─────────────────────────────────────────┘
```

---

**Developed with ❤️ for Pondok Pesantren Al Ikhsan Beji** 🕌

*Bug fixed: 2025-10-24*

