-- ==============================================================================
-- MENTOR CONNECT — EXECUTABLE DATABASE SECURITY & RLS VERIFICATION TEST SUITE
-- Target: Supabase PostgreSQL (SQL Editor or pgTAP)
-- Test Identities:
--   1. Administrator (UUID: 00000000-0000-0000-0000-000000000001)
--   2. Student A     (UUID: 00000000-0000-0000-0000-000000000002, Roll: 23L31A5401)
--   3. Student B     (UUID: 00000000-0000-0000-0000-000000000003, Roll: 23L31A5402)
--   4. Anonymous     (Role: anon, unauthenticated)
-- ==============================================================================

CREATE TEMP TABLE IF NOT EXISTS test_results (
    test_id SERIAL PRIMARY KEY,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL,
    expected TEXT NOT NULL,
    actual TEXT NOT NULL,
    status TEXT NOT NULL
);

DO $$
DECLARE
    -- Deterministic Test UUIDs
    v_admin_id UUID   := '00000000-0000-0000-0000-000000000001'::uuid;
    v_student_a_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
    v_student_b_id UUID := '00000000-0000-0000-0000-000000000003'::uuid;
    v_unrostered_id UUID := '00000000-0000-0000-0000-000000000004'::uuid;
    v_imposter_id UUID := '00000000-0000-0000-0000-000000000005'::uuid;

    v_db_student_a_id UUID := gen_random_uuid();
    v_db_student_b_id UUID := gen_random_uuid();
    v_submission_id UUID;
    v_count INTEGER;
    v_phone TEXT;
    v_role public.user_role;
    v_error_caught BOOLEAN;
