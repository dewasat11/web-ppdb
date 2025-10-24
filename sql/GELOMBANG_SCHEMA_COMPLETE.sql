-- ========================================
-- FULL SQL SCHEMA FOR GELOMBANG SYSTEM
-- Pondok Pesantren Al Ikhsan Beji
-- ========================================
-- Purpose: Complete database setup for gelombang management
-- Compatible with: admin.html & index.html real-time sync
-- Last Updated: 2025-10-24
-- ========================================

-- ==========================================
-- STEP 1: DROP EXISTING OBJECTS (CLEAN SLATE)
-- ==========================================

-- Drop triggers first (to avoid dependency issues)
DROP TRIGGER IF EXISTS trg_gelombang_updated_at ON public.gelombang;
DROP TRIGGER IF EXISTS set_timestamp_gelombang ON public.gelombang;

-- Drop indexes
DROP INDEX IF EXISTS public.uniq_gelombang_active_true;
DROP INDEX IF EXISTS public.idx_gelombang_is_active;
DROP INDEX IF EXISTS public.idx_gelombang_urutan;
DROP INDEX IF EXISTS public.one_active_gelombang;

-- Drop table (if you want fresh start - CAUTION: deletes all data!)
-- DROP TABLE IF EXISTS public.gelombang CASCADE;

-- ==========================================
-- STEP 2: CREATE UPDATE TIMESTAMP FUNCTION
-- ==========================================

-- Function to automatically update 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 3: CREATE GELOMBANG TABLE
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
  
  -- Primary Key
  CONSTRAINT gelombang_pkey PRIMARY KEY (id),
  
  -- Check Constraints
  CONSTRAINT ck_gelombang_date_range CHECK (start_date <= end_date),
  CONSTRAINT ck_gelombang_status CHECK (status IN ('aktif', 'ditutup', 'segera'))
) TABLESPACE pg_default;

-- ==========================================
-- STEP 4: CREATE INDEXES (NO DUPLICATES)
-- ==========================================

-- Unique index to ensure only ONE gelombang can be active at a time
CREATE UNIQUE INDEX IF NOT EXISTS uniq_gelombang_active_true 
ON public.gelombang USING btree (is_active) 
TABLESPACE pg_default
WHERE (is_active = true);

-- Index for fast queries on is_active column
CREATE INDEX IF NOT EXISTS idx_gelombang_is_active 
ON public.gelombang USING btree (is_active) 
TABLESPACE pg_default;

-- Index for ordering gelombang by urutan
CREATE INDEX IF NOT EXISTS idx_gelombang_urutan 
ON public.gelombang USING btree (urutan) 
TABLESPACE pg_default;

-- ==========================================
-- STEP 5: CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ==========================================

-- Trigger to automatically update 'updated_at' on row update
CREATE TRIGGER trg_gelombang_updated_at
BEFORE UPDATE ON public.gelombang
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- STEP 6: CREATE RPC FUNCTION (ATOMIC GELOMBANG ACTIVATION)
-- ==========================================

-- Function to set gelombang active status (ensures only 1 active at a time)
CREATE OR REPLACE FUNCTION public.set_gelombang_status(p_id integer)
RETURNS json AS $$
DECLARE
  v_result json;
  v_gelombang_exists boolean;
  v_affected_rows integer;
BEGIN
  -- Check if the gelombang ID exists
  SELECT EXISTS(SELECT 1 FROM public.gelombang WHERE id = p_id) INTO v_gelombang_exists;
  
  IF NOT v_gelombang_exists THEN
    -- Return error if gelombang not found
    RETURN json_build_object(
      'ok', false,
      'message', 'Gelombang dengan ID ' || p_id || ' tidak ditemukan',
      'active_id', NULL
    );
  END IF;
  
  -- ATOMIC OPERATION: Deactivate all gelombang first
  UPDATE public.gelombang 
  SET 
    is_active = false,
    status = 'ditutup',
    updated_at = NOW()
  WHERE is_active = true;
  
  -- Activate the selected gelombang
  UPDATE public.gelombang 
  SET 
    is_active = true,
    status = 'aktif',
    updated_at = NOW()
  WHERE id = p_id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  -- Return success response
  RETURN json_build_object(
    'ok', true,
    'message', 'Gelombang ' || p_id || ' berhasil diaktifkan',
    'active_id', p_id,
    'affected_rows', v_affected_rows
  );
  
