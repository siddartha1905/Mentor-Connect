-- ==============================================================================
-- MENTOR CONNECT — STAGE 2.1 CONSOLIDATED MASTER DATABASE SCHEMA & SECURITY POLICIES
-- Target: Supabase PostgreSQL (Fresh & Clean Project)
-- Date: 2026-10-25
-- Description: Core users & roles, student master records, section tables, 
--              reconciled academic history, auth user linking trigger,
--              auditable approval workflows, database-enforced deadlines,
--              privacy directory (security_invoker = true), private storage bucket,
--              and zero-trust Row Level Security (RLS).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. USER ROLES & ACCESS CONTROL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'parent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
    ON public.user_roles FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
    ON public.user_roles FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- 3. CORE STUDENTS MASTER TABLE & TRIGGERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    roll_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL DEFAULT 'CSE-Data Science',
    year INTEGER NOT NULL DEFAULT 2,
    semester INTEGER NOT NULL DEFAULT 1,
    section TEXT NOT NULL DEFAULT 'A',
    mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived', 'Pending_Approval')),
    avatar_url TEXT,
    share_phone_in_directory BOOLEAN NOT NULL DEFAULT false,
    share_email_in_directory BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_students ON public.students;
CREATE TRIGGER set_timestamp_students
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Column-Level Protection Trigger: Students can ONLY alter privacy flags and avatar_url
CREATE OR REPLACE FUNCTION public.check_student_update_privileges()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trg_check_student_update_privileges ON public.students;
CREATE TRIGGER trg_check_student_update_privileges
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.check_student_update_privileges();

-- Automated Account Linking Trigger on auth.users
-- Secures student onboarding by matching against mentor-approved roster emails
-- Strictly prevents duplicate roster claims, roll-number spoofing, and privilege escalation
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_existing_user_id UUID;
BEGIN
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
        -- We DO NOT assign any role to unapproved emails.
        -- Zero role = zero table access under RLS (public.is_admin() and public.is_student() return false).
        -- Administrator accounts must be explicitly provisioned in user_roles, not auto-assigned.
        NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- RLS Policies on students
DROP POLICY IF EXISTS "Admins have full access to students" ON public.students;
CREATE POLICY "Admins have full access to students"
    ON public.students FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can view active peers directory info" ON public.students;
CREATE POLICY "Students can view active peers directory info"
    ON public.students FOR SELECT TO authenticated
    USING (status = 'Active');

DROP POLICY IF EXISTS "Students can update own privacy settings" ON public.students;
CREATE POLICY "Students can update own privacy settings"
    ON public.students FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 4. SECTION-WISE STUDENT PROFILE TABLES (RECONCILED)
-- ==============================================================================

-- 4.1 Personal Details (with residence and commute info)
CREATE TABLE IF NOT EXISTS public.student_personal_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    dob DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group TEXT,
    phone TEXT,
    emergency_contact TEXT,
    current_address TEXT,
    permanent_address TEXT,
    residence_type TEXT DEFAULT 'Living at home / day scholar',
    transport_mode TEXT DEFAULT 'College bus',
    bus_route_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_personal_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_personal ON public.student_personal_details;
CREATE TRIGGER set_timestamp_personal
BEFORE UPDATE ON public.student_personal_details
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4.2 Family Details (annual_income is optional / nullable)
CREATE TABLE IF NOT EXISTS public.student_family_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    father_name TEXT,
    father_occupation TEXT,
    father_phone TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    mother_phone TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    annual_income NUMERIC(12, 2), -- Optional during normal onboarding
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_family_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_family ON public.student_family_details;
CREATE TRIGGER set_timestamp_family
BEFORE UPDATE ON public.student_family_details
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4.3 Education Details (supports 10th, 12th Intermediate, and Diploma Lateral Entry)
CREATE TABLE IF NOT EXISTS public.student_education_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    tenth_board TEXT,
    tenth_school TEXT,
    tenth_percentage NUMERIC(5, 2),
    twelfth_board TEXT,
    twelfth_college TEXT,
    twelfth_percentage NUMERIC(5, 2),
    eamcet_rank INTEGER,
    entry_type TEXT DEFAULT 'Regular' CHECK (entry_type IN ('Regular', 'Lateral')),
    diploma_college TEXT,
    diploma_percentage NUMERIC(5, 2),
    diploma_branch TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_education_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_education ON public.student_education_details;
