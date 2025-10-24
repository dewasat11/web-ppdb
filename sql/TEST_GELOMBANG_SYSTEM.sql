-- ============================================================================
-- TEST & VERIFIKASI: Sistem Gelombang
-- Pondok Pesantren Al Ikhsan Beji - PPDSB System
-- ============================================================================
-- 
-- Purpose: Verify bahwa sistem gelombang berjalan dengan benar
-- Run: Copy-paste semua query ini di Supabase SQL Editor
-- 
-- ============================================================================

-- ============================================================================
-- TEST 1: Cek Table Gelombang Ada
-- ============================================================================
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'gelombang';

-- ✅ Expected Output:
-- table_name | table_type
-- -----------|-----------
-- gelombang  | BASE TABLE

-- ============================================================================
-- TEST 2: Cek Struktur Table Gelombang
-- ============================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'gelombang'
ORDER BY ordinal_position;

-- ✅ Expected Output: 9 columns
-- column_name  | data_type | is_nullable | column_default
-- -------------|-----------|-------------|---------------
-- id           | integer   | NO          | nextval(...)
-- nama         | varchar   | NO          | NULL
-- start_date   | date      | NO          | NULL
-- end_date     | date      | NO          | NULL
-- tahun_ajaran | varchar   | NO          | NULL
-- is_active    | boolean   | YES         | false
-- urutan       | integer   | YES         | 0
-- created_at   | timestamp | YES         | now()
-- updated_at   | timestamp | YES         | now()

-- ============================================================================
-- TEST 3: Cek Data Gelombang (Harus Ada 3)
-- ============================================================================
SELECT 
    id, 
    nama, 
    start_date, 
    end_date, 
    tahun_ajaran, 
    is_active, 
    urutan,
    created_at
FROM gelombang 
ORDER BY urutan;

-- ✅ Expected Output: 3 rows
-- id | nama        | start_date | end_date   | tahun_ajaran | is_active | urutan
-- ---|-------------|------------|------------|--------------|-----------|-------
--  1 | Gelombang 1 | 2025-10-23 | 2025-11-30 | 2025/2026    | true      | 1
--  2 | Gelombang 2 | 2025-12-01 | 2026-01-31 | 2025/2026    | false     | 2
--  3 | Gelombang 3 | 2026-02-01 | 2026-03-31 | 2025/2026    | false     | 3

-- ============================================================================
-- TEST 4: Cek RPC Function Ada
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'set_gelombang_status';

-- ✅ Expected Output:
-- routine_name          | routine_type | data_type
-- ----------------------|--------------|----------
-- set_gelombang_status  | FUNCTION     | json

-- ============================================================================
-- TEST 5: Cek Permissions RPC Function
-- ============================================================================
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'set_gelombang_status'
ORDER BY grantee, privilege_type;

-- ✅ Expected Output: 3 rows (anon, authenticated, service_role)
-- routine_name          | grantee        | privilege_type
-- ----------------------|----------------|---------------
-- set_gelombang_status  | anon           | EXECUTE
-- set_gelombang_status  | authenticated  | EXECUTE
-- set_gelombang_status  | service_role   | EXECUTE

-- ============================================================================
-- TEST 6: Cek Hanya 1 Gelombang Yang Aktif
-- ============================================================================
SELECT 
    COUNT(*) as jumlah_aktif,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ BENAR: Hanya 1 aktif'
        WHEN COUNT(*) = 0 THEN '❌ ERROR: Tidak ada yang aktif'
        ELSE '❌ ERROR: Ada ' || COUNT(*) || ' gelombang aktif!'
    END as status
FROM gelombang 
WHERE is_active = true;

-- ✅ Expected Output:
-- jumlah_aktif | status
-- -------------|---------------------------
-- 1            | ✅ BENAR: Hanya 1 aktif

-- ============================================================================
-- TEST 7: Test RPC Function - Activate Gelombang 2
-- ============================================================================
-- This will CHANGE data! Make sure you understand what this does.

SELECT set_gelombang_status(2);

-- ✅ Expected Output: JSON object
-- {
--   "success": true,
--   "message": "Gelombang berhasil diaktifkan",
--   "data": { ... gelombang 2 data ... }
-- }

-- ============================================================================
-- TEST 8: Verify Hasil Test 7 (Hanya Gelombang 2 Yang Aktif)
-- ============================================================================
SELECT 
    id, 
    nama, 
    is_active,
    CASE 
        WHEN is_active = true THEN '🟢 AKTIF'
        ELSE '⚪ TIDAK AKTIF'
    END as status_visual
FROM gelombang 
ORDER BY id;

-- ✅ Expected Output: HANYA gelombang 2 yang TRUE
-- id | nama        | is_active | status_visual
-- ---|-------------|-----------|---------------
--  1 | Gelombang 1 | false     | ⚪ TIDAK AKTIF
--  2 | Gelombang 2 | true      | 🟢 AKTIF       ← ONLY THIS
--  3 | Gelombang 3 | false     | ⚪ TIDAK AKTIF

