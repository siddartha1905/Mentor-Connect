-- ============================================================================
-- MENTOR CONNECT: DEVELOPMENT ROADMAP CATALOG SAFE IDEMPOTENT SQL IMPORT
-- Migration: 20261025150000_import_development_roadmap_catalog.sql
-- Description: Inserts all 27 authoritative Development Roadmap & Feature History
--              entries into public.development_roadmap.
-- Safety: Uses WHERE NOT EXISTS on title to prevent duplicates or overwriting existing records.
-- ============================================================================

-- Entry 1: [COMPLETED] Student Profile Direct Save (Sections B through G) (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'Student Profile Direct Save (Sections B through G)',
    'Direct saving of personal details, family background, academic history, technical/soft skills, and achievements to Supabase.',
    'Student Portal',
    'completed',
    'high',
    NULL,
    'Verified with real Test Pilot Student. Section A (Basic Identity) is institutionally locked.',
    ARRAY['verified', 'database-backed', 'active']::TEXT[],
    '2026-10-25T10:00:00Z'::timestamptz,
    '2026-10-25T10:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Student Profile Direct Save (Sections B through G)'
);

-- Entry 2: [COMPLETED] Mentor 360° Real Supabase Student Integration (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'Mentor 360° Real Supabase Student Integration',
    'Administrator console loads verified student records directly from public.students, supporting live search by name, roll number, and email.',
    'Admin Portal',
    'completed',
    'high',
    NULL,
    'Replaced fictional demo students with real database records. Test Pilot Student displays actual photo and saved sections.',
    ARRAY['verified', 'database-backed', 'active']::TEXT[],
    '2026-10-25T11:00:00Z'::timestamptz,
    '2026-10-25T11:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Mentor 360° Real Supabase Student Integration'
);

-- Entry 3: [COMPLETED] Profile Deadline Enforcement (Nov 3, 2026 IST) (Database & Security)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000003'::uuid,
    'Profile Deadline Enforcement (Nov 3, 2026 IST)',
    'PostgreSQL trigger (check_student_profile_deadline) compares now() with system_settings deadline, with active student_edit_overrides support.',
    'Database & Security',
    'completed',
    'high',
    NULL,
    'Configured for November 3, 2026, 11:59:59 PM IST. Protects avatar photo updates, achievements, and all profile sections.',
    ARRAY['verified', 'database-backed', 'security']::TEXT[],
    '2026-10-25T12:00:00Z'::timestamptz,
    '2026-10-25T12:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Profile Deadline Enforcement (Nov 3, 2026 IST)'
);

-- Entry 4: [COMPLETED] Announcement Management with Safe Markdown & Live Preview (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000004'::uuid,
    'Announcement Management with Safe Markdown & Live Preview',
    'Admin editor with bold, italic, bullet lists, numbered lists, faculty signatures, contact blocks, and exact student portal preview.',
    'Admin Portal',
    'completed',
    'high',
    NULL,
    'Pure-React tokenizer without dangerouslySetInnerHTML. Preserves paragraph breaks and line spacing.',
    ARRAY['verified', 'database-backed', 'active']::TEXT[],
    '2026-10-25T15:00:00Z'::timestamptz,
    '2026-10-25T15:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Announcement Management with Safe Markdown & Live Preview'
);

-- Entry 5: [COMPLETED] Student Directory Privacy & Phone/Email Isolation (Database & Security)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000005'::uuid,
    'Student Directory Privacy & Phone/Email Isolation',
    'Database view and RLS policies ensuring student telephone numbers and email addresses are hidden unless explicitly shared.',
    'Database & Security',
    'completed',
    'high',
    NULL,
    'student_directory_view enforces share_phone_in_directory and share_email_in_directory opt-in flags.',
    ARRAY['verified', 'database-backed', 'security']::TEXT[],
    '2026-10-25T08:00:00Z'::timestamptz,
    '2026-10-25T08:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Student Directory Privacy & Phone/Email Isolation'
);

-- Entry 6: [COMPLETED] Minimal Faculty Mentoring Landing Page (Landing Page)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'c0000000-0000-0000-0000-000000000006'::uuid,
    'Minimal Faculty Mentoring Landing Page',
    'Simplified landing page with approved tagline, description, responsive header, dual login cards, and PWA capabilities.',
    'Landing Page',
    'completed',
    'medium',
    NULL,
    'Tagline: "A place to share. A path to grow." Fictional demo buttons and technical stage banners removed.',
    ARRAY['verified', 'active']::TEXT[],
    '2026-10-25T09:00:00Z'::timestamptz,
    '2026-10-25T09:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Minimal Faculty Mentoring Landing Page'
);