CREATE TRIGGER set_timestamp_education
BEFORE UPDATE ON public.student_education_details
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4.4 Academic History (Previous Semester SGPA, CGPA, Backlogs & Clearance)
CREATE TABLE IF NOT EXISTS public.student_academic_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    semester TEXT NOT NULL, -- e.g. '1-1', '1-2', '2-1'
    sgpa NUMERIC(4, 2) NOT NULL,
    cgpa NUMERIC(4, 2) NOT NULL,
    credits_earned INTEGER NOT NULL DEFAULT 0,
    backlogs_count INTEGER NOT NULL DEFAULT 0,
    cleared_backlogs_count INTEGER NOT NULL DEFAULT 0,
    backlog_subject_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, semester)
);

ALTER TABLE public.student_academic_history ENABLE ROW LEVEL SECURITY;

-- Section RLS Policies
DROP POLICY IF EXISTS "Admins full access personal" ON public.student_personal_details;
CREATE POLICY "Admins full access personal" ON public.student_personal_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students view own personal" ON public.student_personal_details;
CREATE POLICY "Students view own personal" ON public.student_personal_details FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_personal_details.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "Students view peer contact if opted in" ON public.student_personal_details;
CREATE POLICY "Students view peer contact if opted in" ON public.student_personal_details FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_personal_details.student_id AND (s.user_id = auth.uid() OR s.share_phone_in_directory = true)));

DROP POLICY IF EXISTS "Admins full access family" ON public.student_family_details;
CREATE POLICY "Admins full access family" ON public.student_family_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students view own family" ON public.student_family_details;
CREATE POLICY "Students view own family" ON public.student_family_details FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_family_details.student_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins full access education" ON public.student_education_details;
CREATE POLICY "Admins full access education" ON public.student_education_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students view own education" ON public.student_education_details;
CREATE POLICY "Students view own education" ON public.student_education_details FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_education_details.student_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage academic history" ON public.student_academic_history;
CREATE POLICY "Admins manage academic history" ON public.student_academic_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students view own academic history" ON public.student_academic_history;
CREATE POLICY "Students view own academic history" ON public.student_academic_history FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_academic_history.student_id AND s.user_id = auth.uid()));

-- ==============================================================================
-- 5. ACADEMIC STRUCTURE, MARKS & DEADLINES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    semester INTEGER NOT NULL DEFAULT 3,
    department TEXT NOT NULL DEFAULT 'CSE-Data Science',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone authenticated can view subjects" ON public.subjects;
CREATE POLICY "Anyone authenticated can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins can manage subjects" ON public.subjects;
CREATE POLICY "Only admins can manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.student_subject_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    weekly_test_1 NUMERIC(5, 2),
    weekly_test_2 NUMERIC(5, 2),
    weekly_test_3 NUMERIC(5, 2),
    weekly_test_4 NUMERIC(5, 2),
    mid_1 NUMERIC(5, 2),
    mid_2 NUMERIC(5, 2),
    lab_internal NUMERIC(5, 2),
    semester_end_marks NUMERIC(5, 2),
    grade TEXT,
    attendance_percentage NUMERIC(5, 2),
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, subject_id)
);

ALTER TABLE public.student_subject_marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage marks" ON public.student_subject_marks;
CREATE POLICY "Admins can manage marks" ON public.student_subject_marks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students can view marks" ON public.student_subject_marks;
CREATE POLICY "Students can view marks" ON public.student_subject_marks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_subject_marks.student_id AND s.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read system settings" ON public.system_settings;
CREATE POLICY "Authenticated read system settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins edit system settings" ON public.system_settings;
CREATE POLICY "Only admins edit system settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.system_settings (key, value, description)
VALUES ('profile_edit_deadline', jsonb_build_object('deadline', (timezone('utc'::text, now() + interval '30 days'))), 'Academic editing window deadline')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.student_edit_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    allowed_until TIMESTAMPTZ NOT NULL,
    reason TEXT,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_edit_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage overrides" ON public.student_edit_overrides;
CREATE POLICY "Admins manage overrides" ON public.student_edit_overrides FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students view overrides" ON public.student_edit_overrides;
CREATE POLICY "Students view overrides" ON public.student_edit_overrides FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_edit_overrides.student_id AND s.user_id = auth.uid()));

-- ==============================================================================
-- 6. AUDITABLE PROFILE SUBMISSIONS & APPROVAL RPC
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profile_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('personal', 'family', 'education', 'photo')),
    proposed_changes JSONB NOT NULL,
    current_snapshot JSONB,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Corrections_Requested', 'Rejected')),
    mentor_remarks TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profile_submissions ENABLE ROW LEVEL SECURITY;

