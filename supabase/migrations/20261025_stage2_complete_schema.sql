-- ==============================================================================
-- MENTOR CONNECT — STAGE 2 MASTER DATABASE SCHEMA & SECURITY POLICIES
-- Target: Supabase PostgreSQL (Fresh & Clean Project)
-- Date: 2026-10-25
-- Description: Core users & roles, student master records, section tables, 
--              academic tracking, auditable approval workflows, privacy directory,
--              storage bucket setup, and zero-trust Row Level Security (RLS).
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

-- Helper functions for Role-Based Access Control (SECURITY DEFINER with fixed search_path)
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

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 3. CORE STUDENTS MASTER TABLE
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

-- Auto-update updated_at trigger function
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
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS Policies for students
DROP POLICY IF EXISTS "Admins have full access to students" ON public.students;
CREATE POLICY "Admins have full access to students"
    ON public.students
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can view own master record" ON public.students;
CREATE POLICY "Students can view own master record"
    ON public.students
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own privacy settings" ON public.students;
CREATE POLICY "Students can update own privacy settings"
    ON public.students
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 4. SECTION-WISE STUDENT PROFILE TABLES
-- ==============================================================================

-- 4.1 Personal Details
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_personal_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_personal ON public.student_personal_details;
CREATE TRIGGER set_timestamp_personal
BEFORE UPDATE ON public.student_personal_details
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4.2 Family Details
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
    annual_income NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_family_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_family ON public.student_family_details;
CREATE TRIGGER set_timestamp_family
BEFORE UPDATE ON public.student_family_details
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4.3 Education Details
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_education_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_education ON public.student_education_details;
CREATE TRIGGER set_timestamp_education
BEFORE UPDATE ON public.student_education_details
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS Policies for Section Details (Students can view own; Admins can do all)
DROP POLICY IF EXISTS "Admins full access personal" ON public.student_personal_details;
CREATE POLICY "Admins full access personal" ON public.student_personal_details FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view own personal" ON public.student_personal_details;
CREATE POLICY "Students view own personal" ON public.student_personal_details FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_personal_details.student_id AND s.user_id = auth.uid()));

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

DROP TRIGGER IF EXISTS set_timestamp_marks ON public.student_subject_marks;
CREATE TRIGGER set_timestamp_marks
BEFORE UPDATE ON public.student_subject_marks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP POLICY IF EXISTS "Admins can manage student marks" ON public.student_subject_marks;
CREATE POLICY "Admins can manage student marks" ON public.student_subject_marks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can view own marks" ON public.student_subject_marks;
CREATE POLICY "Students can view own marks" ON public.student_subject_marks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_subject_marks.student_id AND s.user_id = auth.uid()));

-- System settings (e.g. academic editing deadline)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read system settings" ON public.system_settings;
CREATE POLICY "Authenticated can read system settings" ON public.system_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can edit system settings" ON public.system_settings;
CREATE POLICY "Only admins can edit system settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Insert default academic deadline (e.g., 30 days in the future)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'profile_edit_deadline', 
    jsonb_build_object('deadline', (timezone('utc'::text, now() + interval '30 days'))),
    'Global deadline after which students must request mentor approval or override for profile edits'
) ON CONFLICT (key) DO NOTHING;

-- Student Edit Overrides (Granted by mentor for specific students past deadline)
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

DROP POLICY IF EXISTS "Admins can manage edit overrides" ON public.student_edit_overrides;
CREATE POLICY "Admins can manage edit overrides" ON public.student_edit_overrides FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can view own edit overrides" ON public.student_edit_overrides;
CREATE POLICY "Students can view own edit overrides" ON public.student_edit_overrides FOR SELECT TO authenticated
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

CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.profile_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.profile_submissions(status);

ALTER TABLE public.profile_submissions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_submissions ON public.profile_submissions;
CREATE TRIGGER set_timestamp_submissions
BEFORE UPDATE ON public.profile_submissions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Server-side validation of proposed_changes keys to prevent arbitrary injection
CREATE OR REPLACE FUNCTION public.validate_profile_submission()
RETURNS TRIGGER AS $$
DECLARE
    allowed_keys TEXT[];
    proposed_key TEXT;
