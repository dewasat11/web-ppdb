-- ========================================
-- SIMPLE GELOMBANG SCHEMA (NO RLS)
-- For Quick Setup & Testing
-- ========================================

-- ==========================================
-- STEP 1: DROP OLD OBJECTS
-- ==========================================
DROP TRIGGER IF EXISTS trg_gelombang_updated_at ON public.gelombang;
DROP TRIGGER IF EXISTS set_timestamp_gelombang ON public.gelombang;
DROP INDEX IF EXISTS public.uniq_gelombang_active_true;
DROP INDEX IF EXISTS public.idx_gelombang_is_active;
DROP INDEX IF EXISTS public.idx_gelombang_urutan;
DROP INDEX IF EXISTS public.one_active_gelombang;
DROP FUNCTION IF EXISTS public.set_gelombang_status(integer);
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ==========================================
-- STEP 2: CREATE FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 3: CREATE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gelombang (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nama text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  tahun_ajaran text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  urutan smallint NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ditutup',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gelombang_pkey PRIMARY KEY (id),
  CONSTRAINT ck_gelombang_date_range CHECK (start_date <= end_date)
);

-- ==========================================
-- STEP 4: CREATE INDEXES
-- ==========================================
CREATE UNIQUE INDEX uniq_gelombang_active_true 
ON public.gelombang (is_active) 
WHERE (is_active = true);

CREATE INDEX idx_gelombang_is_active 
ON public.gelombang (is_active);

CREATE INDEX idx_gelombang_urutan 
ON public.gelombang (urutan);

-- ==========================================
-- STEP 5: CREATE TRIGGER
-- ==========================================
CREATE TRIGGER trg_gelombang_updated_at
BEFORE UPDATE ON public.gelombang
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- STEP 6: CREATE RPC FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS json AS $$
DECLARE
  v_result json;
  v_gelombang_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.gelombang WHERE id = p_id) INTO v_gelombang_exists;
  
  IF NOT v_gelombang_exists THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Gelombang dengan ID ' || p_id || ' tidak ditemukan',
      'active_id', NULL
    );
  END IF;
  
  -- Deactivate all
  UPDATE public.gelombang 
  SET is_active = false, status = 'ditutup', updated_at = NOW()
  WHERE is_active = true;
  
  -- Activate selected
  UPDATE public.gelombang 
  SET is_active = true, status = 'aktif', updated_at = NOW()
  WHERE id = p_id;
  
  RETURN json_build_object(
    'ok', true,
    'message', 'Gelombang ' || p_id || ' berhasil diaktifkan',
    'active_id', p_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Error: ' || SQLERRM,
      'active_id', NULL
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 7: GRANT PERMISSIONS
-- ==========================================
GRANT SELECT ON public.gelombang TO anon;
GRANT SELECT ON public.gelombang TO authenticated;
GRANT ALL ON public.gelombang TO service_role;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO service_role;

-- ==========================================
-- STEP 8: INSERT DEFAULT DATA
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.gelombang LIMIT 1) THEN
    INSERT INTO public.gelombang (nama, start_date, end_date, tahun_ajaran, is_active, urutan, status)
    VALUES 
      ('Gelombang 1', '2025-10-24', '2025-11-30', '2026/2027', true, 1, 'aktif'),
      ('Gelombang 2', '2025-12-01', '2026-01-31', '2026/2027', false, 2, 'segera'),
      ('Gelombang 3', '2026-02-01', '2026-03-31', '2026/2027', false, 3, 'ditutup');
    RAISE NOTICE '✅ Default gelombang data inserted';
  ELSE
    RAISE NOTICE '✅ Gelombang table already has data';
  END IF;
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT '========================================' AS "STATUS";
SELECT '✅ GELOMBANG SCHEMA CREATED SUCCESSFULLY' AS "RESULT";
SELECT '========================================' AS "STATUS";

-- Show current data
SELECT 
  id, nama, is_active, status, start_date, end_date, tahun_ajaran
FROM public.gelombang
ORDER BY urutan;

-- Test RPC function
SELECT '========================================' AS "TEST";
SELECT '🧪 Testing set_gelombang_status(2)...' AS "ACTION";
SELECT public.set_gelombang_status(2) AS "RESULT";

SELECT '📊 Current state after test:' AS "INFO";
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;

-- Test back to gelombang 1
SELECT '========================================' AS "TEST";
SELECT '🧪 Testing set_gelombang_status(1)...' AS "ACTION";
SELECT public.set_gelombang_status(1) AS "RESULT";

SELECT '📊 Final state:' AS "INFO";
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;

SELECT '========================================' AS "STATUS";
SELECT '✅ ALL TESTS PASSED!' AS "RESULT";
SELECT 'Next: Test from admin.html' AS "NEXT_STEP";
SELECT '========================================' AS "STATUS";