EXCEPTION
  WHEN unique_violation THEN
    -- Handle unique constraint violation (shouldn't happen with our logic, but safety first)
    RETURN json_build_object(
      'ok', false,
      'message', 'Terjadi konflik: Sudah ada gelombang aktif lain',
      'active_id', NULL
    );
  WHEN OTHERS THEN
    -- Handle any other errors
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

-- Grant SELECT permission to anonymous users (for public access)
GRANT SELECT ON public.gelombang TO anon;
GRANT SELECT ON public.gelombang TO authenticated;

-- Grant full access to service role (for admin operations)
GRANT ALL ON public.gelombang TO service_role;

-- Grant EXECUTE permission for RPC function
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(integer) TO service_role;

-- ==========================================
-- STEP 8: INSERT DEFAULT DATA (IF TABLE IS EMPTY)
-- ==========================================

-- Insert 3 gelombang if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.gelombang LIMIT 1) THEN
    INSERT INTO public.gelombang (nama, start_date, end_date, tahun_ajaran, is_active, urutan, status)
    VALUES 
      ('Gelombang 1', '2025-10-24', '2025-11-30', '2026/2027', true, 1, 'aktif'),
      ('Gelombang 2', '2025-12-01', '2026-01-31', '2026/2027', false, 2, 'segera'),
      ('Gelombang 3', '2026-02-01', '2026-03-31', '2026/2027', false, 3, 'ditutup');
    
    RAISE NOTICE 'Default gelombang data inserted successfully';
  ELSE
    RAISE NOTICE 'Gelombang table already contains data, skipping insert';
  END IF;
END $$;

-- ==========================================
-- STEP 9: ENABLE ROW LEVEL SECURITY (RLS) - OPTIONAL
-- ==========================================

-- Safe RLS setup with error handling
DO $$
BEGIN
  -- Enable RLS for added security
  ALTER TABLE public.gelombang ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies (ignore errors if they don't exist)
  BEGIN
    DROP POLICY IF EXISTS "Allow public read access to gelombang" ON public.gelombang;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Allow public read access to gelombang" does not exist, skipping drop';
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to update gelombang" ON public.gelombang;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Allow authenticated users to update gelombang" does not exist, skipping drop';
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow service_role full access to gelombang" ON public.gelombang;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Allow service_role full access to gelombang" does not exist, skipping drop';
  END;
  
  -- Create policies
  CREATE POLICY "Allow public read access to gelombang"
  ON public.gelombang
  FOR SELECT
  TO public
  USING (true);
  
  CREATE POLICY "Allow authenticated users to update gelombang"
  ON public.gelombang
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
  
  CREATE POLICY "Allow service_role full access to gelombang"
  ON public.gelombang
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
  
  RAISE NOTICE 'RLS policies created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating RLS policies: %', SQLERRM;
END $$;

-- ==========================================
-- STEP 10: VERIFICATION QUERIES
-- ==========================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gelombang'
ORDER BY ordinal_position;

-- Check current gelombang data
SELECT 
  id,
  nama,
  start_date,
  end_date,
  tahun_ajaran,
  is_active,
  status,
  urutan,
  created_at,
  updated_at
FROM public.gelombang
ORDER BY urutan;

-- Check active gelombang
SELECT 
  id,
  nama,
  is_active,
  status
FROM public.gelombang
WHERE is_active = true;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'gelombang' AND schemaname = 'public';

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'gelombang' AND event_object_schema = 'public';

-- ==========================================
-- STEP 11: TEST RPC FUNCTION
-- ==========================================

-- Test activating Gelombang 2
SELECT public.set_gelombang_status(2);

-- Verify result
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;

-- Test activating Gelombang 1 again
SELECT public.set_gelombang_status(1);

-- Verify result
SELECT id, nama, is_active, status FROM public.gelombang ORDER BY urutan;

-- ==========================================
-- SUCCESS! 
-- ==========================================
-- Your gelombang system is now ready!
-- 
-- Next steps:
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
-- 4. Check verification queries at the end
-- 5. Test admin.html and index.html sync
-- 
-- Expected behavior:
-- ✅ Only ONE gelombang can be active at a time
-- ✅ Admin can switch active gelombang (1/2/3)
-- ✅ Changes sync in real-time to index.html
-- ✅ Database enforces constraints automatically
-- ========================================