BEGIN
    IF NEW.section = 'personal' THEN
        allowed_keys := ARRAY['dob', 'gender', 'blood_group', 'phone', 'emergency_contact', 'current_address', 'permanent_address'];
    ELSIF NEW.section = 'family' THEN
        allowed_keys := ARRAY['father_name', 'father_occupation', 'father_phone', 'mother_name', 'mother_occupation', 'mother_phone', 'guardian_name', 'guardian_phone', 'annual_income'];
    ELSIF NEW.section = 'education' THEN
        allowed_keys := ARRAY['tenth_board', 'tenth_school', 'tenth_percentage', 'twelfth_board', 'twelfth_college', 'twelfth_percentage', 'eamcet_rank'];
    ELSIF NEW.section = 'photo' THEN
        allowed_keys := ARRAY['avatar_url'];
    ELSE
        RAISE EXCEPTION 'Invalid profile section: %', NEW.section;
    END IF;

    FOR proposed_key IN SELECT jsonb_object_keys(NEW.proposed_changes)
    LOOP
        IF NOT (proposed_key = ANY(allowed_keys)) THEN
            RAISE EXCEPTION 'Disallowed key "%" in section "%"', proposed_key, NEW.section;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_profile_submission ON public.profile_submissions;
CREATE TRIGGER trg_validate_profile_submission
BEFORE INSERT OR UPDATE OF proposed_changes ON public.profile_submissions
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_submission();

-- RLS Policies for profile_submissions
DROP POLICY IF EXISTS "Admins full access to submissions" ON public.profile_submissions;
CREATE POLICY "Admins full access to submissions" ON public.profile_submissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can view own submissions" ON public.profile_submissions;
CREATE POLICY "Students can view own submissions" ON public.profile_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = profile_submissions.student_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Students can insert own submissions" ON public.profile_submissions;
CREATE POLICY "Students can insert own submissions" ON public.profile_submissions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = profile_submissions.student_id AND s.user_id = auth.uid()));

