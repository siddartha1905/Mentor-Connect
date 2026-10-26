-- ==============================================================================
-- MENTOR CONNECT — STAGE 2.2 TARGETED STUDENT PRIVACY & DIRECTORY HARDENING (REVISED)
-- Target: Supabase PostgreSQL (Live Project: mttocnlnmmtaugzthfih)
-- Date: 2026-10-25
-- Description:
--   1. Restricts public.students SELECT to own profile (user_id = auth.uid()) or is_admin().
--   2. Restricts public.student_personal_details SELECT to own profile or is_admin().
--   3. Establishes dedicated, sanitized public.student_directory table (containing ONLY directory attributes).
--   4. Restricts public.student_directory SELECT to authorized active students and administrators only (unrostered blocked).
--   5. Synchronizes directory on insert/update of roll_number, email, name, dept, year, sem, section, status, avatar, and opt-in toggles.
--   6. Preserves administrator unmasked contact visibility via verified server-side authorization while keeping table storage sanitized.
--   7. Refactors public.student_directory_view (security_invoker = true) over sanitized table with admin unmasking.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDEN ROW LEVEL SECURITY ON public.students
-- ------------------------------------------------------------------------------
-- Drop the overly permissive peer view policy that exposed student emails
DROP POLICY IF EXISTS "Students can view active peers directory info" ON public.students;

-- Replace with strict own-record policy (Students can only SELECT their own student row)
DROP POLICY IF EXISTS "Students can view own profile only" ON public.students;
CREATE POLICY "Students can view own profile only"
    ON public.students FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. HARDEN ROW LEVEL SECURITY ON public.student_personal_details
-- ------------------------------------------------------------------------------
-- Drop the policy that granted full row access (including address, dob, emergency contact) if phone was shared
DROP POLICY IF EXISTS "Students view peer contact if opted in" ON public.student_personal_details;