-- ============================================================================
-- TEST 9: Test RPC Function - Activate Gelombang 3
-- ============================================================================
SELECT set_gelombang_status(3);

-- ============================================================================
-- TEST 10: Verify Hasil Test 9 (Hanya Gelombang 3 Yang Aktif)
-- ============================================================================
SELECT 
    id, 
    nama, 
    is_active,
    CASE 
        WHEN is_active = true THEN '🟢 AKTIF'
        ELSE '⚪ TIDAK AKTIF'
    END as status_visual
FROM gelombang 
ORDER BY id;

-- ✅ Expected Output: HANYA gelombang 3 yang TRUE
-- id | nama        | is_active | status_visual
-- ---|-------------|-----------|---------------
--  1 | Gelombang 1 | false     | ⚪ TIDAK AKTIF
--  2 | Gelombang 2 | false     | ⚪ TIDAK AKTIF
--  3 | Gelombang 3 | true      | 🟢 AKTIF       ← ONLY THIS

-- ============================================================================
-- TEST 11: Test Error Handling - Invalid ID
-- ============================================================================
-- This should fail with error message
SELECT set_gelombang_status(999);

-- ✅ Expected Output: ERROR
-- ERROR: Gelombang dengan ID 999 tidak ditemukan

-- ============================================================================
-- TEST 12: Final Check - Reset ke Gelombang 1
-- ============================================================================
SELECT set_gelombang_status(1);

SELECT 
    id, 
    nama, 
    is_active,
    updated_at
FROM gelombang 
ORDER BY id;

-- ✅ Expected Output: Gelombang 1 aktif, updated_at = NOW
-- id | nama        | is_active | updated_at
-- ---|-------------|-----------|-------------------
--  1 | Gelombang 1 | true      | 2025-10-24 ... (RECENT)
--  2 | Gelombang 2 | false     | 2025-10-24 ... (RECENT)
--  3 | Gelombang 3 | false     | 2025-10-24 ... (RECENT)

-- ============================================================================
-- SUMMARY: Test Results
-- ============================================================================
-- 
-- ✅ TEST 1: Table gelombang exists
-- ✅ TEST 2: Table structure correct (9 columns)
-- ✅ TEST 3: Sample data inserted (3 gelombang)
-- ✅ TEST 4: RPC function exists
-- ✅ TEST 5: Permissions granted (anon, authenticated, service_role)
-- ✅ TEST 6: Only 1 gelombang is active
-- ✅ TEST 7-8: Can activate Gelombang 2
-- ✅ TEST 9-10: Can activate Gelombang 3
-- ✅ TEST 11: Error handling works
-- ✅ TEST 12: Can activate Gelombang 1
--
-- ============================================================================
-- QUICK HEALTH CHECK (Run this anytime)
-- ============================================================================

SELECT 
    '🏥 HEALTH CHECK: Sistem Gelombang' as title,
    (SELECT COUNT(*) FROM gelombang) as total_gelombang,
    (SELECT COUNT(*) FROM gelombang WHERE is_active = true) as gelombang_aktif,
    (SELECT nama FROM gelombang WHERE is_active = true LIMIT 1) as nama_gelombang_aktif,
    CASE 
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 1 
        THEN '✅ SEHAT: Sistem berjalan normal'
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 0 
        THEN '⚠️ WARNING: Tidak ada gelombang aktif'
        ELSE '❌ ERROR: Ada ' || (SELECT COUNT(*) FROM gelombang WHERE is_active = true) || ' gelombang aktif!'
    END as status
;

-- ✅ Expected Output:
-- title                              | total_gelombang | gelombang_aktif | nama_gelombang_aktif | status
-- -----------------------------------|-----------------|-----------------|----------------------|---------------------------
-- 🏥 HEALTH CHECK: Sistem Gelombang | 3               | 1               | Gelombang 1          | ✅ SEHAT: Sistem berjalan normal

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- 
-- Problem 1: Table gelombang tidak ada
-- Solution: Jalankan ulang sql/create_table_gelombang.sql
-- 
-- Problem 2: RPC function tidak ada
-- Solution: Jalankan ulang sql/create_rpc_set_gelombang_status.sql
-- 
-- Problem 3: Permission denied
-- Solution: Jalankan ulang sql/grant_rpc_gelombang.sql
-- 
-- Problem 4: Lebih dari 1 gelombang aktif
-- Solution: 
--   UPDATE gelombang SET is_active = false;
--   SELECT set_gelombang_status(1);
-- 
-- Problem 5: RPC function error
-- Solution: Check logs di Supabase Dashboard → Database → Logs
-- 
-- ============================================================================