-- Entry 7: [PENDING] Faculty Mentor Advice & Direct Guidance Notes (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'Faculty Mentor Advice & Direct Guidance Notes',
    'Faculty mentor direct notes and guidance delivered directly to mentee homepages.',
    'Student Portal',
    'pending',
    'high',
    NULL,
    'Can currently be broadcast using Announcements. 1-on-1 private notes scheduled for phase 2.',
    ARRAY['active-priority']::TEXT[],
    '2026-10-25T16:00:00Z'::timestamptz,
    '2026-10-25T16:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Faculty Mentor Advice & Direct Guidance Notes'
);

-- Entry 8: [IN_PROGRESS] Bulk CSV Student Roster Schema Standardization (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'b0000000-0000-0000-0000-000000000002'::uuid,
    'Bulk CSV Student Roster Schema Standardization',
    'Support importing institution-provided Excel/CSV student rosters with automatic column mapping.',
    'Admin Portal',
    'in_progress',
    'high',
    NULL,
    'StudentList currently supports CSV import; awaiting final department roster column order.',
    ARRAY['database-integration', 'onboarding']::TEXT[],
    '2026-10-25T16:30:00Z'::timestamptz,
    '2026-10-25T16:30:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Bulk CSV Student Roster Schema Standardization'
);

-- Entry 9: [DEFERRED] Daily and Weekly Mood/Check-in Pulse (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'Daily and Weekly Mood/Check-in Pulse',
    'Interactive self-reflection pulse checking student academic stress, wellbeing, and mood.',
    'Student Portal',
    'deferred',
    'low',
    'Hidden from StudentHome to eliminate fictional tracking. Revisit after real student onboarding when scheduled crons and mentor review workflows are finalized.',
    'Component code preserved in src/features/student/StudentCheckIn.tsx.',
    ARRAY['hidden-from-nav', 'code-preserved', 'real-onboarding-dependent']::TEXT[],
    '2026-10-25T17:00:00Z'::timestamptz,
    '2026-10-25T17:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Daily and Weekly Mood/Check-in Pulse'
);

-- Entry 10: [DEFERRED] Self-Reported Attendance & Weekly Attendance Hub (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000002'::uuid,
    'Self-Reported Attendance & Weekly Attendance Hub',
    'Students self-reporting daily class attendance with faculty threshold monitoring.',
    'Student Portal',
    'deferred',
    'medium',
    'Awaiting official institutional attendance data policy. Institutional attendance must come from the official biometric/ERP roster, not student self-reports.',
    'Attendance card currently shows clean "Not yet available" state until official data is imported.',
    ARRAY['hidden-from-nav', 'institutional-policy']::TEXT[],
    '2026-10-25T17:05:00Z'::timestamptz,
    '2026-10-25T17:05:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Self-Reported Attendance & Weekly Attendance Hub'
);

-- Entry 11: [DEFERRED] Mentoring Calendar & 1-on-1 Slot Booking (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000003'::uuid,
    'Mentoring Calendar & 1-on-1 Slot Booking',
    'Interactive calendar for scheduling in-person faculty mentoring discussions.',
    'Student Portal',
    'deferred',
    'low',
    'Hidden from student navigation; 1-on-1 scheduling will be coordinated directly by faculty mentor during initial term onboarding.',
    'Component preserved in StudentCalendar.tsx and AdminLayout.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:10:00Z'::timestamptz,
    '2026-10-25T17:10:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Mentoring Calendar & 1-on-1 Slot Booking'
);

-- Entry 12: [DEFERRED] Upcoming Mentoring Discussions & Agenda Booking (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000004'::uuid,
    'Upcoming Mentoring Discussions & Agenda Booking',
    'Pre-session agenda submission allowing students to specify challenges prior to face-to-face meetings.',
    'Student Portal',
    'deferred',
    'medium',
    'Deferred until students complete basic profile onboarding (Sections B-G) and semester 2-1 classes stabilize.',
    'Will be linked with Faculty Mentor Advice feature.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:12:00Z'::timestamptz,
    '2026-10-25T17:12:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Upcoming Mentoring Discussions & Agenda Booking'
);

-- Entry 13: [DEFERRED] Mentoring Commitments & Action Item Tracker (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000005'::uuid,
    'Mentoring Commitments & Action Item Tracker',
    'Student and mentor co-signed action items and quarterly academic commitment milestones.',
    'Student Portal',
    'deferred',
    'low',
    'Deferred to avoid overwhelming mentees during initial onboarding. Priority is verified profile completion.',
    'Code structure preserved in StudentJourney.tsx.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:14:00Z'::timestamptz,
    '2026-10-25T17:14:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Mentoring Commitments & Action Item Tracker'
);