-- Ensure student_personal_details is ONLY accessible by the student themselves or an administrator
DROP POLICY IF EXISTS "Students view own personal" ON public.student_personal_details;
CREATE POLICY "Students view own personal"
    ON public.student_personal_details FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.id = student_personal_details.student_id AND s.user_id = auth.uid()
        )
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 3. DEDICATED SANITIZED STUDENT DIRECTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_directory (
    student_id UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'CSE-Data Science',
    year INTEGER NOT NULL DEFAULT 2,
    semester INTEGER NOT NULL DEFAULT 1,
    section TEXT NOT NULL DEFAULT 'A',
    avatar_url TEXT,
    email TEXT, -- Stored ONLY if student has opted in (share_email = true)
    phone TEXT, -- Stored ONLY if student has opted in (share_phone = true)
    share_email BOOLEAN NOT NULL DEFAULT false,
    share_phone BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_directory_roll ON public.student_directory(roll_number);
CREATE INDEX IF NOT EXISTS idx_student_directory_dept ON public.student_directory(department, year, section);

-- Enable RLS on sanitized directory table
ALTER TABLE public.student_directory ENABLE ROW LEVEL SECURITY;

-- Restrict SELECT to authorized active students and administrators ONLY
-- Unrostered authenticated users without an active student record or admin role are strictly blocked (0 rows)
DROP POLICY IF EXISTS "Authenticated users view directory" ON public.student_directory;
DROP POLICY IF EXISTS "Authorized members view directory" ON public.student_directory;
CREATE POLICY "Authorized members view directory"
    ON public.student_directory FOR SELECT TO authenticated
    USING (
        public.is_admin() 
        OR EXISTS (
            SELECT 1 FROM public.students s 
            WHERE s.user_id = auth.uid() 
              AND s.status = 'Active'
        )
    );

-- Direct mutations blocked for students; only admins can modify
DROP POLICY IF EXISTS "Admins manage directory table" ON public.student_directory;
CREATE POLICY "Admins manage directory table"
    ON public.student_directory FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.student_directory FROM public, anon;
GRANT SELECT ON public.student_directory TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. AUTOMATED BACKEND DIRECTORY SYNCHRONIZATION
-- Trigger responds to changes in roll_number, name, email, department, year,
-- semester, section, status, avatar_url, and opt-in toggles.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_student_directory_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student RECORD;
    v_phone TEXT;
BEGIN
    IF TG_TABLE_NAME = 'students' THEN
        v_student := NEW;
    ELSE
        SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    END IF;

    -- Inactive, Archived, or Missing students must not appear in directory
    IF v_student IS NULL OR v_student.status <> 'Active' THEN
        IF TG_TABLE_NAME = 'students' AND OLD IS NOT NULL THEN
            DELETE FROM public.student_directory WHERE student_id = OLD.id;
        END IF;
        RETURN NEW;
    END IF;

    -- Extract phone ONLY if student explicitly consented to directory sharing
    IF v_student.share_phone_in_directory THEN
        SELECT phone INTO v_phone 
        FROM public.student_personal_details 
        WHERE student_id = v_student.id;
    ELSE
        v_phone := NULL;
    END IF;

    -- Upsert sanitized directory record
    -- Stores email/phone ONLY when explicitly opted in; otherwise stores NULL
    INSERT INTO public.student_directory (
        student_id, roll_number, name, department, year, semester, section,
        avatar_url, email, phone, share_email, share_phone, updated_at
    )
    VALUES (
        v_student.id,
        v_student.roll_number,
        v_student.name,
        v_student.department,
        v_student.year,
        v_student.semester,
        v_student.section,
        v_student.avatar_url,
        CASE WHEN v_student.share_email_in_directory THEN v_student.email ELSE NULL END,
        v_phone,
        v_student.share_email_in_directory,
        v_student.share_phone_in_directory,
        timezone('utc'::text, now())
    )
    ON CONFLICT (student_id) DO UPDATE SET
        roll_number = EXCLUDED.roll_number,
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        year = EXCLUDED.year,
        semester = EXCLUDED.semester,
        section = EXCLUDED.section,
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        share_email = EXCLUDED.share_email,
        share_phone = EXCLUDED.share_phone,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

-- Revoke execute from API roles (Triggers only)
REVOKE ALL ON FUNCTION public.sync_student_directory_entry() FROM PUBLIC, anon, authenticated;

-- Trigger on public.students: responds to roll_number, email, and profile/privacy updates
DROP TRIGGER IF EXISTS trg_sync_student_directory_students ON public.students;
CREATE TRIGGER trg_sync_student_directory_students
AFTER INSERT OR UPDATE OF roll_number, email, name, department, year, semester, section, status, avatar_url, share_phone_in_directory, share_email_in_directory
ON public.students
FOR EACH ROW EXECUTE FUNCTION public.sync_student_directory_entry();

-- Trigger on public.student_personal_details: responds to phone updates
DROP TRIGGER IF EXISTS trg_sync_student_directory_personal ON public.student_personal_details;
CREATE TRIGGER trg_sync_student_directory_personal
AFTER INSERT OR UPDATE OF phone
ON public.student_personal_details
FOR EACH ROW EXECUTE FUNCTION public.sync_student_directory_entry();

-- ------------------------------------------------------------------------------
-- 5. REFACTOR DIRECTORY VIEW OVER SANITIZED DIRECTORY TABLE
-- Backwards compatible with existing frontend service calls (studentService.getStudentDirectory).
-- Normal students see 'Confidential' for opted-out contact details.
-- Administrators can see authorized contact info via server-side authorization check.
-- ------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.student_directory_view;
CREATE VIEW public.student_directory_view 
WITH (security_invoker = true) AS
SELECT
    d.student_id AS id,
    d.roll_number,
    d.name,
    d.department,
    d.year,
    d.semester,
    d.section,
    d.avatar_url,
    CASE 
        WHEN d.share_email THEN COALESCE(d.email, 'Confidential')
        WHEN public.is_admin() THEN COALESCE((SELECT s.email FROM public.students s WHERE s.id = d.student_id), 'Confidential')
        ELSE 'Confidential'
    END AS email,
    CASE 
        WHEN d.share_phone THEN COALESCE(d.phone, 'Confidential')
        WHEN public.is_admin() THEN COALESCE((SELECT p.phone FROM public.student_personal_details p WHERE p.student_id = d.student_id), 'Confidential')
        ELSE 'Confidential'
    END AS phone
FROM public.student_directory d;

REVOKE ALL ON public.student_directory_view FROM public, anon;
GRANT SELECT ON public.student_directory_view TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. BACKFILL EXISTING ACTIVE STUDENTS INTO DIRECTORY
-- ------------------------------------------------------------------------------
INSERT INTO public.student_directory (
    student_id, roll_number, name, department, year, semester, section,
    avatar_url, email, phone, share_email, share_phone
)
SELECT 
    s.id,
    s.roll_number,
    s.name,
    s.department,
    s.year,
    s.semester,
    s.section,
    s.avatar_url,
    CASE WHEN s.share_email_in_directory THEN s.email ELSE NULL END,
    CASE WHEN s.share_phone_in_directory THEN p.phone ELSE NULL END,
    s.share_email_in_directory,
    s.share_phone_in_directory
FROM public.students s
LEFT JOIN public.student_personal_details p ON p.student_id = s.id
WHERE s.status = 'Active'
ON CONFLICT (student_id) DO UPDATE SET
    roll_number = EXCLUDED.roll_number,
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    year = EXCLUDED.year,
    semester = EXCLUDED.semester,
    section = EXCLUDED.section,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    share_email = EXCLUDED.share_email,
    share_phone = EXCLUDED.share_phone;
