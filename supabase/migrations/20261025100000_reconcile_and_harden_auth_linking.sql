-- ==============================================================================
-- MENTOR CONNECT — RECONCILE EXISTING STUDENT ACCOUNT & HARDEN AUTH LINKING
-- Migration: 20261025100000_reconcile_and_harden_auth_linking.sql
-- Target: Supabase PostgreSQL (Project: mttocnlnmmtaugzthfih)
--
-- Contents:
--   PART 1: One-time safe transactional reconciliation for Test Pilot Student (Roll: 23L31A0999)
--   PART 2: Trigger and function enhancement for future student invitations
-- ==============================================================================

-- ==============================================================================
-- PART 1: ONE-TIME SAFE TRANSACTIONAL RECONCILIATION FOR ROLL: 23L31A0999
-- ==============================================================================
DO $$
DECLARE
    v_target_roll TEXT := '23L31A0999';
    v_student_id UUID;
    v_student_name TEXT;
    v_student_email TEXT;
    v_student_status TEXT;
    v_existing_student_user_id UUID;
    v_auth_user_id UUID;
    v_auth_invited_at TIMESTAMPTZ;
    v_auth_confirmed_at TIMESTAMPTZ;
    v_conflict_count INT;
    v_role_conflict_count INT;
BEGIN
    -- 1. Verify official student roster record exists and is Active
    SELECT id, name, email, status, user_id
    INTO v_student_id, v_student_name, v_student_email, v_student_status, v_existing_student_user_id
    FROM public.students
    WHERE roll_number = v_target_roll
    LIMIT 1;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Reconciliation Aborted: No student roster record found for roll number %', v_target_roll;
    END IF;

    IF v_student_status <> 'Active' THEN
        RAISE EXCEPTION 'Reconciliation Aborted: Student % has status %, expected Active', v_target_roll, v_student_status;
    END IF;

    IF v_existing_student_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Reconciliation Aborted: Student % is already linked to user_id %', v_target_roll, v_existing_student_user_id;
    END IF;

    -- 2. Verify matching Auth account exists in auth.users
    SELECT id, invited_at, COALESCE(email_confirmed_at, confirmed_at)
    INTO v_auth_user_id, v_auth_invited_at, v_auth_confirmed_at
    FROM auth.users
    WHERE lower(email) = lower(v_student_email)
    LIMIT 1;

    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Reconciliation Aborted: No auth.users account found matching student email %', v_student_email;
    END IF;

    -- 3. Verify official invitation and email confirmation
    IF v_auth_invited_at IS NULL THEN
        RAISE EXCEPTION 'Reconciliation Aborted: Auth user % has invited_at = NULL (not an officially invited student account)', v_auth_user_id;
    END IF;

    IF v_auth_confirmed_at IS NULL THEN
        RAISE EXCEPTION 'Reconciliation Aborted: Auth user % has not confirmed email or completed password creation', v_auth_user_id;
    END IF;

    -- 4. Verify absence of conflicting account assignments
    SELECT count(*) INTO v_conflict_count
    FROM public.students
    WHERE user_id = v_auth_user_id;

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Reconciliation Aborted: Auth user % is already assigned to another student record', v_auth_user_id;
    END IF;

    SELECT count(*) INTO v_role_conflict_count
    FROM public.user_roles
    WHERE user_id = v_auth_user_id AND role <> 'student';

    IF v_role_conflict_count > 0 THEN
        RAISE EXCEPTION 'Reconciliation Aborted: Auth user % already has an administrative or non-student role', v_auth_user_id;
    END IF;

    -- 5. Transactional Linking:
    -- Set session flag so check_student_update_privileges permits the initial link
    PERFORM set_config('mentor_connect.auth_linking', 'true', true);

    UPDATE public.students
    SET user_id = v_auth_user_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_student_id
      AND user_id IS NULL;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_auth_user_id, 'student')
    ON CONFLICT (user_id) DO UPDATE SET role = 'student';

    RAISE NOTICE 'SUCCESS: Successfully reconciled student % (%) [Roll: %] to Auth ID % with role student.',
        v_student_name, v_student_email, v_target_roll, v_auth_user_id;
