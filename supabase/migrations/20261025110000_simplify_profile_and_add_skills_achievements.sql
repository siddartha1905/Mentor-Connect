-- ==============================================================================
-- MENTOR CONNECT: SIMPLIFY STUDENT PROFILE & SECTIONS F & G
-- Migration: 20261025110000_simplify_profile_and_add_skills_achievements.sql
--
-- Purpose & Security Controls:
-- 1. Grant authenticated students direct INSERT/UPDATE RLS permissions on their
--    own personal, family, and education records (removing approval queue barrier).
-- 2. Create public.student_skills_goals table (Section F: skills, proficiency, goals).
-- 3. Create public.student_achievements table (Section G: workshops, certifications, etc.).
-- 4. Add explicit least-privilege GRANT statements for authenticated role to access
--    student profile, skills, and achievements via the Supabase Data API (PostgREST).
--    Explicitly revoke all access from anon/public to prevent unauthenticated access.
-- 5. Extend the admin-controlled editing deadline to prevent students from modifying
--    or DELETING achievements after the deadline has expired (handling OLD on DELETE).
-- 6. Enforce the same editing deadline on direct profile-photo updates (avatar_url),
--    preserving existing private Storage bucket permissions on 'profile-photos'.
-- 7. Strictly non-destructive: preserves all existing student records, institutional
--    identity fields (Section A), and previously approved data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STUDENT PERSONAL DETAILS RLS (SECTIONS B & C)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students insert own personal" ON public.student_personal_details;
CREATE POLICY "Students insert own personal" ON public.student_personal_details
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_personal_details.student_id
              AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students update own personal" ON public.student_personal_details;
CREATE POLICY "Students update own personal" ON public.student_personal_details
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_personal_details.student_id
              AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_personal_details.student_id
              AND s.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 2. STUDENT FAMILY DETAILS RLS (SECTION D)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students insert own family" ON public.student_family_details;
CREATE POLICY "Students insert own family" ON public.student_family_details
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_family_details.student_id
              AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students update own family" ON public.student_family_details;
CREATE POLICY "Students update own family" ON public.student_family_details
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_family_details.student_id
              AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_family_details.student_id
              AND s.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 3. STUDENT EDUCATION DETAILS RLS (SECTION E)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students insert own education" ON public.student_education_details;
CREATE POLICY "Students insert own education" ON public.student_education_details
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_education_details.student_id
              AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students update own education" ON public.student_education_details;
CREATE POLICY "Students update own education" ON public.student_education_details
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_education_details.student_id
              AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_education_details.student_id
              AND s.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 4. SECTION F: SKILLS & GOALS TABLE & RLS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_skills_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    technical_skills JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name: text, proficiency: text}]
    soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb,      -- [text]
    hobbies JSONB NOT NULL DEFAULT '[]'::jsonb,          -- [text]
    short_term_goals JSONB NOT NULL DEFAULT '[]'::jsonb, -- [text]
    long_term_goals JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [text]
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_skills_goals ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_skills ON public.student_skills_goals;
CREATE TRIGGER set_timestamp_skills
BEFORE UPDATE ON public.student_skills_goals
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP POLICY IF EXISTS "Admins full access skills" ON public.student_skills_goals;
CREATE POLICY "Admins full access skills" ON public.student_skills_goals
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view own skills" ON public.student_skills_goals;
CREATE POLICY "Students view own skills" ON public.student_skills_goals
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_skills_goals.student_id
              AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Students insert own skills" ON public.student_skills_goals;
CREATE POLICY "Students insert own skills" ON public.student_skills_goals
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_skills_goals.student_id
              AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students update own skills" ON public.student_skills_goals;
CREATE POLICY "Students update own skills" ON public.student_skills_goals
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_skills_goals.student_id
              AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_skills_goals.student_id
              AND s.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 5. SECTION G: ACHIEVEMENTS & ACTIVITIES TABLE & RLS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('workshop', 'training', 'certification', 'competition', 'project', 'other')),
    title TEXT NOT NULL,
    organizer TEXT,
    date_or_year TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_achievements ON public.student_achievements;
