-- ==============================================================================
-- MIGRATION: 20261025160000_student_invitations_log.sql
-- DESCRIPTION: Server-side persistent invitation logging for student mentee onboarding.
--
-- SAFETY & AUDIT COMPLIANCE:
-- 1. Strictly restricted to Faculty Administrators via public.is_admin() RLS policy.
-- 2. Explicit permission grants to authenticated and service_role; all anonymous
--    and student direct access revoked.
-- 3. AUDIT PRESERVATION: Uses ON DELETE SET NULL for student_id so that invitation
--    audit logs are NEVER automatically deleted if a student roster entry is removed.
-- 4. EMAIL CORRECTIONS: Keyed uniquely by roll_number (uq_student_invitations_roll)
--    so administrative corrections to student email addresses update the current
--    dispatch address while preserving the entire prior attempt history in JSONB.
-- 5. Full audit trail of dispatch results, error messages, resend counts, admin IDs,
--    and delivery status distinctions.
-- 6. Self-contained trigger function set_student_invitations_timestamp() ensures
--    safe, idempotent execution without external trigger function dependencies.
-- 7. TIMESTAMPTZ columns use standard now() defaults without unnecessary conversions.
--
-- NOTE: Prepared for faculty review. DO NOT execute without approval.
-- ==============================================================================

-- 1. Create public.student_invitations table
CREATE TABLE IF NOT EXISTS public.student_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    roll_number TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'accepted')),
    dispatch_result JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    resend_count INTEGER NOT NULL DEFAULT 0,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_invitations_roll UNIQUE (roll_number)
);

-- 2. Indexes for rapid lookups during roster display and invitation checks
CREATE INDEX IF NOT EXISTS idx_student_invitations_student_id ON public.student_invitations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_invitations_roll ON public.student_invitations(roll_number);
CREATE INDEX IF NOT EXISTS idx_student_invitations_email ON public.student_invitations(email);
CREATE INDEX IF NOT EXISTS idx_student_invitations_status ON public.student_invitations(status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Explicit Permissions Hardening:
-- Revoke all permissions from public and anon
REVOKE ALL ON public.student_invitations FROM PUBLIC;
REVOKE ALL ON public.student_invitations FROM anon;

-- Grant operational permissions to authenticated role (subject to RLS below)
-- and full management to service_role
GRANT SELECT, INSERT, UPDATE ON public.student_invitations TO authenticated;
GRANT ALL ON public.student_invitations TO service_role;

-- 5. Faculty Administrator Access Policy: Full management restricted strictly to is_admin()
DROP POLICY IF EXISTS "Admins full access student_invitations" ON public.student_invitations;
CREATE POLICY "Admins full access student_invitations"
ON public.student_invitations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Safe, Self-Contained Automated Updated Timestamp Trigger
CREATE OR REPLACE FUNCTION public.set_student_invitations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_student_invitations ON public.student_invitations;
CREATE TRIGGER set_timestamp_student_invitations
BEFORE UPDATE ON public.student_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_student_invitations_timestamp();
