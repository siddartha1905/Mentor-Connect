-- ============================================================================
-- MIGRATION: Profile Deadline Management Trigger Hardening & Development Roadmap Workspace
-- Description:
--   1. Enhances public.check_student_profile_deadline() to support controlled global
--      enable/disable toggle (value->>'is_enabled') in public.system_settings.
--   2. Creates public.development_roadmap table for persistent administrator tracking
--      of completed, in-progress, pending, deferred, and removed portal features.
--   3. Hardens RLS policies to restrict roadmap and deadline administration solely
--      to verified administrators.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: Enhanced Profile Deadline Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_student_profile_deadline()
RETURNS TRIGGER AS $$
DECLARE
    v_deadline TIMESTAMPTZ;
    v_is_enabled BOOLEAN;
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

    -- 3. Fetch global editing deadline and enabled toggle from system settings
    SELECT 
        (value->>'deadline')::timestamptz,
        COALESCE((value->>'is_enabled')::boolean, true)
    INTO v_deadline, v_is_enabled
    FROM public.system_settings 
    WHERE key = 'profile_edit_deadline';

    -- 4. Check if editing is locked globally or deadline has passed
    IF (v_is_enabled IS FALSE) OR (v_deadline IS NOT NULL AND now() > v_deadline) THEN
        -- Check if student has active individual override
        IF NOT EXISTS (
            SELECT 1 
            FROM public.student_edit_overrides
            WHERE student_id = v_student_id
              AND (section = v_section OR section = 'all')
              AND allowed_until > now()
        ) THEN
            IF v_is_enabled IS FALSE THEN
                RAISE EXCEPTION 'Student profile editing has been closed by the faculty administrator. Contact your faculty mentor for an individual extension.';
            ELSE
                RAISE EXCEPTION 'Academic editing deadline (%) has expired for section "%". Contact faculty mentor for an administrative override.', v_deadline, v_section;
            END IF;
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

-- ----------------------------------------------------------------------------
-- PART 2: Persistent Development Roadmap Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.development_roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    module_location TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('completed', 'in_progress', 'pending', 'deferred', 'removed', 'idea')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    reason_removed_or_deferred TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    date_added TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_category ON public.development_roadmap(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_module ON public.development_roadmap(module_location);

ALTER TABLE public.development_roadmap ENABLE ROW LEVEL SECURITY;

-- Only authenticated administrators can read, insert, update, or delete roadmap items
DROP POLICY IF EXISTS "Admins full access to development_roadmap" ON public.development_roadmap;
CREATE POLICY "Admins full access to development_roadmap"
ON public.development_roadmap
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Revoke all permissions on roadmap from public / anon
REVOKE ALL ON TABLE public.development_roadmap FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.development_roadmap TO authenticated;

-- ----------------------------------------------------------------------------
-- PART 3: Safe Initialization of is_enabled in system_settings
-- ----------------------------------------------------------------------------
UPDATE public.system_settings
SET value = jsonb_set(
    COALESCE(value, '{}'::jsonb),
    '{is_enabled}',
    'true'::jsonb,
    true
)
WHERE key = 'profile_edit_deadline'
  AND (value->>'is_enabled') IS NULL;

