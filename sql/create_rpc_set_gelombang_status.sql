-- ============================================================================
-- CREATE RPC FUNCTION: set_gelombang_status
-- Purpose: Set ONLY ONE gelombang as active, deactivate all others
-- ============================================================================
-- 
-- Problem: Gelombang 1 selalu aktif meskipun admin sudah pilih gelombang lain
-- Solution: Create atomic RPC function to ensure only one gelombang is active
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.set_gelombang_status(p_id integer);

-- Create the RPC function
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_gelombang_record record;
    v_result json;
    v_column_exists boolean;
BEGIN
    -- Check if 'status' column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gelombang' 
        AND column_name = 'status'
    ) INTO v_column_exists;
    
    -- Step 1: Deactivate ALL gelombang (atomic)
    IF v_column_exists THEN
        -- Update with status column
        UPDATE gelombang
        SET 
            is_active = FALSE,
            status = 'ditutup',
            updated_at = NOW()
        WHERE id != 0;  -- Update all rows
    ELSE
        -- Update without status column
        UPDATE gelombang
        SET 
            is_active = FALSE,
            updated_at = NOW()
        WHERE id != 0;  -- Update all rows
    END IF;
    
    RAISE NOTICE 'All gelombang deactivated';
    
    -- Step 2: Activate the specified gelombang
    IF v_column_exists THEN
        -- Update with status column
        UPDATE gelombang
        SET 
            is_active = TRUE,
            status = 'aktif',
            updated_at = NOW()
        WHERE id = p_id
        RETURNING * INTO v_gelombang_record;
    ELSE
        -- Update without status column
        UPDATE gelombang
        SET 
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = p_id
        RETURNING * INTO v_gelombang_record;
    END IF;
    
    -- Check if gelombang was found
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gelombang dengan ID % tidak ditemukan', p_id;
    END IF;
    
    RAISE NOTICE 'Gelombang ID % activated: %', p_id, v_gelombang_record.nama;
    
    -- Build result JSON
    v_result := json_build_object(
        'success', true,
        'message', 'Gelombang berhasil diaktifkan',
        'data', row_to_json(v_gelombang_record)
    );
    
    -- Log final state for debugging
    RAISE NOTICE 'Final state: %', (
        SELECT json_agg(json_build_object(
            'id', id, 
            'nama', nama, 
            'is_active', is_active
        ))
        FROM gelombang
        ORDER BY id
    );
    
    RETURN v_result;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS to all roles
-- ============================================================================

-- Grant execute permission to anon role (public access)
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;

-- Grant execute permission to service_role (admin)
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;

-- ============================================================================
-- TESTING: Verify the function works
-- ============================================================================

-- Test 1: Activate gelombang 1
SELECT set_gelombang_status(1);

-- Test 2: Check current state
SELECT id, nama, is_active, status, updated_at 
FROM gelombang 
ORDER BY id;

-- Test 3: Activate gelombang 2
SELECT set_gelombang_status(2);

-- Test 4: Check state again (should show only gelombang 2 as active)
SELECT id, nama, is_active, status, updated_at 
FROM gelombang 
ORDER BY id;

-- Test 5: Activate gelombang 3
SELECT set_gelombang_status(3);

-- Test 6: Final check (should show only gelombang 3 as active)
SELECT id, nama, is_active, status, updated_at 
FROM gelombang 
ORDER BY id;

-- ============================================================================
-- Expected result after Test 6:
-- ============================================================================
-- id | nama        | is_active | status  | updated_at
-- ---|-------------|-----------|---------|-------------------
--  1 | Gelombang 1 | false     | ditutup | 2025-10-24 ...
--  2 | Gelombang 2 | false     | ditutup | 2025-10-24 ...
--  3 | Gelombang 3 | true      | aktif   | 2025-10-24 ... (MOST RECENT)
-- ============================================================================

-- ============================================================================
-- VERIFY PERMISSIONS
-- ============================================================================
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'set_gelombang_status'
ORDER BY grantee, privilege_type;

-- Expected output:
-- routine_name          | grantee        | privilege_type
-- ----------------------|----------------|---------------
-- set_gelombang_status  | anon           | EXECUTE
-- set_gelombang_status  | authenticated  | EXECUTE
-- set_gelombang_status  | service_role   | EXECUTE

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Function is ATOMIC: Both deactivate and activate happen in single transaction
-- 2. If function fails, ALL changes are rolled back
-- 3. SECURITY DEFINER: Function runs with creator's permissions (bypasses RLS)
-- 4. Returns JSON with success status and activated gelombang data
-- 5. Includes debug NOTICES visible in Supabase SQL Editor logs
--
-- ============================================================================

