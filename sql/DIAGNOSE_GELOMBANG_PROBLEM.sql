-- ============================================================================
-- DIAGNOSE: Kenapa Gelombang 3 Selalu Aktif?
-- Run this FIRST to identify the root cause
-- ============================================================================

-- ============================================================================
-- CHECK 1: Current State
-- ============================================================================
SELECT '===== CHECK 1: CURRENT STATE =====' AS info;
SELECT 
  id, 
  nama, 
  is_active,
  CASE WHEN is_active THEN '✓ ACTIVE' ELSE 'Inactive' END AS status,
  start_date,
  end_date,
  updated_at
FROM gelombang
ORDER BY id;

-- ============================================================================
-- CHECK 2: Constraints (Ini yang bikin stuck!)
-- ============================================================================
SELECT '===== CHECK 2: CONSTRAINTS =====' AS info;
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.gelombang'::regclass
ORDER BY conname;

-- Expected: Seharusnya TIDAK ada constraint yang enforce Gelombang 3
-- If you see: CHECK (is_active = true WHERE id = 3) ← INI MASALAHNYA!

-- ============================================================================
-- CHECK 3: Triggers (Yang auto-set Gelombang 3)
-- ============================================================================
SELECT '===== CHECK 3: TRIGGERS =====' AS info;
SELECT 
    trigger_name,
    event_manipulation AS event,
    event_object_table AS table_name,
    action_statement AS action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'gelombang'
ORDER BY trigger_name;

-- Expected: Seharusnya KOSONG atau hanya audit triggers
-- If you see: enforce_one_active_gelombang ← INI MASALAHNYA!

-- ============================================================================
-- CHECK 4: RLS Policies (Bisa block UPDATE)
-- ============================================================================
SELECT '===== CHECK 4: RLS POLICIES =====' AS info;
SELECT 
    policyname AS policy_name,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'gelombang'
ORDER BY policyname;

-- Expected: Should allow UPDATE for all roles
-- If restrictive policy exists → Bisa block update

-- ============================================================================
-- CHECK 5: Default Value
-- ============================================================================
SELECT '===== CHECK 5: COLUMN DEFAULTS =====' AS info;
SELECT 
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gelombang'
  AND column_name = 'is_active';

-- Expected: column_default should be false or NULL
-- If: column_default = true WHERE id = 3 ← MASALAH!

-- ============================================================================
-- CHECK 6: Permissions
-- ============================================================================
SELECT '===== CHECK 6: TABLE PERMISSIONS =====' AS info;
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'gelombang'
  AND privilege_type IN ('SELECT', 'UPDATE', 'INSERT', 'DELETE')
ORDER BY grantee, privilege_type;

-- Expected: service_role should have UPDATE
-- If missing UPDATE → API call will fail

-- ============================================================================
-- CHECK 7: RPC Function Exists?
-- ============================================================================
SELECT '===== CHECK 7: RPC FUNCTION =====' AS info;
SELECT 
    routine_name AS function_name,
    routine_type AS type,
    security_type,
    routine_definition AS definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'set_gelombang_status'
ORDER BY routine_name;

-- Expected: Function should exist with SECURITY DEFINER
-- If empty → Function doesn't exist

-- ============================================================================
-- CHECK 8: RPC Function Permissions
-- ============================================================================
SELECT '===== CHECK 8: RPC PERMISSIONS =====' AS info;
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'set_gelombang_status'
ORDER BY grantee;

-- Expected: anon, authenticated, service_role should have EXECUTE
-- If missing → Frontend can't call RPC

-- ============================================================================
-- CHECK 9: Test Manual Update (Should Work)
-- ============================================================================
SELECT '===== CHECK 9: MANUAL UPDATE TEST =====' AS info;

-- Try to update Gelombang 1 to active
UPDATE gelombang 
SET is_active = true 
WHERE id = 1;

-- Check result
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- If Gelombang 3 STILL active after this → CONSTRAINT or TRIGGER problem!

-- ============================================================================
-- CHECK 10: Test RPC Function (If Exists)
-- ============================================================================
SELECT '===== CHECK 10: RPC FUNCTION TEST =====' AS info;

-- Test calling RPC
SELECT set_gelombang_status(1) AS rpc_result;

-- Check result
SELECT id, nama, is_active FROM gelombang ORDER BY id;

-- If error → RPC function broken
-- If Gelombang 3 STILL active → RPC function logic wrong

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '===== DIAGNOSTIC SUMMARY =====' AS info;

SELECT 
  'Total Gelombang' AS metric,
  COUNT(*) AS value
FROM gelombang;

SELECT 
  'Active Count' AS metric,
  COUNT(*) AS value
FROM gelombang
WHERE is_active = true;

SELECT 
  'Active Gelombang' AS metric,
  string_agg(nama, ', ') AS value
FROM gelombang
WHERE is_active = true;

SELECT 
  'Expected Active' AS metric,
  'Should be 1, can be any of: Gelombang 1, 2, or 3' AS value;

-- ============================================================================
-- INTERPRETATION
-- ============================================================================

/*
BASED ON RESULTS ABOVE:

✅ GOOD:
- Total gelombang = 3
- Active count = 1
- Can update manually
- RPC function exists and works
- Permissions granted

❌ PROBLEMS TO LOOK FOR:

CHECK 2 (Constraints):
  - If you see: unique_active_gelombang
  - If you see: CHECK constraint on is_active
  → Run: ALTER TABLE gelombang DROP CONSTRAINT [name];

CHECK 3 (Triggers):
  - If you see: enforce_one_active_gelombang
  - If you see: Any trigger on gelombang table
  → Run: DROP TRIGGER [name] ON gelombang;

CHECK 4 (RLS):
  - If policy restricts UPDATE
  - If no policy allows all operations
  → Run: CREATE POLICY "Allow all" ... (see FIX_GELOMBANG_COMPLETE.sql)

CHECK 9 (Manual Update):
  - If Gelombang 3 STILL active after UPDATE
  → Constraint or Trigger is blocking it
  → Must drop constraint/trigger first

CHECK 10 (RPC Test):
  - If error returned
  → RPC function broken
  → Recreate using FIX_GELOMBANG_COMPLETE.sql
  
  - If Gelombang 3 STILL active
  → RPC logic wrong
  → Recreate using FIX_GELOMBANG_COMPLETE.sql

NEXT STEPS:
1. Review results above
2. Identify which CHECK failed
3. Run FIX_GELOMBANG_COMPLETE.sql to fix all issues
4. Re-run this diagnostic to verify fix
*/

-- ============================================================================
-- QUICK FIX (If you found the problem)
-- ============================================================================

/*
If CHECK 2 found bad constraint:
  ALTER TABLE gelombang DROP CONSTRAINT [constraint_name];

If CHECK 3 found bad trigger:
  DROP TRIGGER [trigger_name] ON gelombang;

If CHECK 4 has restrictive policy:
  DROP POLICY [policy_name] ON gelombang;
  CREATE POLICY "Allow all" ON gelombang FOR ALL USING (true);

If RPC function broken:
  Run: sql/FIX_GELOMBANG_COMPLETE.sql (Full fix)

Then test again:
  SELECT set_gelombang_status(1);
  SELECT id, nama, is_active FROM gelombang ORDER BY id;
*/

SELECT '✅ DIAGNOSTIC COMPLETE' AS status;
SELECT 'Review results above to identify the problem' AS next_step;
SELECT 'Then run: sql/FIX_GELOMBANG_COMPLETE.sql' AS solution;

