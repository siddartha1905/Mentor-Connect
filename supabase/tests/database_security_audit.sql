-- ==============================================================================
-- MENTOR CONNECT — STAGE 2.2 READ-ONLY DATABASE SECURITY & COMPLIANCE AUDIT
-- Target: Live Supabase PostgreSQL Project (mttocnlnmmtaugzthfih)
-- Mode: STRICTLY READ-ONLY (ZERO INSERT, UPDATE, OR DELETE OPERATIONS)
-- Safe for direct execution in Supabase Dashboard SQL Editor
-- ==============================================================================

CREATE OR REPLACE TEMP VIEW v_audit_checks AS

-- --------------------------------------------------------------------------
-- 1. TABLE ROW LEVEL SECURITY (RLS) STATUS (All 11 Core Tables)
-- Uses LEFT JOIN to ensure any missing table outputs 'FAIL', not omitted
-- --------------------------------------------------------------------------
SELECT 
    '1. Table RLS'::text AS check_category,
    'public.' || req.tablename AS target_object,
    'Table exists with RLS Enabled (true)'::text AS expected_specification,
    CASE 
        WHEN c.relname IS NULL THEN 'MISSING TABLE'
        WHEN c.relrowsecurity THEN 'RLS Enabled (true)'
        ELSE 'RLS Disabled (false)'
    END AS actual_state,
    CASE 
        WHEN c.relname IS NOT NULL AND c.relrowsecurity THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (
    VALUES 
        ('user_roles'), ('students'), ('student_personal_details'), ('student_family_details'),
        ('student_education_details'), ('student_academic_history'), ('subjects'),
        ('student_subject_marks'), ('system_settings'), ('student_edit_overrides'),
        ('profile_submissions')
) AS req(tablename)
LEFT JOIN pg_class c ON c.relname = req.tablename 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public' LIMIT 1)

UNION ALL

-- --------------------------------------------------------------------------
-- 2. PRIVACY DIRECTORY VIEW (security_invoker & Permission Revocation)
-- --------------------------------------------------------------------------
SELECT 
    '2. Directory View'::text AS check_category,
    'student_directory_view (security_invoker)'::text AS target_object,
    'View exists with security_invoker=true'::text AS expected_specification,
    CASE 
        WHEN c.relname IS NULL THEN 'MISSING VIEW'
        WHEN array_to_string(c.reloptions, ', ') LIKE '%security_invoker=true%' THEN 'security_invoker=true'
        ELSE COALESCE(array_to_string(c.reloptions, ', '), 'none')
    END AS actual_state,
    CASE 
        WHEN c.relname IS NOT NULL AND array_to_string(c.reloptions, ', ') LIKE '%security_invoker=true%' THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (SELECT 1) AS _dummy
LEFT JOIN pg_class c ON c.relname = 'student_directory_view'
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public' LIMIT 1)

UNION ALL

SELECT 
    '2. Directory View'::text AS check_category,
    'student_directory_view (anon access)'::text AS target_object,
    'SELECT privilege revoked from anon role (false)'::text AS expected_specification,
    CASE 
        WHEN has_table_privilege('anon', 'public.student_directory_view', 'SELECT') THEN 'SELECT granted to anon (INSECURE)'
        ELSE 'SELECT revoked from anon (false)'
    END AS actual_state,
    CASE 
        WHEN NOT has_table_privilege('anon', 'public.student_directory_view', 'SELECT') THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status

UNION ALL

SELECT 
    '2. Directory View'::text AS check_category,
    'student_directory_view (authenticated access)'::text AS target_object,
    'SELECT privilege granted to authenticated role (true)'::text AS expected_specification,
    CASE 
        WHEN has_table_privilege('authenticated', 'public.student_directory_view', 'SELECT') THEN 'SELECT granted to authenticated (true)'
        ELSE 'SELECT revoked from authenticated (false)'
    END AS actual_state,
    CASE 
        WHEN has_table_privilege('authenticated', 'public.student_directory_view', 'SELECT') THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status

