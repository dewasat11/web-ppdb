-- ============================================================================
-- DEBUG: Gelombang System - Why Button Click Doesn't Work?
-- ============================================================================
-- 
-- Problem: Klik "Jadikan Aktif" Gelombang 1/3 tapi tetap Gelombang 2 yang aktif
-- 
-- Run queries ini SATU PER SATU di Supabase SQL Editor untuk debug
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Current State
-- ============================================================================
SELECT 
    id, 
    nama, 
    is_active,
    updated_at,
    CASE 
        WHEN is_active = true THEN '🟢 AKTIF'
        ELSE '⚪ TIDAK AKTIF'
    END as status_visual
FROM gelombang 
ORDER BY id;

-- ❓ Question: Gelombang mana yang aktif SEKARANG?
-- Expected: Hanya 1 yang TRUE

-- ============================================================================
-- STEP 2: Check RPC Function Exists
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'set_gelombang_status';

-- ❓ Question: Apakah function ada?
-- Expected: 1 row dengan routine_name = 'set_gelombang_status'
-- If EMPTY = Function belum dibuat! Run sql/create_rpc_set_gelombang_status.sql

-- ============================================================================
-- STEP 3: Check Permissions
-- ============================================================================
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'set_gelombang_status'
ORDER BY grantee;

-- ❓ Question: Apakah permissions sudah di-grant?
-- Expected: 3 rows (anon, authenticated, service_role)
-- If EMPTY or LESS = Run sql/grant_rpc_gelombang.sql

-- ============================================================================
-- STEP 4: Manual Test - Activate Gelombang 1
-- ============================================================================
-- IMPORTANT: Ini akan MENGUBAH DATA!
-- Sebelum run, catat status saat ini dari STEP 1

SELECT set_gelombang_status(1);

-- ❓ Question: Apakah ada error?
-- Expected Output: JSON dengan success: true
-- {
--   "success": true,
--   "message": "Gelombang berhasil diaktifkan",
--   "data": { ... gelombang 1 data ... }
-- }

-- Possible Errors:
-- 1. "function set_gelombang_status does not exist"
--    → Run sql/create_rpc_set_gelombang_status.sql
-- 
-- 2. "permission denied for function"
--    → Run sql/grant_rpc_gelombang.sql
-- 
-- 3. "Gelombang dengan ID 1 tidak ditemukan"
--    → Data gelombang tidak ada, run sql/create_table_gelombang.sql

-- ============================================================================
-- STEP 5: Verify Result of Step 4
-- ============================================================================
SELECT 
    id, 
    nama, 
    is_active,
    updated_at,
    CASE 
        WHEN is_active = true THEN '🟢 AKTIF'
        ELSE '⚪ TIDAK AKTIF'
    END as status_visual
FROM gelombang 
ORDER BY id;

-- ❓ Question: Apakah HANYA Gelombang 1 yang aktif?
-- Expected:
-- id | nama        | is_active | status_visual
-- ---|-------------|-----------|---------------
--  1 | Gelombang 1 | true      | 🟢 AKTIF       ← ONLY THIS
--  2 | Gelombang 2 | false     | ⚪ TIDAK AKTIF
--  3 | Gelombang 3 | false     | ⚪ TIDAK AKTIF

-- If Gelombang 2 masih TRUE:
-- → RPC function tidak jalan dengan benar!
-- → Check function definition di STEP 6

-- ============================================================================
-- STEP 6: Check Function Definition
-- ============================================================================
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'set_gelombang_status';

-- ❓ Question: Apakah function definition ada?
-- Expected: Full function code muncul
-- If EMPTY = Function belum dibuat!

-- ============================================================================
-- STEP 7: Manual Test - Activate Gelombang 3
-- ============================================================================
SELECT set_gelombang_status(3);

-- Check result
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- Expected:
-- id | nama        | is_active
-- ---|-------------|----------
--  1 | Gelombang 1 | false
--  2 | Gelombang 2 | false
--  3 | Gelombang 3 | true      ← ONLY THIS

-- ============================================================================
-- STEP 8: Test with Invalid ID (Error Handling)
-- ============================================================================
-- This should return ERROR
SELECT set_gelombang_status(999);