-- Entry 14: [DEFERRED] Advanced Academic Records & Examination Branch Sync (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000006'::uuid,
    'Advanced Academic Records & Examination Branch Sync',
    'Automated semester GPA calculation, credit auditing, and backlog tracking.',
    'Admin Portal',
    'deferred',
    'medium',
    'Examination branch publishes grades at semester end. Academic progress card shows clean pending state until official marksheets are uploaded.',
    'AcademicManagement.tsx code preserved in repository.',
    ARRAY['hidden-from-nav', 'code-preserved', 'exam-branch-dependent']::TEXT[],
    '2026-10-25T17:15:00Z'::timestamptz,
    '2026-10-25T17:15:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Advanced Academic Records & Examination Branch Sync'
);

-- Entry 15: [DEFERRED] Automated Mentor & AI Recommendation Engine (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000007'::uuid,
    'Automated Mentor & AI Recommendation Engine',
    'Rule-based or AI-assisted mentoring suggestions based on student survey responses and academic history.',
    'Admin Portal',
    'deferred',
    'low',
    'Requires verified student historical data and mentor oversight. Hidden from sidebar to avoid demonstration-only AI claims.',
    'AutomatedMentor.tsx code preserved.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:20:00Z'::timestamptz,
    '2026-10-25T17:20:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Automated Mentor & AI Recommendation Engine'
);

-- Entry 16: [DEFERRED] Student Direct Messaging Enhancements (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000008'::uuid,
    'Student Direct Messaging Enhancements',
    'Threaded in-app chat between student and faculty mentor with read receipts.',
    'Student Portal',
    'deferred',
    'low',
    'Faculty mentor contact (phone & email) is directly provided on StudentHome. Real-time in-app chat deferred to avoid unmonitored notification channels.',
    'StudentMessages.tsx code preserved.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:22:00Z'::timestamptz,
    '2026-10-25T17:22:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Student Direct Messaging Enhancements'
);

-- Entry 17: [DEFERRED] Advanced Attendance Monitoring Hub (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000009'::uuid,
    'Advanced Attendance Monitoring Hub',
    'Biometric device synchronization, automated condonation calculation, and parental SMS notification rules.',
    'Admin Portal',
    'deferred',
    'medium',
    'Dependent on college administration data exchange protocols. Attendance threshold policy displayed clearly on Admin Dashboard instead.',
    'AttendanceManagement.tsx code preserved.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:24:00Z'::timestamptz,
    '2026-10-25T17:24:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Advanced Attendance Monitoring Hub'
);

-- Entry 18: [DEFERRED] Student Surveys & Feedback Questionnaires (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000010'::uuid,
    'Student Surveys & Feedback Questionnaires',
    'Pre-counselling questionnaires, career interest surveys, and feedback forms.',
    'Student Portal',
    'deferred',
    'low',
    'Hidden from active student navigation until profile onboarding deadline (Nov 3) passes.',
    'SurveyManagement.tsx and StudentSurveys.tsx code preserved.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:25:00Z'::timestamptz,
    '2026-10-25T17:25:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Student Surveys & Feedback Questionnaires'
);

-- Entry 19: [DEFERRED] Growth & Co-Curricular Portfolio Tracking (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000011'::uuid,
    'Growth & Co-Curricular Portfolio Tracking',
    'Longitudinal record of certifications, hackathons, and extracurricular growth.',
    'Admin Portal',
    'deferred',
    'low',
    'Section G (Achievements) already captures student certifications directly. Dedicated portfolio module hidden from primary sidebar.',
    'GrowthActivities.tsx code preserved.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:30:00Z'::timestamptz,
    '2026-10-25T17:30:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Growth & Co-Curricular Portfolio Tracking'
);

-- Entry 20: [DEFERRED] PDF & Bulk Comprehensive Mentee Dossier Export (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000012'::uuid,
    'PDF & Bulk Comprehensive Mentee Dossier Export',
    'One-click generation of printable 4-page departmental mentoring dossiers for accreditation review.',
    'Admin Portal',
    'deferred',
    'medium',
    'ReportsManagement module hidden from primary sidebar. Single-student dossier export available in Mentor 360°.',
    'ReportsManagement.tsx code preserved.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:35:00Z'::timestamptz,
    '2026-10-25T17:35:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'PDF & Bulk Comprehensive Mentee Dossier Export'
);

-- Entry 21: [DEFERRED] Mentoring Workflow & Session Documentation Hub (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'd0000000-0000-0000-0000-000000000013'::uuid,
    'Mentoring Workflow & Session Documentation Hub',
    'Structured form for recording discussion notes, action points, and recommendations during scheduled counselling.',
    'Admin Portal',
    'deferred',
    'medium',
    'Faculty mentor will record notes directly in Mentor 360° mentee views once initial onboarding is complete.',
    'MentoringWorkflow.tsx code preserved in repository.',
    ARRAY['hidden-from-nav', 'code-preserved']::TEXT[],
    '2026-10-25T17:40:00Z'::timestamptz,
    '2026-10-25T17:40:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Mentoring Workflow & Session Documentation Hub'
);

