-- ==============================================================================
-- MENTOR CONNECT — FIX INTERNAL AUTH ACCOUNT LINKING TRIGGER PERMISSIONS (FINAL)
-- Migration: 20261025090000_fix_auth_linking_trigger_permissions.sql
-- Target: Supabase PostgreSQL (Project: mttocnlnmmtaugzthfih)
-- Description:
--   Resolves recurring "Access Denied: Students are restricted to updating directory
--   privacy preferences..." error during GoTrue auth.admin.inviteUserByEmail() operations.
--
--   Security Specifications:
--     1. Administrator-Controlled Invitations Only: Only officially invited accounts
--        (NEW.invited_at IS NOT NULL) are permitted to automatically link to student
--        roster records. Public signups or email confirmations alone NEVER grant student access.
--     2. Verified Session Identity: Verifies that the session connection role (session_user)
--        is the genuine Supabase Auth daemon ('supabase_auth_admin') or superuser ('postgres').
--        PostgREST client connections ('authenticator') can NEVER satisfy this check.
--     3. Strict First-Time Linking: user_id can ONLY transition from NULL to the Auth
--        user's UUID (preventing re-assignment or account takeover). All other student
--        columns must remain identical using NULL-safe comparisons (IS NOT DISTINCT FROM).
--     4. In-Place Function Replacement: Uses CREATE OR REPLACE FUNCTION to seamlessly
--        update existing triggers (on_auth_user_created and trg_check_student_update_privileges)
--        without dropping or recreating trigger definitions.
--     5. Preservation of RLS: All existing RLS policies on public.students and
--        public.student_directory remain 100% active and unchanged.
-- ==============================================================================

-- 1. REVISE public.handle_new_auth_user
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_existing_user_id UUID;
BEGIN
    -- Security Check: Only officially invited accounts should automatically link
    -- to student roster records. Email confirmation alone must not grant student access.
    IF NEW.invited_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if newly created auth user email matches a pre-provisioned student in the roster
    SELECT id, user_id INTO v_student_id, v_existing_user_id 
    FROM public.students 
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF v_student_id IS NOT NULL THEN
        -- Prevent duplicate roster claims: if already linked to a different auth user, abort linking
        IF v_existing_user_id IS NOT NULL AND v_existing_user_id <> NEW.id THEN
            RAISE WARNING 'Student record % with email % is already linked to auth user %', v_student_id, NEW.email, v_existing_user_id;
            RETURN NEW;
        END IF;

        -- If already linked to this exact auth user, no redundant update needed
        IF v_existing_user_id = NEW.id THEN
            RETURN NEW;
        END IF;

        -- Set local transaction flag for authorized internal auth linking
        -- (Applies only to this database transaction and is automatically cleared on commit/abort)
        PERFORM set_config('mentor_connect.auth_linking', 'true', true);

        -- Link auth.users.id to public.students
        UPDATE public.students
        SET user_id = NEW.id,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_student_id;

        -- Grant verified student role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'student')
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        -- Email is not on the student roster.
        -- Zero role = zero table access under RLS (public.is_admin() and public.is_student() return false).
        NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. REVISE public.check_student_update_privileges
CREATE OR REPLACE FUNCTION public.check_student_update_privileges()
RETURNS TRIGGER AS $$
DECLARE
    -- Verified Trusted Auth Execution Context:
    -- Must be initiated by genuine Supabase Auth daemon (or postgres superuser),
    -- AND must have the transaction-local flag set by handle_new_auth_user.
    -- session_user is used (not current_user) to inspect the actual connecting database session.
    is_trusted_auth_session BOOLEAN := (
        session_user IN ('supabase_auth_admin', 'postgres') AND
        current_setting('mentor_connect.auth_linking', true) = 'true'
    );
BEGIN
    -- Case 1: Trusted internal account-linking operation from handle_new_auth_user()
    IF is_trusted_auth_session THEN
        -- Permit ONLY the initial linking of user_id from NULL to the matching Auth user's ID.
        -- All other student fields must remain unchanged using NULL-safe comparisons (IS NOT DISTINCT FROM).
        IF (OLD.user_id IS NULL AND NEW.user_id IS NOT NULL) AND
           NEW.id IS NOT DISTINCT FROM OLD.id AND
           NEW.roll_number IS NOT DISTINCT FROM OLD.roll_number AND
           NEW.name IS NOT DISTINCT FROM OLD.name AND
           NEW.email IS NOT DISTINCT FROM OLD.email AND
           NEW.department IS NOT DISTINCT FROM OLD.department AND
           NEW.year IS NOT DISTINCT FROM OLD.year AND
           NEW.semester IS NOT DISTINCT FROM OLD.semester AND
           NEW.section IS NOT DISTINCT FROM OLD.section AND
           NEW.mentor_id IS NOT DISTINCT FROM OLD.mentor_id AND
           NEW.status IS NOT DISTINCT FROM OLD.status AND
           NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url AND
           NEW.share_phone_in_directory IS NOT DISTINCT FROM OLD.share_phone_in_directory AND
           NEW.share_email_in_directory IS NOT DISTINCT FROM OLD.share_email_in_directory AND
           NEW.created_at IS NOT DISTINCT FROM OLD.created_at THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Case 2: Standard privilege verification
    -- Non-administrators (students) are strictly blocked from modifying academic, cohort, or account fields
    IF NOT public.is_admin() THEN
        IF NEW.id <> OLD.id OR
           NEW.user_id IS DISTINCT FROM OLD.user_id OR
           NEW.roll_number <> OLD.roll_number OR
           NEW.name <> OLD.name OR
           NEW.email <> OLD.email OR
           NEW.department <> OLD.department OR
           NEW.year <> OLD.year OR
           NEW.semester <> OLD.semester OR
           NEW.section <> OLD.section OR
           NEW.mentor_id IS DISTINCT FROM OLD.mentor_id OR
           NEW.status <> OLD.status THEN
            RAISE EXCEPTION 'Access Denied: Students are restricted to updating directory privacy preferences. Academic and cohort modifications require administrator privileges.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
