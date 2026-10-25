-- ==============================================================================
-- MENTOR CONNECT — STAGE 2 SECURITY AUDIT REMEDIATION & SCHEMA RECONCILIATION
-- Target: Supabase PostgreSQL
-- Date: 2026-10-25
-- Description: 
--   1. Fix student_directory_view with security_invoker = true and revoke anon access
--   2. Column-level update restriction trigger on public.students
--   3. Database-enforced academic editing deadline & override verification trigger
--   4. Storage photo retrieval isolation (students restricted to own folder)
--   5. Function execution privileges hardening
--   6. Schema reconciliation: residence/commute, diploma, and academic history
-- ==============================================================================

-- 1. SCHEMA RECONCILIATION (Requirement 4)
-- Add residence & transport columns to student_personal_details
ALTER TABLE public.student_personal_details
ADD COLUMN IF NOT EXISTS residence_type TEXT DEFAULT 'Living at home / day scholar',
ADD COLUMN IF NOT EXISTS transport_mode TEXT DEFAULT 'College bus',
ADD COLUMN IF NOT EXISTS bus_route_details TEXT;

-- Add diploma / lateral entry columns to student_education_details
ALTER TABLE public.student_education_details
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'Regular' CHECK (entry_type IN ('Regular', 'Lateral')),
ADD COLUMN IF NOT EXISTS diploma_college TEXT,
ADD COLUMN IF NOT EXISTS diploma_percentage NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS diploma_branch TEXT;

-- Create student_academic_history table (Previous semester SGPA, CGPA, backlogs & clearance)
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

DROP POLICY IF EXISTS "Admins manage academic history" ON public.student_academic_history;
CREATE POLICY "Admins manage academic history"
    ON public.student_academic_history FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view own academic history" ON public.student_academic_history;
CREATE POLICY "Students view own academic history"
    ON public.student_academic_history FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_academic_history.student_id AND s.user_id = auth.uid()));

-- 2. COLUMN-LEVEL UPDATE RESTRICTION TRIGGER ON STUDENTS
-- Ensures students can NEVER alter roll_number, name, email, department, year, semester, section, mentor_id, or status
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

-- 3. DATABASE-ENFORCED ACADEMIC DEADLINE & OVERRIDE VALIDATION TRIGGER
-- Enforces deadline check inside PostgreSQL so nobody can bypass it via direct API requests
CREATE OR REPLACE FUNCTION public.validate_profile_submission()
RETURNS TRIGGER AS $$
DECLARE
    allowed_keys TEXT[];
    proposed_key TEXT;
    v_deadline TIMESTAMPTZ;
BEGIN
    -- A. Deadline & Override Enforcement for Non-Admins
    IF NOT public.is_admin() THEN
        SELECT (value->>'deadline')::timestamptz INTO v_deadline
        FROM public.system_settings 
        WHERE key = 'profile_edit_deadline';

        IF v_deadline IS NOT NULL AND timezone('utc'::text, now()) > v_deadline THEN
            -- Check for active student-specific override
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

    -- B. Strict Field Allowlist Enforcement
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

-- 4. HARDEN STUDENT DIRECTORY VIEW WITH SECURITY INVOKER
-- Update student directory view with security_invoker = true so PostgreSQL 15+ evaluates RLS of the querying user
DROP VIEW IF EXISTS public.student_directory_view;

-- Allow students to read peer basic directory identification (roll, name, department, section)
DROP POLICY IF EXISTS "Students can view active peers directory info" ON public.students;
CREATE POLICY "Students can view active peers directory info"
    ON public.students FOR SELECT TO authenticated
    USING (status = 'Active');

-- Allow students to read peer contact details only if the student opted in
DROP POLICY IF EXISTS "Students view peer contact if opted in" ON public.student_personal_details;
CREATE POLICY "Students view peer contact if opted in"
    ON public.student_personal_details FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.id = student_personal_details.student_id 
              AND (s.user_id = auth.uid() OR s.share_phone_in_directory = true)
        )
    );

CREATE VIEW public.student_directory_view 
WITH (security_invoker = true) AS
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

-- Revoke all permissions on directory from anonymous/public
REVOKE ALL ON public.student_directory_view FROM public, anon;
GRANT SELECT ON public.student_directory_view TO authenticated;

-- 5. HARDEN STORAGE PHOTOGRAPH POLICIES (STUDENTS RESTRICTED TO OWN FOLDER)
DROP POLICY IF EXISTS "Authenticated users can view approved profile photos" ON storage.objects;

-- Only Admins can select any photo in the private bucket
DROP POLICY IF EXISTS "Admins have full access to profile photos" ON storage.objects;
CREATE POLICY "Admins have full access to profile photos"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'profile-photos' AND public.is_admin())
    WITH CHECK (bucket_id = 'profile-photos' AND public.is_admin());

-- Students can ONLY view photos within their own user folder
DROP POLICY IF EXISTS "Students can view own profile photo" ON storage.objects;
CREATE POLICY "Students can view own profile photo"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 6. HARDEN FUNCTION EXECUTION PERMISSIONS
REVOKE EXECUTE ON FUNCTION public.review_profile_submission(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_profile_submission(UUID, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
