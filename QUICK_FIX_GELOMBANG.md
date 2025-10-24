# 🚀 Quick Fix: Gelombang Bug (3 Langkah Mudah)

## ❌ Problem
**Gelombang 1 selalu aktif** meskipun admin sudah pilih Gelombang 2/3

---

## ✅ Solution (Copy-Paste SQL)

### **Step 1: Buat Table Gelombang**
Buka **Supabase SQL Editor**, copy-paste ini:

```sql
-- Copy semua isi file sql/create_table_gelombang.sql
-- Atau copy script berikut:

CREATE TABLE IF NOT EXISTS public.gelombang (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    urutan INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO gelombang (nama, start_date, end_date, tahun_ajaran, is_active, urutan)
SELECT * FROM (
    VALUES 
        ('Gelombang 1', '2025-10-23', '2025-11-30', '2025/2026', true, 1),
        ('Gelombang 2', '2025-12-01', '2026-01-31', '2025/2026', false, 2),
        ('Gelombang 3', '2026-02-01', '2026-03-31', '2025/2026', false, 3)
) AS v(nama, start_date, end_date, tahun_ajaran, is_active, urutan)
WHERE NOT EXISTS (SELECT 1 FROM gelombang LIMIT 1);
```

**✓ Run** → Klik "Run" di Supabase SQL Editor

---

### **Step 2: Buat RPC Function** ⚠️ **PENTING!**
Copy-paste ini di **Supabase SQL Editor**:

```sql
-- Copy semua isi file sql/create_rpc_set_gelombang_status.sql
-- File lengkap ada di project, atau buka file untuk copy full version
-- Function ini CRITICAL untuk fix bug gelombang
```

**File location**: `sql/create_rpc_set_gelombang_status.sql`  
**✓ Run** → Klik "Run" di Supabase SQL Editor

---

### **Step 3: Grant Permissions**
Copy-paste ini di **Supabase SQL Editor**:

```sql
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;
```

**✓ Run** → Klik "Run" di Supabase SQL Editor

---

## 🧪 Test (Quick Verify)

Jalankan di **Supabase SQL Editor**:

```sql
-- Test 1: Check current state
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- Test 2: Activate Gelombang 2
SELECT set_gelombang_status(2);

-- Test 3: Verify (hanya gelombang 2 aktif)
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

**Expected Result:**
```
id | nama        | is_active
---|-------------|----------
 1 | Gelombang 1 | false
 2 | Gelombang 2 | true     ← ONLY THIS
 3 | Gelombang 3 | false
```

---

## 🎯 Test di Admin Panel

1. Login ke Admin: `https://your-domain.com/admin.html`
2. Klik tab **"Kelola Gelombang"**
3. Klik **"Jadikan Aktif"** pada Gelombang 2
4. **Expected**:
   - ✅ Button Gelombang 2 → "Gelombang Aktif" (disabled)
   - ✅ Card Gelombang 2 → Border hijau
   - ✅ Gelombang 1 & 3 → Button "Jadikan Aktif" (enabled)
5. **Refresh halaman** (Ctrl + R)
6. ✅ Gelombang 2 masih aktif (tersimpan di database!)

---

## 📖 Dokumentasi Lengkap

Untuk troubleshooting detail, lihat:
- 📄 **[FIX_GELOMBANG_BUG.md](./FIX_GELOMBANG_BUG.md)** - Panduan lengkap + troubleshooting

---

## ✅ Checklist

- [ ] Step 1: Buat table `gelombang`
- [ ] Step 2: Buat RPC function `set_gelombang_status` ⚠️
- [ ] Step 3: Grant permissions
- [ ] Test di SQL Editor
- [ ] Test di Admin Panel
- [ ] Refresh & verify

**Done!** Bug fixed! 🎉

---

**Developed with ❤️ for Pondok Pesantren Al Ikhsan Beji**