-- Entry 22: [REMOVED] Landing Page Tech News & AI Articles (Landing Page)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'Landing Page Tech News & AI Articles',
    'External tech news feed and AI industry updates on public homepage.',
    'Landing Page',
    'removed',
    'low',
    'Unnecessary promotional language, RSS clutter, and distraction from faculty mentoring purpose.',
    'Removed during landing page simplification.',
    ARRAY['intentional-removal', 'simplified']::TEXT[],
    '2026-10-25T09:30:00Z'::timestamptz,
    '2026-10-25T09:30:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Landing Page Tech News & AI Articles'
);

-- Entry 23: [REMOVED] Seven-Step Mentoring Cycle & Architecture Previews (Landing Page)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'e0000000-0000-0000-0000-000000000002'::uuid,
    'Seven-Step Mentoring Cycle & Architecture Previews',
    'Oversized cycle diagram, Stage 1/2 developer banners, and promotional demo notices.',
    'Landing Page',
    'removed',
    'medium',
    'Removed to make Mentor Connect an authentic, professional faculty space rather than a software demo.',
    'Landing page now features clean value proposition and verified faculty identity.',
    ARRAY['intentional-removal', 'simplified']::TEXT[],
    '2026-10-25T09:45:00Z'::timestamptz,
    '2026-10-25T09:45:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Seven-Step Mentoring Cycle & Architecture Previews'
);

-- Entry 24: [REMOVED] Fictional Quote Cards & Thought for Today (Student Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'e0000000-0000-0000-0000-000000000003'::uuid,
    'Fictional Quote Cards & Thought for Today',
    'Motivational quote cards and sample inspirational phrases on StudentHome.',
    'Student Portal',
    'removed',
    'low',
    'Removed to make student portal clean, serious, and purposeful.',
    'Removed in Student Portal cleanup.',
    ARRAY['intentional-removal', 'simplified']::TEXT[],
    '2026-10-25T13:00:00Z'::timestamptz,
    '2026-10-25T13:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Fictional Quote Cards & Thought for Today'
);

-- Entry 25: [REMOVED] Fictional Student Accounts & Demo Data (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'e0000000-0000-0000-0000-000000000004'::uuid,
    'Fictional Student Accounts & Demo Data',
    'Mock student records (e.g. Aarav Sharma, Divya Sri Patnala) hardcoded in demo arrays.',
    'Admin Portal',
    'removed',
    'high',
    'Strict prohibition on fictional data. Admin and Mentor 360° now connect solely to real Supabase students.',
    'Zero mock student collision with Test Pilot Student.',
    ARRAY['intentional-removal', 'security']::TEXT[],
    '2026-10-25T11:30:00Z'::timestamptz,
    '2026-10-25T11:30:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Fictional Student Accounts & Demo Data'
);

-- Entry 26: [REMOVED] Hardcoded 38 Mentees & Fake 2 Pending Approvals (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'e0000000-0000-0000-0000-000000000005'::uuid,
    'Hardcoded 38 Mentees & Fake 2 Pending Approvals',
    'Hardcoded metric numbers in AdminDashboard and AdminLayout sidebar.',
    'Admin Portal',
    'removed',
    'high',
    'Misleading metrics replaced with actual counts distinguishing roster, invites, linked auth, activated accounts, and pending profile approvals.',
    'Removed in Admin Dashboard simplification.',
    ARRAY['intentional-removal', 'real-data']::TEXT[],
    '2026-10-25T21:00:00Z'::timestamptz,
    '2026-10-25T21:00:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Hardcoded 38 Mentees & Fake 2 Pending Approvals'
);

-- Entry 27: [REMOVED] Fictional KR Administrator Avatar & Identity (Admin Portal)
INSERT INTO public.development_roadmap (
    id,
    title,
    description,
    module_location,
    category,
    priority,
    reason_removed_or_deferred,
    notes,
    tags,
    date_added,
    updated_at
)
SELECT
    'e0000000-0000-0000-0000-000000000006'::uuid,
    'Fictional KR Administrator Avatar & Identity',
    'Incorrect "KR" avatar initials and Dr. K. S. Rao chief mentor references.',
    'Admin Portal',
    'removed',
    'high',
    'Replaced with verified faculty mentor identity: J. Siddartha Varma, Assistant Professor, CSE (Data Science).',
    'Avatar initials updated to SV with accurate contact details.',
    ARRAY['intentional-removal', 'identity-verified']::TEXT[],
    '2026-10-25T21:15:00Z'::timestamptz,
    '2026-10-25T21:15:00Z'::timestamptz
WHERE NOT EXISTS (
    SELECT 1 FROM public.development_roadmap WHERE title = 'Fictional KR Administrator Avatar & Identity'
);

