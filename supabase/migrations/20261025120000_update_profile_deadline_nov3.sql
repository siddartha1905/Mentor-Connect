-- ============================================================================
-- MIGRATION: Update Student Profile Deadline to Tuesday, Nov 3, 2026 11:59:59 PM IST
-- Target: public.system_settings -> profile_edit_deadline
-- Timezone: Asia/Kolkata (UTC+05:30)
-- ISO String: 2026-11-03T23:59:59+05:30
-- UTC Equivalent: 2026-11-03 18:29:59+00
-- Preserves complete trigger functionality including students table (photo changes),
-- achievement deletion, administrator overrides, and direct TIMESTAMPTZ now() comparisons.
-- ============================================================================

-- 1. Update existing key if present
UPDATE public.system_settings
SET 
  value = jsonb_build_object(
    'deadline', '2026-11-03T23:59:59+05:30',
    'timezone', 'Asia/Kolkata',
    'formatted_ist', 'Tuesday, November 3, 2026 at 11:59:59 PM IST',
    'description', 'Student profile editing deadline: Tuesday, November 3, 2026 at 11:59:59 PM IST'
  ),
  description = 'Student profile editing deadline: Tuesday, November 3, 2026 at 11:59:59 PM IST'
WHERE key = 'profile_edit_deadline';

-- 2. Insert row if it does not already exist
INSERT INTO public.system_settings (key, value, description)
SELECT 
  'profile_edit_deadline',
  jsonb_build_object(
    'deadline', '2026-11-03T23:59:59+05:30',
    'timezone', 'Asia/Kolkata',
    'formatted_ist', 'Tuesday, November 3, 2026 at 11:59:59 PM IST',
    'description', 'Student profile editing deadline: Tuesday, November 3, 2026 at 11:59:59 PM IST'
  ),
  'Student profile editing deadline: Tuesday, November 3, 2026 at 11:59:59 PM IST'
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_settings WHERE key = 'profile_edit_deadline'
);

-- 3. Surgical update to public.check_student_profile_deadline()
-- Preserves ALL tables (including students.avatar_url photo changes), achievement deletion,
-- and ensures TIMESTAMPTZ values are compared directly using now()
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