-- Expected: ERROR message
-- "Gelombang dengan ID 999 tidak ditemukan"

-- If no error = Function tidak handle error dengan benar

-- ============================================================================
-- STEP 9: Check for Database Triggers or Constraints
-- ============================================================================
-- Check if there's any trigger that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'gelombang';

-- Expected: Empty or only update_modified_column trigger
-- If there are OTHER triggers = They might be interfering!

-- ============================================================================
-- STEP 10: Manual UPDATE Test (Bypass RPC)
-- ============================================================================
-- This will test if database itself can be updated

-- First, deactivate all
UPDATE gelombang SET is_active = false;

-- Then activate only gelombang 1
UPDATE gelombang SET is_active = true WHERE id = 1;

-- Check result
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- ❓ Question: Apakah berhasil?
-- If YES = Database bisa diupdate, masalah ada di RPC function
-- If NO = Ada constraint/trigger yang mencegah update

-- ============================================================================
-- STEP 11: Re-create RPC Function (Force Fix)
-- ============================================================================
-- Drop existing function
DROP FUNCTION IF EXISTS public.set_gelombang_status(p_id integer);

-- Create new function (SIMPLIFIED VERSION for debugging)
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_gelombang_record record;
    v_result json;
BEGIN
    -- Log untuk debugging
    RAISE NOTICE 'Starting set_gelombang_status with p_id: %', p_id;
    
    -- Step 1: Deactivate ALL gelombang
    UPDATE gelombang
    SET is_active = FALSE
    WHERE id != 0;
    
    RAISE NOTICE 'All gelombang deactivated';
    
    -- Step 2: Activate specified gelombang
    UPDATE gelombang
    SET is_active = TRUE
    WHERE id = p_id
    RETURNING * INTO v_gelombang_record;
    
    -- Check if found
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gelombang dengan ID % tidak ditemukan', p_id;
    END IF;
    
    RAISE NOTICE 'Gelombang ID % activated', p_id;
    
    -- Build result
    v_result := json_build_object(
        'success', true,
        'message', 'Gelombang berhasil diaktifkan',
        'data', row_to_json(v_gelombang_record)
    );
    
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;

-- ============================================================================
-- STEP 12: Test New Function
-- ============================================================================
-- Test activate gelombang 1
SELECT set_gelombang_status(1);
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- Test activate gelombang 3
SELECT set_gelombang_status(3);
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT 
    '✅ FINAL CHECK' as title,
    (SELECT COUNT(*) FROM gelombang) as total_gelombang,
    (SELECT COUNT(*) FROM gelombang WHERE is_active = true) as gelombang_aktif,
    (SELECT nama FROM gelombang WHERE is_active = true) as nama_aktif,
    CASE 
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 1 
        THEN '✅ BENAR: Hanya 1 aktif'
        WHEN (SELECT COUNT(*) FROM gelombang WHERE is_active = true) = 0 
        THEN '❌ ERROR: Tidak ada yang aktif'
        ELSE '❌ ERROR: Ada ' || (SELECT COUNT(*) FROM gelombang WHERE is_active = true) || ' gelombang aktif!'
    END as status
;

-- ============================================================================
-- TROUBLESHOOTING SUMMARY
-- ============================================================================
-- 
-- If RPC function works in SQL Editor but NOT in Admin Panel:
-- 
-- Problem: Frontend JavaScript issue
-- Solution:
-- 1. Open Browser Console (F12) in Admin Panel
-- 2. Click "Jadikan Aktif" button
-- 3. Look for error messages
-- 4. Check Supabase credentials in admin.html (line 1151-1152)
-- 
-- Common Frontend Errors:
-- 1. "Supabase client not initialized"
--    → Check SUPABASE_URL and SUPABASE_ANON_KEY
-- 
-- 2. "function set_gelombang_status does not exist"
--    → Run STEP 11 (re-create function)
-- 
-- 3. "permission denied"
--    → Run grant commands in STEP 11
-- 
-- 4. "Failed to fetch" or CORS error
--    → Check Supabase project settings → API → URL
-- 
-- ============================================================================

