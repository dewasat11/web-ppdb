-- ============================================================
-- 🚨 WAJIB JALANKAN SQL INI DI SUPABASE SQL EDITOR! 🚨
-- ============================================================
-- CARA: 
-- 1. Copy SEMUA SQL di bawah ini
-- 2. Buka Supabase Dashboard → SQL Editor
-- 3. Paste di SQL Editor
-- 4. Klik "Run" (atau Ctrl+Enter)
-- ============================================================

-- STEP 1: Drop semua duplicate functions
DROP FUNCTION IF EXISTS public.set_gelombang_status(integer);
DROP FUNCTION IF EXISTS public.set_gelombang_status(smallint);
DROP FUNCTION IF EXISTS public.set_gelombang_status(bigint);

-- STEP 2: Create function dengan JSONB (BUKAN JSON!)
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS jsonb AS $$
DECLARE
  v_gelombang_exists boolean;
  v_gelombang_nama text;
BEGIN
  -- Check if gelombang exists
  SELECT EXISTS(SELECT 1 FROM public.gelombang WHERE id = p_id) INTO v_gelombang_exists;
  
  IF NOT v_gelombang_exists THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Gelombang dengan ID ' || p_id || ' tidak ditemukan',
      'active_id', NULL
    );
  END IF;
  
  -- Get gelombang name
  SELECT nama INTO v_gelombang_nama FROM public.gelombang WHERE id = p_id;
  
  -- ATOMIC: Deactivate all first
  UPDATE public.gelombang 
  SET is_active = false, status = 'ditutup', updated_at = NOW()
  WHERE is_active = true;
  
  -- Then activate selected one
  UPDATE public.gelombang 
  SET is_active = true, status = 'aktif', updated_at = NOW()
  WHERE id = p_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'ok', true,
    'message', v_gelombang_nama || ' berhasil diaktifkan',
    'active_id', p_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Error: ' || SQLERRM,
      'active_id', NULL
    );
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO service_role;

-- ============================================================
-- ✅ VERIFICATION QUERIES (auto-run setelah CREATE FUNCTION)
-- ============================================================

-- Verify function signature (MUST BE JSONB!)
SELECT 
  proname as "Function Name",
  pg_get_function_identity_arguments(oid) as "Arguments",
  pg_get_function_result(oid) as "Return Type"
FROM pg_proc 
WHERE proname = 'set_gelombang_status';

-- Expected output:
-- Function Name        | Arguments   | Return Type
-- ---------------------|-------------|-------------
-- set_gelombang_status | p_id integer| jsonb       ← MUST BE "jsonb"!!!

-- Test function with Gelombang 1
SELECT public.set_gelombang_status(1) as result;

-- Expected output:
-- {"ok": true, "message": "Gelombang 1 berhasil diaktifkan", "active_id": 1}

-- Verify gelombang state
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;

-- ============================================================
-- ✅ SELESAI! Setelah jalankan SQL ini:
-- 1. Git push code yang sudah diperbaiki
-- 2. Tunggu Vercel deploy (2-3 menit)
-- 3. Hard refresh browser (Ctrl+Shift+R)
-- 4. Test aktivasi gelombang
-- 5. Notifikasi hijau "Berhasil" harus muncul!
-- ============================================================