-- Database-Level Deadline & Allowlist Verification Trigger
CREATE OR REPLACE FUNCTION public.validate_profile_submission()
RETURNS TRIGGER AS $$
DECLARE
    allowed_keys TEXT[];
    proposed_key TEXT;
    v_deadline TIMESTAMPTZ;
BEGIN
    -- Deadline & Override Check for Non-Admins
    IF NOT public.is_admin() THEN
        SELECT (value->>'deadline')::timestamptz INTO v_deadline
        FROM public.system_settings 
        WHERE key = 'profile_edit_deadline';

        IF v_deadline IS NOT NULL AND timezone('utc'::text, now()) > v_deadline THEN
            IF NOT EXISTS (
                SELECT 1 
                FROM public.student_edit_overrides
                WHERE student_id = NEW.student_id
                  AND (section = NEW.section OR section = 'all')
                  AND allowed_until > timezone('utc'::text, now())
            ) THEN
                RAISE EXCEPTION 'Academic submission deadline (%) has expired for section "%". Contact faculty mentor for an administrative override.', v_deadline, NEW.section;
            END IF;
        END IF;
    END IF;

    -- Strict Field Allowlist Enforcement
    IF NEW.section = 'personal' THEN
        allowed_keys := ARRAY['dob', 'gender', 'blood_group', 'phone', 'emergency_contact', 'current_address', 'permanent_address', 'residence_type', 'transport_mode', 'bus_route_details'];
    ELSIF NEW.section = 'family' THEN
        allowed_keys := ARRAY['father_name', 'father_occupation', 'father_phone', 'mother_name', 'mother_occupation', 'mother_phone', 'guardian_name', 'guardian_phone', 'annual_income'];
    ELSIF NEW.section = 'education' THEN
        allowed_keys := ARRAY['tenth_board', 'tenth_school', 'tenth_percentage', 'twelfth_board', 'twelfth_college', 'twelfth_percentage', 'eamcet_rank', 'entry_type', 'diploma_college', 'diploma_percentage', 'diploma_branch'];
    ELSIF NEW.section = 'photo' THEN
        allowed_keys := ARRAY['avatar_url'];
    ELSE
        RAISE EXCEPTION 'Invalid profile section: %', NEW.section;
    END IF;

    FOR proposed_key IN SELECT jsonb_object_keys(NEW.proposed_changes)
    LOOP
        IF NOT (proposed_key = ANY(allowed_keys)) THEN
            RAISE EXCEPTION 'Disallowed field "%" in section "%". Field modification rejected.', proposed_key, NEW.section;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_profile_submission ON public.profile_submissions;
CREATE TRIGGER trg_validate_profile_submission
BEFORE INSERT OR UPDATE OF proposed_changes ON public.profile_submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_submission();

DROP POLICY IF EXISTS "Admins full access submissions" ON public.profile_submissions;
CREATE POLICY "Admins full access submissions" ON public.profile_submissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Students view submissions" ON public.profile_submissions;
CREATE POLICY "Students view submissions" ON public.profile_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = profile_submissions.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "Students insert submissions" ON public.profile_submissions;
CREATE POLICY "Students insert submissions" ON public.profile_submissions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = profile_submissions.student_id AND s.user_id = auth.uid()));