UNION ALL

-- --------------------------------------------------------------------------
-- 3. CORE SECURITY FUNCTIONS (SECURITY DEFINER, search_path, and EXECUTE Grants)
-- Uses LEFT JOIN to ensure any missing function outputs 'FAIL'
-- --------------------------------------------------------------------------
SELECT 
    '3. Security Functions'::text AS check_category,
    'public.' || req.funcname || '()' AS target_object,
    'SECURITY DEFINER with search_path=public'::text AS expected_specification,
    CASE 
        WHEN p.proname IS NULL THEN 'MISSING FUNCTION'
        WHEN p.prosecdef AND array_to_string(p.proconfig, ', ') LIKE '%search_path=public%' 
            THEN 'SECURITY DEFINER with search_path=public'
        WHEN p.prosecdef 
            THEN 'SECURITY DEFINER without search_path setting (INSECURE)'
        ELSE 'INVOKER (prosecdef=false)'
    END AS actual_state,
    CASE 
        WHEN p.proname IS NOT NULL AND p.prosecdef AND array_to_string(p.proconfig, ', ') LIKE '%search_path=public%' 
            THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (
    VALUES 
        ('is_admin'), ('get_my_role'), ('check_student_update_privileges'),
        ('handle_new_auth_user'), ('validate_profile_submission'), ('review_profile_submission')
) AS req(funcname)
LEFT JOIN pg_proc p ON p.proname = req.funcname 
  AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public' LIMIT 1)

UNION ALL

SELECT 
    '3. Security Functions'::text AS check_category,
    'review_profile_submission() execution privilege'::text AS target_object,
    'EXECUTE revoked from anon, granted to authenticated'::text AS expected_specification,
    CASE 
        WHEN has_function_privilege('anon', 'public.review_profile_submission(uuid, text, text)', 'EXECUTE') 
            THEN 'EXECUTE granted to anon (INSECURE)'
        WHEN NOT has_function_privilege('authenticated', 'public.review_profile_submission(uuid, text, text)', 'EXECUTE') 
            THEN 'EXECUTE missing for authenticated'
        ELSE 'EXECUTE revoked from anon, granted to authenticated'
    END AS actual_state,
    CASE 
        WHEN NOT has_function_privilege('anon', 'public.review_profile_submission(uuid, text, text)', 'EXECUTE')
         AND has_function_privilege('authenticated', 'public.review_profile_submission(uuid, text, text)', 'EXECUTE')
            THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status

UNION ALL

-- --------------------------------------------------------------------------
-- 4. SECURITY & AUDIT TRIGGERS (Verification of Enabled State via tgenabled)
-- Ensures triggers are genuinely active (tgenabled = 'O' or 'A'), not disabled ('D')
-- --------------------------------------------------------------------------
SELECT 
    '4. Security Triggers'::text AS check_category,
    req.tgname || ' ON ' || req.schemaname || '.' || req.tablename AS target_object,
    'Trigger Active & Enabled (tgenabled = O)'::text AS expected_specification,
    CASE 
        WHEN tg.tgname IS NULL THEN 'MISSING TRIGGER'
        WHEN tg.tgenabled = 'D' THEN 'DISABLED TRIGGER (tgenabled = D)'
        WHEN tg.tgenabled IN ('O', 'A') THEN 'Trigger Active & Enabled (tgenabled = ' || tg.tgenabled || ')'
        ELSE 'Trigger status: ' || tg.tgenabled
    END AS actual_state,
    CASE 
        WHEN tg.tgname IS NOT NULL AND tg.tgenabled IN ('O', 'A') THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (
    VALUES 
        ('public', 'students', 'trg_check_student_update_privileges'),
        ('public', 'students', 'set_timestamp_students'),
        ('public', 'profile_submissions', 'trg_validate_profile_submission'),
        ('auth', 'users', 'on_auth_user_created')
) AS req(schemaname, tablename, tgname)
LEFT JOIN pg_class c ON c.relname = req.tablename 
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = req.schemaname LIMIT 1)
LEFT JOIN pg_trigger tg ON tg.tgrelid = c.oid 
  AND tg.tgname = req.tgname 
  AND NOT tg.tgisinternal