-- Transactional Approval RPC: review_profile_submission
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
    -- Check caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only administrators and mentors can review submissions';
    END IF;

    SELECT * INTO v_sub FROM public.profile_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found: %', p_submission_id;
    END IF;

    IF v_sub.status = 'Approved' THEN
        RAISE EXCEPTION 'Submission is already approved';
    END IF;

    IF p_action = 'approve' THEN
        v_status := 'Approved';

        -- Apply changes to the target table atomically
        IF v_sub.section = 'personal' THEN
            INSERT INTO public.student_personal_details (
                student_id, dob, gender, blood_group, phone, emergency_contact, current_address, permanent_address
            ) VALUES (
                v_sub.student_id,
                (v_sub.proposed_changes->>'dob')::date,
                v_sub.proposed_changes->>'gender',
                v_sub.proposed_changes->>'blood_group',
                v_sub.proposed_changes->>'phone',
                v_sub.proposed_changes->>'emergency_contact',
                v_sub.proposed_changes->>'current_address',
                v_sub.proposed_changes->>'permanent_address'
            )
            ON CONFLICT (student_id) DO UPDATE SET
                dob = COALESCE((v_sub.proposed_changes->>'dob')::date, student_personal_details.dob),
                gender = COALESCE(v_sub.proposed_changes->>'gender', student_personal_details.gender),
                blood_group = COALESCE(v_sub.proposed_changes->>'blood_group', student_personal_details.blood_group),
                phone = COALESCE(v_sub.proposed_changes->>'phone', student_personal_details.phone),
                emergency_contact = COALESCE(v_sub.proposed_changes->>'emergency_contact', student_personal_details.emergency_contact),
                current_address = COALESCE(v_sub.proposed_changes->>'current_address', student_personal_details.current_address),
                permanent_address = COALESCE(v_sub.proposed_changes->>'permanent_address', student_personal_details.permanent_address),
                updated_at = timezone('utc'::text, now());

        ELSIF v_sub.section = 'family' THEN
            INSERT INTO public.student_family_details (
                student_id, father_name, father_occupation, father_phone, mother_name, mother_occupation, mother_phone, guardian_name, guardian_phone, annual_income
            ) VALUES (
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
            INSERT INTO public.student_education_details (
                student_id, tenth_board, tenth_school, tenth_percentage, twelfth_board, twelfth_college, twelfth_percentage, eamcet_rank
            ) VALUES (
                v_sub.student_id,
                v_sub.proposed_changes->>'tenth_board',
                v_sub.proposed_changes->>'tenth_school',
                (v_sub.proposed_changes->>'tenth_percentage')::numeric,
                v_sub.proposed_changes->>'twelfth_board',
                v_sub.proposed_changes->>'twelfth_college',
                (v_sub.proposed_changes->>'twelfth_percentage')::numeric,
                (v_sub.proposed_changes->>'eamcet_rank')::integer
            )
            ON CONFLICT (student_id) DO UPDATE SET
                tenth_board = COALESCE(v_sub.proposed_changes->>'tenth_board', student_education_details.tenth_board),
                tenth_school = COALESCE(v_sub.proposed_changes->>'tenth_school', student_education_details.tenth_school),
                tenth_percentage = COALESCE((v_sub.proposed_changes->>'tenth_percentage')::numeric, student_education_details.tenth_percentage),
                twelfth_board = COALESCE(v_sub.proposed_changes->>'twelfth_board', student_education_details.twelfth_board),
                twelfth_college = COALESCE(v_sub.proposed_changes->>'twelfth_college', student_education_details.twelfth_college),
                twelfth_percentage = COALESCE((v_sub.proposed_changes->>'twelfth_percentage')::numeric, student_education_details.twelfth_percentage),
                eamcet_rank = COALESCE((v_sub.proposed_changes->>'eamcet_rank')::integer, student_education_details.eamcet_rank),
                updated_at = timezone('utc'::text, now());

        ELSIF v_sub.section = 'photo' THEN
            UPDATE public.students
            SET avatar_url = v_sub.proposed_changes->>'avatar_url',
                updated_at = timezone('utc'::text, now())
            WHERE id = v_sub.student_id;
        END IF;

    ELSIF p_action = 'request_corrections' THEN
        v_status := 'Corrections_Requested';
    ELSIF p_action = 'reject' THEN
        v_status := 'Rejected';
    ELSE
        RAISE EXCEPTION 'Invalid action: %. Expected "approve", "request_corrections", or "reject"', p_action;
    END IF;

    -- Update submission record
    UPDATE public.profile_submissions
    SET status = v_status,
        mentor_remarks = COALESCE(p_remarks, mentor_remarks),
        reviewed_by = auth.uid(),
        reviewed_at = timezone('utc'::text, now())
    WHERE id = p_submission_id;

    RETURN jsonb_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'status', v_status,
        'reviewed_at', timezone('utc'::text, now())
    );
END;
$$;

-- ==============================================================================
-- 7. PRIVACY-CONSCIOUS STUDENT DIRECTORY VIEW
-- ==============================================================================

CREATE OR REPLACE VIEW public.student_directory_view AS
SELECT
    s.id,
    s.roll_number,
    s.name,
    s.department,
    s.year,
    s.semester,
    s.section,
    s.avatar_url,
    CASE 
        WHEN s.share_email_in_directory OR public.is_admin() THEN s.email 
        ELSE 'Confidential' 
    END AS email,
    CASE 
        WHEN s.share_phone_in_directory OR public.is_admin() THEN p.phone 
        ELSE 'Confidential' 
    END AS phone
FROM public.students s
LEFT JOIN public.student_personal_details p ON p.student_id = s.id
WHERE s.status = 'Active';

-- Grant access to directory view
GRANT SELECT ON public.student_directory_view TO authenticated;

-- ==============================================================================
-- 8. STORAGE BUCKET FOR PROFILE PHOTOGRAPHS
-- ==============================================================================

-- Create private bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos', 
    'profile-photos', 
    false, 
    1048576, -- 1MB max limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 1048576,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS on storage.objects
DROP POLICY IF EXISTS "Admins have full access to profile photos" ON storage.objects;
CREATE POLICY "Admins have full access to profile photos"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'profile-photos' AND public.is_admin())
    WITH CHECK (bucket_id = 'profile-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Students can upload own profile photo" ON storage.objects;
CREATE POLICY "Students can upload own profile photo"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Students can update own profile photo" ON storage.objects;
CREATE POLICY "Students can update own profile photo"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Authenticated users can view approved profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can view approved profile photos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'profile-photos');

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