CREATE TRIGGER set_timestamp_achievements
BEFORE UPDATE ON public.student_achievements
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP POLICY IF EXISTS "Admins full access achievements" ON public.student_achievements;
CREATE POLICY "Admins full access achievements" ON public.student_achievements
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view own achievements" ON public.student_achievements;
CREATE POLICY "Students view own achievements" ON public.student_achievements
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_achievements.student_id
              AND (s.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Students insert own achievements" ON public.student_achievements;
CREATE POLICY "Students insert own achievements" ON public.student_achievements
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_achievements.student_id
              AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students update own achievements" ON public.student_achievements;
CREATE POLICY "Students update own achievements" ON public.student_achievements
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_achievements.student_id
              AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_achievements.student_id
              AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students delete own achievements" ON public.student_achievements;
CREATE POLICY "Students delete own achievements" ON public.student_achievements
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_achievements.student_id
              AND s.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 6. LEAST-PRIVILEGE DATA API GRANTS (AUTHENTICATED ONLY, ANONYMOUS REVOKED)
-- ------------------------------------------------------------------------------
-- Completely revoke all privileges from anonymous / public roles
REVOKE ALL ON TABLE public.student_skills_goals FROM anon, public;
REVOKE ALL ON TABLE public.student_achievements FROM anon, public;
REVOKE ALL ON TABLE public.student_personal_details FROM anon, public;
REVOKE ALL ON TABLE public.student_family_details FROM anon, public;
REVOKE ALL ON TABLE public.student_education_details FROM anon, public;

-- Explicit least-privilege table grants to authenticated role
-- student_skills_goals: SELECT, INSERT, UPDATE (no client DELETE; cascades on student removal)
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_skills_goals TO authenticated;

-- student_achievements: SELECT, INSERT, UPDATE, DELETE (students manage individual item rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_achievements TO authenticated;

-- Profile section tables: SELECT, INSERT, UPDATE
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_personal_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_family_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_education_details TO authenticated;

-- Internal / admin backend access
GRANT ALL ON TABLE public.student_skills_goals TO service_role;
GRANT ALL ON TABLE public.student_achievements TO service_role;
GRANT ALL ON TABLE public.student_personal_details TO service_role;
GRANT ALL ON TABLE public.student_family_details TO service_role;
GRANT ALL ON TABLE public.student_education_details TO service_role;

-- ------------------------------------------------------------------------------
-- 7. DEADLINE & OVERRIDE VALIDATION TRIGGER (HANDLES DELETE AND PHOTO UPDATES)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_student_profile_deadline()
RETURNS TRIGGER AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
    v_section TEXT;
    v_student_id UUID;
BEGIN
    -- 1. Admins and system processes are always exempt
    IF public.is_admin() OR session_user IN ('supabase_auth_admin', 'postgres') THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- 2. Determine target section and student_id based on table and operation
    -- Note: For DELETE operations, NEW is NULL, so OLD must be used.
    IF TG_TABLE_NAME = 'student_personal_details' THEN
        v_section := 'personal';
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;
    ELSIF TG_TABLE_NAME = 'student_family_details' THEN
        v_section := 'family';
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;
    ELSIF TG_TABLE_NAME = 'student_education_details' THEN
        v_section := 'education';
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;
    ELSIF TG_TABLE_NAME = 'student_skills_goals' THEN
        v_section := 'skills';
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;
    ELSIF TG_TABLE_NAME = 'student_achievements' THEN
        v_section := 'achievements';
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;
    ELSIF TG_TABLE_NAME = 'students' THEN
        v_section := 'photo';
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
        
        -- On UPDATE of students, only validate deadline if avatar_url is actually being changed
        IF TG_OP = 'UPDATE' AND NEW.avatar_url IS NOT DISTINCT FROM OLD.avatar_url THEN
            RETURN NEW;
        END IF;
    ELSE
        v_section := TG_TABLE_NAME;
        v_student_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.student_id ELSE NEW.student_id END;
    END IF;

    -- 3. Fetch global editing deadline from system settings
    SELECT (value->>'deadline')::timestamptz INTO v_deadline
    FROM public.system_settings 
    WHERE key = 'profile_edit_deadline';

    -- 4. If deadline is configured and has passed, check for active administrative override
    -- Compares TIMESTAMPTZ values directly using now()
    IF v_deadline IS NOT NULL AND now() > v_deadline THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM public.student_edit_overrides
            WHERE student_id = v_student_id
              AND (section = v_section OR section = 'all')
              AND allowed_until > now()
        ) THEN
            RAISE EXCEPTION 'Academic editing deadline (%) has expired for section "%". Contact faculty mentor for an administrative override.', v_deadline, v_section;
        END IF;
    END IF;

    -- 5. Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach deadline triggers to profile section tables
DROP TRIGGER IF EXISTS trg_deadline_personal ON public.student_personal_details;
CREATE TRIGGER trg_deadline_personal
BEFORE INSERT OR UPDATE ON public.student_personal_details
FOR EACH ROW EXECUTE FUNCTION public.check_student_profile_deadline();

DROP TRIGGER IF EXISTS trg_deadline_family ON public.student_family_details;
CREATE TRIGGER trg_deadline_family
BEFORE INSERT OR UPDATE ON public.student_family_details
FOR EACH ROW EXECUTE FUNCTION public.check_student_profile_deadline();

DROP TRIGGER IF EXISTS trg_deadline_education ON public.student_education_details;
CREATE TRIGGER trg_deadline_education
BEFORE INSERT OR UPDATE ON public.student_education_details
FOR EACH ROW EXECUTE FUNCTION public.check_student_profile_deadline();

DROP TRIGGER IF EXISTS trg_deadline_skills ON public.student_skills_goals;
CREATE TRIGGER trg_deadline_skills
BEFORE INSERT OR UPDATE ON public.student_skills_goals
FOR EACH ROW EXECUTE FUNCTION public.check_student_profile_deadline();

-- Ensure achievements trigger intercepts INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS trg_deadline_achievements ON public.student_achievements;
CREATE TRIGGER trg_deadline_achievements
BEFORE INSERT OR UPDATE OR DELETE ON public.student_achievements
FOR EACH ROW EXECUTE FUNCTION public.check_student_profile_deadline();

-- Ensure profile photo changes on public.students respect editing deadline
DROP TRIGGER IF EXISTS trg_deadline_students_photo ON public.students;
CREATE TRIGGER trg_deadline_students_photo
BEFORE UPDATE OF avatar_url ON public.students
FOR EACH ROW EXECUTE FUNCTION public.check_student_profile_deadline();