UNION ALL

-- --------------------------------------------------------------------------
-- 5. STORAGE BUCKET CONFIGURATION (storage.buckets)
-- --------------------------------------------------------------------------
SELECT 
    '5. Storage Bucket'::text AS check_category,
    'storage.buckets: ' || req.bucket_id AS target_object,
    'Private bucket (public=false, file_size_limit=1048576 bytes)'::text AS expected_specification,
    CASE 
        WHEN b.id IS NULL THEN 'MISSING BUCKET'
        ELSE 'public=' || b.public || ', limit=' || COALESCE(b.file_size_limit::text, 'none') || ' bytes'
    END AS actual_state,
    CASE 
        WHEN b.id IS NOT NULL AND b.public = false AND b.file_size_limit = 1048576 THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (VALUES ('profile-photos')) AS req(bucket_id)
LEFT JOIN storage.buckets b ON b.id = req.bucket_id

UNION ALL

-- --------------------------------------------------------------------------
-- 6. ACTUAL RLS POLICY DEFINITIONS & PREDICATES
-- Inspects cmd, roles, qual, and with_check to verify genuine security rules
-- --------------------------------------------------------------------------
SELECT 
    '6. RLS Policy Definitions'::text AS check_category,
    req.schemaname || '.' || req.tablename || ' -> ' || req.polname AS target_object,
    req.expected_desc::text AS expected_specification,
    CASE 
        WHEN pol.policyname IS NULL THEN 'MISSING POLICY'
        ELSE pol.cmd || ' FOR ' || array_to_string(pol.roles, ', ') || 
             ' USING (' || COALESCE(pol.qual, 'none') || ')' ||
             CASE WHEN pol.with_check IS NOT NULL THEN ' WITH CHECK (' || pol.with_check || ')' ELSE '' END
    END AS actual_state,
    CASE 
        WHEN pol.policyname IS NULL THEN 'FAIL'
        WHEN req.polname = 'Admins full access storage' AND pol.cmd = 'ALL' AND pol.qual LIKE '%is_admin%' THEN 'PASS'
        WHEN req.polname = 'Students insert own photo' AND pol.cmd = 'INSERT' AND pol.with_check LIKE '%storage.foldername%' THEN 'PASS'
        WHEN req.polname = 'Students update own photo' AND pol.cmd = 'UPDATE' AND pol.qual LIKE '%storage.foldername%' THEN 'PASS'
        WHEN req.polname = 'Students can view own profile photo' AND pol.cmd = 'SELECT' AND pol.qual LIKE '%storage.foldername%' THEN 'PASS'
        WHEN req.polname = 'Students can view active peers directory info' AND pol.cmd = 'SELECT' AND pol.qual LIKE '%status%Active%' THEN 'PASS'
        WHEN req.polname = 'Students can update own privacy settings' AND pol.cmd = 'UPDATE' AND pol.qual LIKE '%user_id%auth.uid%' THEN 'PASS'
        WHEN req.polname = 'Students insert submissions' AND pol.cmd = 'INSERT' AND pol.with_check LIKE '%auth.uid%' THEN 'PASS'
        WHEN req.polname = 'Users can read own role' AND pol.cmd = 'SELECT' AND (pol.qual LIKE '%auth.uid%' OR pol.qual LIKE '%is_admin%') THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (
    VALUES 
        ('storage', 'objects', 'Admins full access storage', 'cmd=ALL, roles={authenticated}, checks is_admin()'),
        ('storage', 'objects', 'Students insert own photo', 'cmd=INSERT, roles={authenticated}, checks folder=auth.uid()'),
        ('storage', 'objects', 'Students update own photo', 'cmd=UPDATE, roles={authenticated}, checks folder=auth.uid()'),
        ('storage', 'objects', 'Students can view own profile photo', 'cmd=SELECT, roles={authenticated}, checks folder=auth.uid()'),
        ('public', 'students', 'Students can view active peers directory info', 'cmd=SELECT, checks status = Active'),
        ('public', 'students', 'Students can update own privacy settings', 'cmd=UPDATE, checks user_id = auth.uid()'),
        ('public', 'profile_submissions', 'Students insert submissions', 'cmd=INSERT, checks student belongs to auth.uid()'),
        ('public', 'user_roles', 'Users can read own role', 'cmd=SELECT, checks user_id = auth.uid() OR is_admin()')
) AS req(schemaname, tablename, polname, expected_desc)
LEFT JOIN pg_policies pol ON pol.schemaname = req.schemaname 
  AND pol.tablename = req.tablename 
  AND pol.policyname = req.polname

