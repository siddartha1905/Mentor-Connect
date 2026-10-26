-- ============================================================================
-- MIGRATION: Create Announcements Table with Hardened Role-Based Security
-- Target: public.announcements
-- 
-- Safeguards:
-- 1. Uses CREATE TABLE IF NOT EXISTS to prevent dropping existing tables.
-- 2. Read access permitted ONLY for:
--    - Faculty administrators (public.is_admin() = true)
--    - Active, correctly linked students (public.students.status = 'Active')
--      with the confirmed 'student' role in public.user_roles.
-- 3. Anonymous and unauthorized access strictly blocked.
-- 4. Write access (INSERT, UPDATE, DELETE) restricted strictly to administrators.
-- 5. No dummy or placeholder seeds: clean table ready for genuine faculty notices.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Mentor Update', 'Department Information', 'College Information', 'Important Notice')),
  information_source TEXT,
  published_by_name TEXT NOT NULL DEFAULT 'J. Siddhartha Varma',
  author_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Only administrators and active, correctly linked students with student role
-- can read published announcements. Administrators can also view drafts and archived notices.
DROP POLICY IF EXISTS "Authenticated users can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Linked students and admins can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Active linked students and admins can view published announcements" ON public.announcements;

CREATE POLICY "Active linked students and admins can view published announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.user_id = auth.uid()
          AND s.status = 'Active'
      )
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'student'
      )
    )
  );

-- 2. Insert Policy: Strictly administrators
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3. Update Policy: Strictly administrators
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Delete Policy: Strictly administrators
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Security Grants: Strictly deny anonymous access; allow authenticated Data API access via RLS
REVOKE ALL ON public.announcements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
