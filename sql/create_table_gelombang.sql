-- ============================================================================
-- CREATE TABLE: gelombang (Gelombang Pendaftaran)
-- Pondok Pesantren Al Ikhsan Beji - PPDSB System
-- ============================================================================
-- 
-- Purpose: Manage registration waves/periods (gelombang pendaftaran)
-- Features: Support multiple gelombang with ONLY ONE active at a time
--
-- Run this in Supabase SQL Editor (if table doesn't exist yet)
-- ============================================================================

-- Create table gelombang
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

-- Add comments
COMMENT ON TABLE gelombang IS 'Tabel gelombang pendaftaran santri baru';
COMMENT ON COLUMN gelombang.nama IS 'Nama gelombang (e.g., Gelombang 1, Gelombang 2)';
COMMENT ON COLUMN gelombang.is_active IS 'Status aktif: HANYA SATU gelombang yang boleh aktif';
COMMENT ON COLUMN gelombang.urutan IS 'Urutan tampilan gelombang (ascending)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gelombang_is_active ON gelombang(is_active);
CREATE INDEX IF NOT EXISTS idx_gelombang_urutan ON gelombang(urutan);

-- ============================================================================
-- INSERT SAMPLE DATA (3 gelombang)
-- ============================================================================

-- Insert only if table is empty
INSERT INTO gelombang (nama, start_date, end_date, tahun_ajaran, is_active, urutan)
SELECT * FROM (
    VALUES 
        ('Gelombang 1', '2025-10-23', '2025-11-30', '2025/2026', true, 1),
        ('Gelombang 2', '2025-12-01', '2026-01-31', '2025/2026', false, 2),
        ('Gelombang 3', '2026-02-01', '2026-03-31', '2025/2026', false, 3)
) AS v(nama, start_date, end_date, tahun_ajaran, is_active, urutan)
WHERE NOT EXISTS (SELECT 1 FROM gelombang LIMIT 1);

-- ============================================================================
-- VERIFY DATA
-- ============================================================================

SELECT * FROM gelombang ORDER BY urutan;

-- Expected output:
-- id | nama        | start_date | end_date   | tahun_ajaran | is_active | urutan
-- ---|-------------|------------|------------|--------------|-----------|-------
--  1 | Gelombang 1 | 2025-10-23 | 2025-11-30 | 2025/2026    | true      | 1
--  2 | Gelombang 2 | 2025-12-01 | 2026-01-31 | 2025/2026    | false     | 2
--  3 | Gelombang 3 | 2026-02-01 | 2026-03-31 | 2025/2026    | false     | 3

-- ============================================================================
-- Enable RLS (Row Level Security) - OPTIONAL
-- ============================================================================

-- Enable RLS
ALTER TABLE gelombang ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read gelombang data
CREATE POLICY "Enable read access for all users" ON gelombang
    FOR SELECT USING (true);

-- Policy: Only service_role can insert/update/delete
CREATE POLICY "Enable write for service role only" ON gelombang
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Table gelombang stores registration waves/periods
-- 2. Only ONE gelombang should be active at a time (enforced by RPC function)
-- 3. Use RPC function set_gelombang_status(id) to change active gelombang
-- 4. Frontend displays active gelombang on public homepage
-- 5. Admin can manage gelombang dates and activate them
--
-- ============================================================================