UNION ALL

-- --------------------------------------------------------------------------
-- 7. SYSTEM SETTINGS (Read-Only Inspection of Academic Editing Deadline)
-- --------------------------------------------------------------------------
SELECT 
    '7. System Settings'::text AS check_category,
    'public.system_settings -> profile_edit_deadline'::text AS target_object,
    'Active academic deadline stored as JSONB'::text AS expected_specification,
    CASE 
        WHEN s.key IS NULL THEN 'MISSING SETTING (Key not found)'
        WHEN s.value ? 'deadline' THEN 'Current Deadline: ' || (s.value->>'deadline')
        ELSE 'Invalid JSONB: missing deadline key'
    END AS actual_state,
    CASE 
        WHEN s.key IS NOT NULL AND s.value ? 'deadline' THEN 'PASS'
        ELSE 'FAIL'
    END AS audit_status
FROM (SELECT 1) AS _dummy
LEFT JOIN public.system_settings s ON s.key = 'profile_edit_deadline'

UNION ALL

-- --------------------------------------------------------------------------
-- 8. SEED SUBJECTS VERIFICATION (Flagged as PROVISIONAL pending official syllabus)
-- --------------------------------------------------------------------------
SELECT 
    '8. Seed Subjects'::text AS check_category,
    'public.subjects (CSE-DS Semester 3)'::text AS target_object,
    '7 Provisional Seed Subjects (Pending Official Departmental Syllabus)'::text AS expected_specification,
    CASE 
        WHEN count(*) = 0 THEN 'NO SUBJECTS FOUND'
        ELSE count(*)::text || ' Provisional subjects: ' || string_agg(code, ', ' ORDER BY code)
    END AS actual_state,
    CASE 
        WHEN count(*) = 7 THEN 'PROVISIONAL'
        ELSE 'FAIL'
    END AS audit_status
FROM public.subjects
WHERE department = 'CSE-Data Science' AND semester = 3;

-- ------------------------------------------------------------------------------
-- QUERY 1: Detailed Audit Breakdown
-- ------------------------------------------------------------------------------
SELECT 
    row_number() OVER () AS check_id,
    check_category,
    target_object,
    expected_specification,
    actual_state,
    audit_status
FROM v_audit_checks
ORDER BY check_category, target_object;

-- ------------------------------------------------------------------------------
-- QUERY 2: Compliance Summary Statistics
-- ------------------------------------------------------------------------------
SELECT 
    count(*) AS total_checks,
    count(*) FILTER (WHERE audit_status = 'PASS') AS verified_pass_count,
    count(*) FILTER (WHERE audit_status = 'PROVISIONAL') AS provisional_count,
    count(*) FILTER (WHERE audit_status = 'FAIL') AS failed_count,
    CASE 
        WHEN count(*) FILTER (WHERE audit_status = 'FAIL') = 0 
        THEN 'VERIFIED COMPLIANT (WITH PROVISIONAL SEED DATA) — ZERO MUTATIONS' 
        ELSE 'AUDIT FAILED — REMEDIATION REQUIRED' 
    END AS compliance_verdict
FROM v_audit_checks;