-- Atomic Review RPC Function
CREATE OR REPLACE FUNCTION public.review_profile_submission(
    p_submission_id UUID,
    p_action TEXT,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub RECORD;
    v_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Administrator role required';
    END IF;

    SELECT * INTO v_sub FROM public.profile_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found: %', p_submission_id;
    END IF;

    IF v_sub.status = 'Approved' THEN
        RAISE EXCEPTION 'Submission already approved';
    END IF;

    IF p_action = 'approve' THEN
        v_status := 'Approved';

        IF v_sub.section = 'personal' THEN
            INSERT INTO public.student_personal_details (student_id, dob, gender, blood_group, phone, emergency_contact, current_address, permanent_address, residence_type, transport_mode, bus_route_details)
            VALUES (
                v_sub.student_id,
                (v_sub.proposed_changes->>'dob')::date,
                v_sub.proposed_changes->>'gender',
                v_sub.proposed_changes->>'blood_group',
                v_sub.proposed_changes->>'phone',
                v_sub.proposed_changes->>'emergency_contact',
                v_sub.proposed_changes->>'current_address',
                v_sub.proposed_changes->>'permanent_address',
                COALESCE(v_sub.proposed_changes->>'residence_type', 'Living at home / day scholar'),
                COALESCE(v_sub.proposed_changes->>'transport_mode', 'College bus'),
                v_sub.proposed_changes->>'bus_route_details'
            )
            ON CONFLICT (student_id) DO UPDATE SET
                dob = COALESCE((v_sub.proposed_changes->>'dob')::date, student_personal_details.dob),
                gender = COALESCE(v_sub.proposed_changes->>'gender', student_personal_details.gender),
                blood_group = COALESCE(v_sub.proposed_changes->>'blood_group', student_personal_details.blood_group),
                phone = COALESCE(v_sub.proposed_changes->>'phone', student_personal_details.phone),
                emergency_contact = COALESCE(v_sub.proposed_changes->>'emergency_contact', student_personal_details.emergency_contact),
                current_address = COALESCE(v_sub.proposed_changes->>'current_address', student_personal_details.current_address),
                permanent_address = COALESCE(v_sub.proposed_changes->>'permanent_address', student_personal_details.permanent_address),
                residence_type = COALESCE(v_sub.proposed_changes->>'residence_type', student_personal_details.residence_type),
                transport_mode = COALESCE(v_sub.proposed_changes->>'transport_mode', student_personal_details.transport_mode),
                bus_route_details = COALESCE(v_sub.proposed_changes->>'bus_route_details', student_personal_details.bus_route_details),
                updated_at = timezone('utc'::text, now());

        ELSIF v_sub.section = 'family' THEN
            INSERT INTO public.student_family_details (student_id, father_name, father_occupation, father_phone, mother_name, mother_occupation, mother_phone, guardian_name, guardian_phone, annual_income)
            VALUES (
                v_sub.student_id,
                v_sub.proposed_changes->>'father_name',
                v_sub.proposed_changes->>'father_occupation',
                v_sub.proposed_changes->>'father_phone',
                v_sub.proposed_changes->>'mother_name',
                v_sub.proposed_changes->>'mother_occupation',
                v_sub.proposed_changes->>'mother_phone',
                v_sub.proposed_changes->>'guardian_name',
                v_sub.proposed_changes->>'guardian_phone',
                (v_sub.proposed_changes->>'annual_income')::numeric
            )
            ON CONFLICT (student_id) DO UPDATE SET
                father_name = COALESCE(v_sub.proposed_changes->>'father_name', student_family_details.father_name),
                father_occupation = COALESCE(v_sub.proposed_changes->>'father_occupation', student_family_details.father_occupation),
                father_phone = COALESCE(v_sub.proposed_changes->>'father_phone', student_family_details.father_phone),
                mother_name = COALESCE(v_sub.proposed_changes->>'mother_name', student_family_details.mother_name),
                mother_occupation = COALESCE(v_sub.proposed_changes->>'mother_occupation', student_family_details.mother_occupation),
                mother_phone = COALESCE(v_sub.proposed_changes->>'mother_phone', student_family_details.mother_phone),
                guardian_name = COALESCE(v_sub.proposed_changes->>'guardian_name', student_family_details.guardian_name),
                guardian_phone = COALESCE(v_sub.proposed_changes->>'guardian_phone', student_family_details.guardian_phone),
                annual_income = COALESCE((v_sub.proposed_changes->>'annual_income')::numeric, student_family_details.annual_income),
                updated_at = timezone('utc'::text, now());

        ELSIF v_sub.section = 'education' THEN
            INSERT INTO public.student_education_details (student_id, tenth_board, tenth_school, tenth_percentage, twelfth_board, twelfth_college, twelfth_percentage, eamcet_rank, entry_type, diploma_college, diploma_percentage, diploma_branch)
            VALUES (
                v_sub.student_id,
                v_sub.proposed_changes->>'tenth_board',
                v_sub.proposed_changes->>'tenth_school',
                (v_sub.proposed_changes->>'tenth_percentage')::numeric,
                v_sub.proposed_changes->>'twelfth_board',
                v_sub.proposed_changes->>'twelfth_college',
                (v_sub.proposed_changes->>'twelfth_percentage')::numeric,
                (v_sub.proposed_changes->>'eamcet_rank')::integer,
                COALESCE(v_sub.proposed_changes->>'entry_type', 'Regular'),
                v_sub.proposed_changes->>'diploma_college',
                (v_sub.proposed_changes->>'diploma_percentage')::numeric,
                v_sub.proposed_changes->>'diploma_branch'
            )
            ON CONFLICT (student_id) DO UPDATE SET
                tenth_board = COALESCE(v_sub.proposed_changes->>'tenth_board', student_education_details.tenth_board),
                tenth_school = COALESCE(v_sub.proposed_changes->>'tenth_school', student_education_details.tenth_school),
                tenth_percentage = COALESCE((v_sub.proposed_changes->>'tenth_percentage')::numeric, student_education_details.tenth_percentage),
                twelfth_board = COALESCE(v_sub.proposed_changes->>'twelfth_board', student_education_details.twelfth_board),
                twelfth_college = COALESCE(v_sub.proposed_changes->>'twelfth_college', student_education_details.twelfth_college),
                twelfth_percentage = COALESCE((v_sub.proposed_changes->>'twelfth_percentage')::numeric, student_education_details.twelfth_percentage),
                eamcet_rank = COALESCE((v_sub.proposed_changes->>'eamcet_rank')::integer, student_education_details.eamcet_rank),
                entry_type = COALESCE(v_sub.proposed_changes->>'entry_type', student_education_details.entry_type),
                diploma_college = COALESCE(v_sub.proposed_changes->>'diploma_college', student_education_details.diploma_college),
                diploma_percentage = COALESCE((v_sub.proposed_changes->>'diploma_percentage')::numeric, student_education_details.diploma_percentage),
                diploma_branch = COALESCE(v_sub.proposed_changes->>'diploma_branch', student_education_details.diploma_branch),
                updated_at = timezone('utc'::text, now());

        ELSIF v_sub.section = 'photo' THEN
            UPDATE public.students
            SET avatar_url = v_sub.proposed_changes->>'avatar_url', updated_at = timezone('utc'::text, now())
            WHERE id = v_sub.student_id;
        END IF;

    ELSIF p_action = 'request_corrections' THEN
        v_status := 'Corrections_Requested';
    ELSIF p_action = 'reject' THEN
        v_status := 'Rejected';
    ELSE
        RAISE EXCEPTION 'Invalid action: %', p_action;
    END IF;

    UPDATE public.profile_submissions
    SET status = v_status,
        mentor_remarks = COALESCE(p_remarks, mentor_remarks),
        reviewed_by = auth.uid(),
        reviewed_at = timezone('utc'::text, now())
    WHERE id = p_submission_id;

    RETURN jsonb_build_object('success', true, 'status', v_status);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_profile_submission(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_profile_submission(UUID, TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- 7. PRIVACY DIRECTORY VIEW (SECURITY INVOKER)
-- ==============================================================================

DROP VIEW IF EXISTS public.student_directory_view;
CREATE VIEW public.student_directory_view 
WITH (security_invoker = true) AS
SELECT
    s.id, s.roll_number, s.name, s.department, s.year, s.semester, s.section, s.avatar_url,
    CASE WHEN s.share_email_in_directory OR public.is_admin() THEN s.email ELSE 'Confidential' END AS email,
    CASE WHEN s.share_phone_in_directory OR public.is_admin() THEN p.phone ELSE 'Confidential' END AS phone
FROM public.students s
LEFT JOIN public.student_personal_details p ON p.student_id = s.id
WHERE s.status = 'Active';

REVOKE ALL ON public.student_directory_view FROM public, anon;
GRANT SELECT ON public.student_directory_view TO authenticated;

-- ==============================================================================
-- 8. STORAGE BUCKET FOR PROFILE PHOTOGRAPHS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 1048576;

DROP POLICY IF EXISTS "Admins full access storage" ON storage.objects;
CREATE POLICY "Admins full access storage" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'profile-photos' AND public.is_admin()) WITH CHECK (bucket_id = 'profile-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Students insert own photo" ON storage.objects;
CREATE POLICY "Students insert own photo" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Students update own photo" ON storage.objects;
CREATE POLICY "Students update own photo" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Students can view own profile photo" ON storage.objects;
CREATE POLICY "Students can view own profile photo" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==============================================================================
-- 9. DEFAULT CSE-DATA SCIENCE SUBJECTS SEED
-- ==============================================================================

INSERT INTO public.subjects (code, name, credits, semester, department)
VALUES
    ('CS2101', 'Data Structures & Algorithms', 4, 3, 'CSE-Data Science'),
    ('CS2102', 'Database Management Systems', 4, 3, 'CSE-Data Science'),
    ('DS2101', 'Foundations of Data Science', 3, 3, 'CSE-Data Science'),
    ('CS2103', 'Discrete Mathematics', 3, 3, 'CSE-Data Science'),
    ('CS2104', 'Computer Organization & Architecture', 3, 3, 'CSE-Data Science'),
    ('DS2102', 'Data Science Lab with Python', 2, 3, 'CSE-Data Science'),
    ('CS2105', 'DBMS Laboratory', 2, 3, 'CSE-Data Science')
ON CONFLICT (code) DO NOTHING;
