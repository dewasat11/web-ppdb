-- ================================================================
-- GRANT EXECUTE PERMISSION FOR RPC FUNCTION
-- ================================================================
-- 
-- Problem: Anon role cannot execute RPC function by default
-- Solution: Grant execute permission to anon and authenticated roles
--
-- Run this in Supabase SQL Editor
-- ================================================================

-- Grant execute permission to anon role (public access)
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;

-- Grant execute permission to service_role (admin)
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO service_role;

-- Verify permissions
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