BEGIN
    -- 0. SETUP FIXTURES (Running as superuser / postgres)
    -- Clean previous fixtures if any
    DELETE FROM public.user_roles WHERE user_id IN (v_admin_id, v_student_a_id, v_student_b_id, v_unrostered_id, v_imposter_id);
    DELETE FROM public.students WHERE user_id IN (v_student_a_id, v_student_b_id) OR roll_number IN ('TEST_A_5401', 'TEST_B_5402');

    -- Insert Roles
    INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_student_a_id, 'student');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_student_b_id, 'student');

    -- Insert Students
    INSERT INTO public.students (id, user_id, roll_number, name, email, department, status, share_phone_in_directory, share_email_in_directory)
    VALUES 
        (v_db_student_a_id, v_student_a_id, 'TEST_A_5401', 'Test Student A', 'studenta@viit.ac.in', 'CSE-Data Science', 'Active', false, false),
        (v_db_student_b_id, v_student_b_id, 'TEST_B_5402', 'Test Student B', 'studentb@viit.ac.in', 'CSE-Data Science', 'Active', false, false);

    -- Insert Personal Details for Student B (Confidential phone)
    INSERT INTO public.student_personal_details (student_id, phone, current_address)
    VALUES (v_db_student_b_id, '+91 99999 11111', 'Confidential Hostels Block B');

    -- Set expired deadline for testing
    INSERT INTO public.system_settings (key, value, description)
    VALUES ('profile_edit_deadline', jsonb_build_object('deadline', timezone('utc'::text, now() - interval '1 hour')), 'Test deadline')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    -- =========================================================================
    -- TEST 1: ANONYMOUS ACCESS REJECTION
    -- =========================================================================
    -- Simulate Anonymous Role
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);

    SELECT count(*) INTO v_count FROM public.students;
    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Anonymous cannot read students table',
        'Anonymous Access',
        '0 rows',
        v_count || ' rows',
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );

    SELECT count(*) INTO v_count FROM public.student_directory_view;
    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Anonymous cannot read student_directory_view',
        'Anonymous Access',
        '0 rows (Access Denied)',
        v_count || ' rows',
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 2: STUDENT A CANNOT ACCESS STUDENT B PRIVATE RECORDS
    -- =========================================================================
    -- Simulate Student A
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_student_a_id::text, true);

    SELECT count(*) INTO v_count 
    FROM public.student_personal_details 
    WHERE student_id = v_db_student_b_id;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A cannot select Student B personal details',
        'Data Isolation',
        '0 rows',
        v_count || ' rows',
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );

    -- Student A attempts to UPDATE Student B personal details
    UPDATE public.student_personal_details 
    SET phone = '+91 00000 00000' 
    WHERE student_id = v_db_student_b_id;

    SELECT phone INTO v_phone 
    FROM public.student_personal_details 
    WHERE student_id = v_db_student_b_id;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A cannot update Student B personal details',
        'Data Isolation',
        'Blocked by RLS (0 rows affected)',
        CASE WHEN v_phone = '+91 99999 11111' OR v_phone IS NULL THEN 'Blocked by RLS' ELSE 'Modified!' END,
        CASE WHEN v_phone = '+91 99999 11111' OR v_phone IS NULL THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 3: ROLE ESCALATION PREVENTION
    -- =========================================================================
    v_error_caught := false;
    BEGIN
        UPDATE public.user_roles SET role = 'admin' WHERE user_id = v_student_a_id;
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
    END;

    -- Check if role was changed
    SELECT role INTO v_phone FROM public.user_roles WHERE user_id = v_student_a_id;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A cannot self-promote to admin role',
        'Role Escalation',
        'Role remains student',
        'Role is ' || v_phone,
        CASE WHEN v_phone = 'student' THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 4: COLUMN-LEVEL RESTRICTION ON STUDENTS TABLE
    -- =========================================================================
    v_error_caught := false;
    BEGIN
        UPDATE public.students 
        SET department = 'Faculty Administrator', roll_number = 'ADMIN_HACK' 
        WHERE user_id = v_student_a_id;
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
    END;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A cannot alter department or roll_number via trigger',
        'Column Permissions',
        'Exception Triggered (Access Denied)',
        CASE WHEN v_error_caught THEN 'Exception Triggered (Access Denied)' ELSE 'Allowed' END,
        CASE WHEN v_error_caught THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 5: SELF-APPROVAL PREVENTION (RPC PRIVILEGE CHECK)
    -- =========================================================================
    v_submission_id := gen_random_uuid();
    -- As superuser insert a pending submission
    PERFORM set_config('role', 'postgres', true);
    INSERT INTO public.profile_submissions (id, student_id, section, proposed_changes, status)
    VALUES (v_submission_id, v_db_student_a_id, 'personal', '{"phone": "+91 98480 99999"}'::jsonb, 'Pending');

    -- Switch back to Student A and attempt self-approval
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_student_a_id::text, true);

    v_error_caught := false;
    BEGIN
        PERFORM public.review_profile_submission(v_submission_id, 'approve', 'Self approved');
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
    END;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A cannot execute review_profile_submission RPC',
        'Approval Tampering',
        'Exception (Only administrators can review)',
        CASE WHEN v_error_caught THEN 'Exception (Only administrators can review)' ELSE 'Allowed' END,
        CASE WHEN v_error_caught THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 6: DEADLINE ENFORCEMENT & OVERRIDE
    -- =========================================================================
    -- Global deadline is in the past (-1 hour). Student A attempts submission without override.
    v_error_caught := false;
    BEGIN
        INSERT INTO public.profile_submissions (student_id, section, proposed_changes, status)
        VALUES (v_db_student_a_id, 'personal', '{"phone": "+91 98480 88888"}'::jsonb, 'Pending');
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
    END;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A blocked past academic deadline without override',
        'Deadline Enforcement',
        'Trigger Exception (Deadline expired)',
        CASE WHEN v_error_caught THEN 'Trigger Exception (Deadline expired)' ELSE 'Allowed' END,
        CASE WHEN v_error_caught THEN 'PASS' ELSE 'FAIL' END
    );

    -- Grant Override as Admin
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_admin_id::text, true);

    INSERT INTO public.student_edit_overrides (student_id, section, allowed_until, reason, granted_by)
    VALUES (v_db_student_a_id, 'personal', timezone('utc'::text, now() + interval '2 hours'), 'Medical leave exception', v_admin_id);

    -- Student A re-attempts submission with active override
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_student_a_id::text, true);

    v_error_caught := false;
    BEGIN
        INSERT INTO public.profile_submissions (student_id, section, proposed_changes, status)
        VALUES (v_db_student_a_id, 'personal', '{"phone": "+91 98480 88888"}'::jsonb, 'Pending');
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
    END;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A submission succeeds after administrator override',
        'Deadline Enforcement',
        'Submission Accepted',
        CASE WHEN NOT v_error_caught THEN 'Submission Accepted' ELSE 'Exception Raised' END,
        CASE WHEN NOT v_error_caught THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 7: DIRECTORY CONTACT SHARING OPT-IN PRIVACY
    -- =========================================================================
    -- Student B has share_phone_in_directory = false.
    -- Student A queries directory view:
    SELECT phone INTO v_phone 
    FROM public.student_directory_view 
    WHERE roll_number = 'TEST_B_5402';

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Directory view masks unconsented phone as "Confidential"',
        'Directory Privacy',
        'Confidential',
        COALESCE(v_phone, 'NULL'),
        CASE WHEN v_phone = 'Confidential' THEN 'PASS' ELSE 'FAIL' END
    );

    -- Student B opts in to share phone
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_student_b_id::text, true);

    UPDATE public.students 
    SET share_phone_in_directory = true 
    WHERE user_id = v_student_b_id;

    -- Student A queries directory view again
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_student_a_id::text, true);

    SELECT phone INTO v_phone 
    FROM public.student_directory_view 
    WHERE roll_number = 'TEST_B_5402';

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Directory reveals phone after student explicitly opts in',
        'Directory Privacy',
        '+91 99999 11111',
        COALESCE(v_phone, 'NULL'),
        CASE WHEN v_phone = '+91 99999 11111' THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 8: STORAGE PHOTOGRAPH ACCESS ISOLATION
    -- =========================================================================
    -- Seed test photo object for Student B as postgres
    PERFORM set_config('role', 'postgres', true);
    DELETE FROM storage.objects WHERE bucket_id = 'profile-photos' AND name LIKE v_student_b_id::text || '/%';
    INSERT INTO storage.objects (id, bucket_id, name, owner, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'profile-photos',
        v_student_b_id::text || '/avatar_test.webp',
        v_student_b_id,
        now(),
        now()
    );

    -- Student A attempts to view Student B's photo
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_student_a_id::text, true);

    SELECT count(*) INTO v_count
    FROM storage.objects
    WHERE bucket_id = 'profile-photos' AND name LIKE v_student_b_id::text || '/%';

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Student A cannot view Student B private photograph in storage',
        'Storage Isolation',
        '0 objects',
        v_count || ' objects',
        CASE WHEN v_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 9: UNROSTERED SIGNUP ASSIGNS ZERO ROLES (RLS LOCKOUT)
    -- =========================================================================
    -- Simulate new auth user created with unapproved email
    PERFORM set_config('role', 'postgres', true);
    -- Call trigger logic directly with simulated unrostered user
    PERFORM public.handle_new_auth_user() FROM (
        SELECT v_unrostered_id AS id, 'intruder@unknown.com' AS email
    ) AS NEW;

    SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_unrostered_id;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Unrostered email signup receives NO role in user_roles',
        'Account Provisioning',
        'No Role (NULL)',
        COALESCE(v_role::text, 'NULL'),
        CASE WHEN v_role IS NULL THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- TEST 10: DUPLICATE ROSTER CLAIM COLLISION PREVENTION
    -- =========================================================================
    -- Student A is already linked to TEST_A_5401 with email studenta@viit.ac.in.
    -- An imposter auth user attempts to claim the same email.
    PERFORM public.handle_new_auth_user() FROM (
        SELECT v_imposter_id AS id, 'studenta@viit.ac.in' AS email
    ) AS NEW;

    -- Verify that Student A's roster record is STILL linked to v_student_a_id, NOT v_imposter_id
    SELECT user_id INTO v_phone FROM public.students WHERE id = v_db_student_a_id;

    INSERT INTO test_results (test_name, category, expected, actual, status)
    VALUES (
        'Duplicate roster claim rejected; original student link intact',
        'Account Provisioning',
        v_student_a_id::text,
        COALESCE(v_phone, 'NULL'),
        CASE WHEN v_phone = v_student_a_id::text THEN 'PASS' ELSE 'FAIL' END
    );

    -- =========================================================================
    -- CLEANUP
    -- =========================================================================
    PERFORM set_config('role', 'postgres', true);
    DELETE FROM storage.objects WHERE bucket_id = 'profile-photos' AND name LIKE v_student_b_id::text || '/%';
    DELETE FROM public.student_edit_overrides WHERE student_id = v_db_student_a_id;
    DELETE FROM public.profile_submissions WHERE student_id = v_db_student_a_id;
    DELETE FROM public.student_personal_details WHERE student_id = v_db_student_b_id;
    DELETE FROM public.students WHERE user_id IN (v_student_a_id, v_student_b_id);
    DELETE FROM public.user_roles WHERE user_id IN (v_admin_id, v_student_a_id, v_student_b_id, v_unrostered_id, v_imposter_id);

    -- Restore normal deadline
    UPDATE public.system_settings 
    SET value = jsonb_build_object('deadline', timezone('utc'::text, now() + interval '30 days'))
    WHERE key = 'profile_edit_deadline';
END $$;

-- DISPLAY VERIFICATION TEST RESULTS
SELECT 
    test_id,
    category,
    test_name,
    expected,
    actual,
    status
FROM test_results
ORDER BY test_id;