END;
$$;


-- ==============================================================================
-- PART 2: HARDEN INVITATION WORKFLOW TRIGGER FOR FUTURE STUDENTS
-- ==============================================================================

-- Revise public.handle_new_auth_user to safely link when invited_at is populated
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_existing_user_id UUID;
    v_student_status TEXT;
    v_already_linked_student_id UUID;
    v_existing_role TEXT;
    v_rows_updated INT;
BEGIN
    -- Security Check 1: Only officially invited accounts should link to student roster records.
    -- Self-signups or organic registrations without an invitation (invited_at IS NULL)
    -- are strictly ignored and NEVER granted student or admin roles.
    IF NEW.invited_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Security Correction 1: Never overwrite an existing admin or other non-student role with 'student'.
    SELECT role INTO v_existing_role
    FROM public.user_roles
    WHERE user_id = NEW.id
    LIMIT 1;

    IF v_existing_role IS NOT NULL AND v_existing_role <> 'student' THEN
        RAISE WARNING 'Auth user % already holds role %, refusing student assignment or roster linking.', NEW.id, v_existing_role;
        RETURN NEW;
    END IF;

    -- Security Correction 2: Never allow an Auth user already linked to Student A to become linked to Student B,
    -- including after an email change or multiple roster matches.
    SELECT id INTO v_already_linked_student_id
    FROM public.students
    WHERE user_id = NEW.id
    LIMIT 1;

    -- Check if auth user email matches an active pre-provisioned student in the roster
    SELECT id, user_id, status 
    INTO v_student_id, v_existing_user_id, v_student_status
    FROM public.students 
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    -- If no matching active roster record exists, nothing to link
    IF v_student_id IS NULL OR v_student_status <> 'Active' THEN
        RETURN NEW;
    END IF;

    -- Enforce single-student invariant: If already linked to Student A, reject linking to Student B
    IF v_already_linked_student_id IS NOT NULL AND v_already_linked_student_id <> v_student_id THEN
        RAISE WARNING 'Auth user % is already permanently linked to student %, refusing re-linking to student %',
            NEW.id, v_already_linked_student_id, v_student_id;
        RETURN NEW;
    END IF;

    -- Prevent duplicate roster claims: if Student B is already linked to a different auth user, abort linking
    IF v_existing_user_id IS NOT NULL AND v_existing_user_id <> NEW.id THEN
        RAISE WARNING 'Student record % with email % is already linked to auth user %',
            v_student_id, NEW.email, v_existing_user_id;
        RETURN NEW;
    END IF;

    -- If already linked to this exact student, ensure role is student (if unassigned) and return
    IF v_already_linked_student_id = v_student_id OR v_existing_user_id = NEW.id THEN
        IF v_existing_role IS NULL THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (NEW.id, 'student')
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
        RETURN NEW;
    END IF;

    -- Set local transaction flag for authorized internal auth linking
    PERFORM set_config('mentor_connect.auth_linking', 'true', true);

    -- Link auth.users.id to public.students (only when user_id is currently NULL)
    UPDATE public.students
    SET user_id = NEW.id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_student_id
      AND user_id IS NULL;

    -- Verify that exactly one row was updated; otherwise abort transaction without granting role
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    IF v_rows_updated <> 1 THEN
        RAISE EXCEPTION 'Auth linking failed: Expected exactly 1 student record to be linked for user %, but % rows were updated.',
            NEW.id, v_rows_updated;
    END IF;

    -- Grant verified student role (using DO NOTHING to guarantee no overwrite of existing roles)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update trigger to watch both INSERT and updates to invited_at / email_confirmed_at.
-- This ensures that when GoTrue creates the user first and populates invited_at or confirmation
-- tokens in subsequent UPDATE statements, the linking handler executes seamlessly.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF invited_at, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
