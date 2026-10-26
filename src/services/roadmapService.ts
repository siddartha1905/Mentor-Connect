import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type RoadmapCategory =
  | 'completed'
  | 'in_progress'
  | 'pending'
  | 'deferred'
  | 'removed'
  | 'idea'

export type RoadmapPriority = 'high' | 'medium' | 'low'

export interface RoadmapItem {
  id: string
  title: string
  description: string
  moduleLocation: 'Student Portal' | 'Admin Portal' | 'Landing Page' | 'Database & Security'
  category: RoadmapCategory
  priority: RoadmapPriority
  reasonRemovedOrDeferred?: string
  notes?: string
  tags?: string[]
  dateAdded: string
  updatedAt: string
}

const ROADMAP_STORAGE_KEY = 'mentor_connect_development_roadmap'

// Authoritative initial roadmap items tracking real system state
export const INITIAL_ROADMAP_ITEMS: RoadmapItem[] = [
  // 1. COMPLETED & VERIFIED
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Student Profile Direct Save (Sections B through G)',
    description: 'Direct saving of personal details, family background, academic history, technical/soft skills, and achievements to Supabase.',
    moduleLocation: 'Student Portal',
    category: 'completed',
    priority: 'high',
    notes: 'Verified with real Test Pilot Student. Section A (Basic Identity) is institutionally locked.',
    tags: ['verified', 'database-backed', 'active'],
    dateAdded: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Mentor 360° Real Supabase Student Integration',
    description: 'Administrator console loads verified student records directly from public.students, supporting live search by name, roll number, and email.',
    moduleLocation: 'Admin Portal',
    category: 'completed',
    priority: 'high',
    notes: 'Replaced fictional demo students with real database records. Test Pilot Student displays actual photo and saved sections.',
    tags: ['verified', 'database-backed', 'active'],
    dateAdded: '2026-10-25T11:00:00Z',
    updatedAt: '2026-10-25T11:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    title: 'Profile Deadline Enforcement (Nov 3, 2026 IST)',
    description: 'PostgreSQL trigger (check_student_profile_deadline) compares now() with system_settings deadline, with active student_edit_overrides support.',
    moduleLocation: 'Database & Security',
    category: 'completed',
    priority: 'high',
    notes: 'Configured for November 3, 2026, 11:59:59 PM IST. Protects avatar photo updates, achievements, and all profile sections.',
    tags: ['verified', 'database-backed', 'security'],
    dateAdded: '2026-10-25T12:00:00Z',
    updatedAt: '2026-10-25T12:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    title: 'Announcement Management with Safe Markdown & Live Preview',
    description: 'Admin editor with bold, italic, bullet lists, numbered lists, faculty signatures, contact blocks, and exact student portal preview.',
    moduleLocation: 'Admin Portal',
    category: 'completed',
    priority: 'high',
    notes: 'Pure-React tokenizer without dangerouslySetInnerHTML. Preserves paragraph breaks and line spacing.',
    tags: ['verified', 'database-backed', 'active'],
    dateAdded: '2026-10-25T15:00:00Z',
    updatedAt: '2026-10-25T15:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    title: 'Student Directory Privacy & Phone/Email Isolation',
    description: 'Database view and RLS policies ensuring student telephone numbers and email addresses are hidden unless explicitly shared.',
    moduleLocation: 'Database & Security',
    category: 'completed',
    priority: 'high',
    notes: 'student_directory_view enforces share_phone_in_directory and share_email_in_directory opt-in flags.',
    tags: ['verified', 'database-backed', 'security'],
    dateAdded: '2026-10-25T08:00:00Z',
    updatedAt: '2026-10-25T08:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    title: 'Minimal Faculty Mentoring Landing Page',
    description: 'Simplified landing page with approved tagline, description, responsive header, dual login cards, and PWA capabilities.',
    moduleLocation: 'Landing Page',
    category: 'completed',
    priority: 'medium',
    notes: 'Tagline: "A place to share. A path to grow." Fictional demo buttons and technical stage banners removed.',
    tags: ['verified', 'active'],
    dateAdded: '2026-10-25T09:00:00Z',
    updatedAt: '2026-10-25T09:00:00Z',
  },

  // 2. IN PROGRESS / PENDING
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Faculty Mentor Advice & Direct Guidance Notes',
    description: 'Faculty mentor direct notes and guidance delivered directly to mentee homepages.',
    moduleLocation: 'Student Portal',
    category: 'pending',
    priority: 'high',
    notes: 'Can currently be broadcast using Announcements. 1-on-1 private notes scheduled for phase 2.',
    tags: ['active-priority'],
    dateAdded: '2026-10-25T16:00:00Z',
    updatedAt: '2026-10-25T16:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Bulk CSV Student Roster Schema Standardization',
    description: 'Support importing institution-provided Excel/CSV student rosters with automatic column mapping.',
    moduleLocation: 'Admin Portal',
    category: 'in_progress',
    priority: 'high',
    notes: 'StudentList currently supports CSV import; awaiting final department roster column order.',
    tags: ['database-integration', 'onboarding'],
    dateAdded: '2026-10-25T16:30:00Z',
    updatedAt: '2026-10-25T16:30:00Z',
  },

  // 3. DEFERRED / FUTURE IMPLEMENTATIONS
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    title: 'Daily and Weekly Mood/Check-in Pulse',
    description: 'Interactive self-reflection pulse checking student academic stress, wellbeing, and mood.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Hidden from StudentHome to eliminate fictional tracking. Revisit after real student onboarding when scheduled crons and mentor review workflows are finalized.',
    notes: 'Component code preserved in src/features/student/StudentCheckIn.tsx.',
    tags: ['hidden-from-nav', 'code-preserved', 'real-onboarding-dependent'],
    dateAdded: '2026-10-25T17:00:00Z',
    updatedAt: '2026-10-25T17:00:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    title: 'Self-Reported Attendance & Weekly Attendance Hub',
    description: 'Students self-reporting daily class attendance with faculty threshold monitoring.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'medium',
    reasonRemovedOrDeferred: 'Awaiting official institutional attendance data policy. Institutional attendance must come from the official biometric/ERP roster, not student self-reports.',
    notes: 'Attendance card currently shows clean "Not yet available" state until official data is imported.',
    tags: ['hidden-from-nav', 'institutional-policy'],
    dateAdded: '2026-10-25T17:05:00Z',
    updatedAt: '2026-10-25T17:05:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    title: 'Mentoring Calendar & 1-on-1 Slot Booking',
    description: 'Interactive calendar for scheduling in-person faculty mentoring discussions.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Hidden from student navigation; 1-on-1 scheduling will be coordinated directly by faculty mentor during initial term onboarding.',
    notes: 'Component preserved in StudentCalendar.tsx and AdminLayout.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:10:00Z',
    updatedAt: '2026-10-25T17:10:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    title: 'Upcoming Mentoring Discussions & Agenda Booking',
    description: 'Pre-session agenda submission allowing students to specify challenges prior to face-to-face meetings.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'medium',
    reasonRemovedOrDeferred: 'Deferred until students complete basic profile onboarding (Sections B-G) and semester 2-1 classes stabilize.',
    notes: 'Will be linked with Faculty Mentor Advice feature.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:12:00Z',
    updatedAt: '2026-10-25T17:12:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000005',
    title: 'Mentoring Commitments & Action Item Tracker',
    description: 'Student and mentor co-signed action items and quarterly academic commitment milestones.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Deferred to avoid overwhelming mentees during initial onboarding. Priority is verified profile completion.',
    notes: 'Code structure preserved in StudentJourney.tsx.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:14:00Z',
    updatedAt: '2026-10-25T17:14:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000006',
    title: 'Advanced Academic Records & Examination Branch Sync',
    description: 'Automated semester GPA calculation, credit auditing, and backlog tracking.',
    moduleLocation: 'Admin Portal',
    category: 'deferred',
    priority: 'medium',
    reasonRemovedOrDeferred: 'Examination branch publishes grades at semester end. Academic progress card shows clean pending state until official marksheets are uploaded.',
    notes: 'AcademicManagement.tsx code preserved in repository.',
    tags: ['hidden-from-nav', 'code-preserved', 'exam-branch-dependent'],
    dateAdded: '2026-10-25T17:15:00Z',
    updatedAt: '2026-10-25T17:15:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000007',
    title: 'Automated Mentor & AI Recommendation Engine',
    description: 'Rule-based or AI-assisted mentoring suggestions based on student survey responses and academic history.',
    moduleLocation: 'Admin Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Requires verified student historical data and mentor oversight. Hidden from sidebar to avoid demonstration-only AI claims.',
    notes: 'AutomatedMentor.tsx code preserved.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:20:00Z',
    updatedAt: '2026-10-25T17:20:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000008',
    title: 'Student Direct Messaging Enhancements',
    description: 'Threaded in-app chat between student and faculty mentor with read receipts.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Faculty mentor contact (phone & email) is directly provided on StudentHome. Real-time in-app chat deferred to avoid unmonitored notification channels.',
    notes: 'StudentMessages.tsx code preserved.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:22:00Z',
    updatedAt: '2026-10-25T17:22:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000009',
    title: 'Advanced Attendance Monitoring Hub',
    description: 'Biometric device synchronization, automated condonation calculation, and parental SMS notification rules.',
    moduleLocation: 'Admin Portal',
    category: 'deferred',
    priority: 'medium',
    reasonRemovedOrDeferred: 'Dependent on college administration data exchange protocols. Attendance threshold policy displayed clearly on Admin Dashboard instead.',
    notes: 'AttendanceManagement.tsx code preserved.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:24:00Z',
    updatedAt: '2026-10-25T17:24:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000010',
    title: 'Student Surveys & Feedback Questionnaires',
    description: 'Pre-counselling questionnaires, career interest surveys, and feedback forms.',
    moduleLocation: 'Student Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Hidden from active student navigation until profile onboarding deadline (Nov 3) passes.',
    notes: 'SurveyManagement.tsx and StudentSurveys.tsx code preserved.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:25:00Z',
    updatedAt: '2026-10-25T17:25:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000011',
    title: 'Growth & Co-Curricular Portfolio Tracking',
    description: 'Longitudinal record of certifications, hackathons, and extracurricular growth.',
    moduleLocation: 'Admin Portal',
    category: 'deferred',
    priority: 'low',
    reasonRemovedOrDeferred: 'Section G (Achievements) already captures student certifications directly. Dedicated portfolio module hidden from primary sidebar.',
    notes: 'GrowthActivities.tsx code preserved.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:30:00Z',
    updatedAt: '2026-10-25T17:30:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000012',
    title: 'PDF & Bulk Comprehensive Mentee Dossier Export',
    description: 'One-click generation of printable 4-page departmental mentoring dossiers for accreditation review.',
    moduleLocation: 'Admin Portal',
    category: 'deferred',
    priority: 'medium',
    reasonRemovedOrDeferred: 'ReportsManagement module hidden from primary sidebar. Single-student dossier export available in Mentor 360°.',
    notes: 'ReportsManagement.tsx code preserved.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:35:00Z',
    updatedAt: '2026-10-25T17:35:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000013',
    title: 'Mentoring Workflow & Session Documentation Hub',
    description: 'Structured form for recording discussion notes, action points, and recommendations during scheduled counselling.',
    moduleLocation: 'Admin Portal',
    category: 'deferred',
    priority: 'medium',
    reasonRemovedOrDeferred: 'Faculty mentor will record notes directly in Mentor 360° mentee views once initial onboarding is complete.',
    notes: 'MentoringWorkflow.tsx code preserved in repository.',
    tags: ['hidden-from-nav', 'code-preserved'],
    dateAdded: '2026-10-25T17:40:00Z',
    updatedAt: '2026-10-25T17:40:00Z',
  },

  // 4. REMOVED FEATURES (INTENTIONALLY ELIMINATED)
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    title: 'Landing Page Tech News & AI Articles',
    description: 'External tech news feed and AI industry updates on public homepage.',
    moduleLocation: 'Landing Page',
    category: 'removed',
    priority: 'low',
    reasonRemovedOrDeferred: 'Unnecessary promotional language, RSS clutter, and distraction from faculty mentoring purpose.',
    notes: 'Removed during landing page simplification.',
    tags: ['intentional-removal', 'simplified'],
    dateAdded: '2026-10-25T09:30:00Z',
    updatedAt: '2026-10-25T09:30:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    title: 'Seven-Step Mentoring Cycle & Architecture Previews',
    description: 'Oversized cycle diagram, Stage 1/2 developer banners, and promotional demo notices.',
    moduleLocation: 'Landing Page',
    category: 'removed',
    priority: 'medium',
    reasonRemovedOrDeferred: 'Removed to make Mentor Connect an authentic, professional faculty space rather than a software demo.',
    notes: 'Landing page now features clean value proposition and verified faculty identity.',
    tags: ['intentional-removal', 'simplified'],
    dateAdded: '2026-10-25T09:45:00Z',
    updatedAt: '2026-10-25T09:45:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    title: 'Fictional Quote Cards & Thought for Today',
    description: 'Motivational quote cards and sample inspirational phrases on StudentHome.',
    moduleLocation: 'Student Portal',
    category: 'removed',
    priority: 'low',
    reasonRemovedOrDeferred: 'Removed to make student portal clean, serious, and purposeful.',
    notes: 'Removed in Student Portal cleanup.',
    tags: ['intentional-removal', 'simplified'],
    dateAdded: '2026-10-25T13:00:00Z',
    updatedAt: '2026-10-25T13:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    title: 'Fictional Student Accounts & Demo Data',
    description: 'Mock student records (e.g. Aarav Sharma, Divya Sri Patnala) hardcoded in demo arrays.',
    moduleLocation: 'Admin Portal',
    category: 'removed',
    priority: 'high',
    reasonRemovedOrDeferred: 'Strict prohibition on fictional data. Admin and Mentor 360° now connect solely to real Supabase students.',
    notes: 'Zero mock student collision with Test Pilot Student.',
    tags: ['intentional-removal', 'security'],
    dateAdded: '2026-10-25T11:30:00Z',
    updatedAt: '2026-10-25T11:30:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    title: 'Hardcoded 38 Mentees & Fake 2 Pending Approvals',
    description: 'Hardcoded metric numbers in AdminDashboard and AdminLayout sidebar.',
    moduleLocation: 'Admin Portal',
    category: 'removed',
    priority: 'high',
    reasonRemovedOrDeferred: 'Misleading metrics replaced with actual counts distinguishing roster, invites, linked auth, activated accounts, and pending profile approvals.',
    notes: 'Removed in Admin Dashboard simplification.',
    tags: ['intentional-removal', 'real-data'],
    dateAdded: '2026-10-25T21:00:00Z',
    updatedAt: '2026-10-25T21:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    title: 'Fictional KR Administrator Avatar & Identity',
    description: 'Incorrect "KR" avatar initials and Dr. K. S. Rao chief mentor references.',
    moduleLocation: 'Admin Portal',
    category: 'removed',
    priority: 'high',
    reasonRemovedOrDeferred: 'Replaced with verified faculty mentor identity: J. Siddartha Varma, Assistant Professor, CSE (Data Science).',
    notes: 'Avatar initials updated to SV with accurate contact details.',
    tags: ['intentional-removal', 'identity-verified'],
    dateAdded: '2026-10-25T21:15:00Z',
    updatedAt: '2026-10-25T21:15:00Z',
  },
]

export const ROADMAP_DETERMINISTIC_UUID_MAP: Record<string, string> = {
  'rdm-c-1': 'c0000000-0000-0000-0000-000000000001',
  'rdm-c-2': 'c0000000-0000-0000-0000-000000000002',
  'rdm-c-3': 'c0000000-0000-0000-0000-000000000003',
  'rdm-c-4': 'c0000000-0000-0000-0000-000000000004',
  'rdm-c-5': 'c0000000-0000-0000-0000-000000000005',
  'rdm-c-6': 'c0000000-0000-0000-0000-000000000006',
  'rdm-p-1': 'b0000000-0000-0000-0000-000000000001',
  'rdm-p-2': 'b0000000-0000-0000-0000-000000000002',
  'rdm-d-1': 'd0000000-0000-0000-0000-000000000001',
  'rdm-d-2': 'd0000000-0000-0000-0000-000000000002',
  'rdm-d-3': 'd0000000-0000-0000-0000-000000000003',
  'rdm-d-4': 'd0000000-0000-0000-0000-000000000004',
  'rdm-d-5': 'd0000000-0000-0000-0000-000000000005',
  'rdm-d-6': 'd0000000-0000-0000-0000-000000000006',
  'rdm-d-7': 'd0000000-0000-0000-0000-000000000007',
  'rdm-d-8': 'd0000000-0000-0000-0000-000000000008',
  'rdm-d-9': 'd0000000-0000-0000-0000-000000000009',
  'rdm-d-10': 'd0000000-0000-0000-0000-000000000010',
  'rdm-d-11': 'd0000000-0000-0000-0000-000000000011',
  'rdm-d-12': 'd0000000-0000-0000-0000-000000000012',
  'rdm-d-13': 'd0000000-0000-0000-0000-000000000013',
  'rdm-r-1': 'e0000000-0000-0000-0000-000000000001',
  'rdm-r-2': 'e0000000-0000-0000-0000-000000000002',
  'rdm-r-3': 'e0000000-0000-0000-0000-000000000003',
  'rdm-r-4': 'e0000000-0000-0000-0000-000000000004',
  'rdm-r-5': 'e0000000-0000-0000-0000-000000000005',
  'rdm-r-6': 'e0000000-0000-0000-0000-000000000006',
}

function getLocalRoadmap(): RoadmapItem[] {
  if (typeof window === 'undefined') return INITIAL_ROADMAP_ITEMS
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(INITIAL_ROADMAP_ITEMS))
      return INITIAL_ROADMAP_ITEMS
    }
    const parsed = JSON.parse(raw) as RoadmapItem[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Migrate legacy string IDs to valid UUIDs if needed
      return parsed.map((item) => ({
        ...item,
        id: ROADMAP_DETERMINISTIC_UUID_MAP[item.id] || item.id,
      }))
    }
    return INITIAL_ROADMAP_ITEMS
  } catch {
    return INITIAL_ROADMAP_ITEMS
  }
}

function saveLocalRoadmap(items: RoadmapItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export interface RoadmapMutationResult<T> {
  data: T | null
  persistedToSupabase: boolean
  error?: string | null
}

export const roadmapService = {
  // Check if Supabase development_roadmap table exists and is accessible
  async checkDatabaseStatus(): Promise<{
    connected: boolean
    tableExists: boolean
    isSecuredByRls?: boolean
    error?: string
  }> {
    if (!isSupabaseConfigured()) {
      return { connected: false, tableExists: false, error: 'Supabase credentials not configured' }
    }
    try {
      const { error } = await supabase
        .from('development_roadmap')
        .select('id')
        .limit(1)

      if (error) {
        // 42501 = Permission denied due to RLS/REVOKE for anon role. Proves table exists in Supabase PostgreSQL!
        if (error.code === '42501') {
          return { connected: true, tableExists: true, isSecuredByRls: true }
        }
        // 42P01 = undefined_table (relation does not exist)
        if (error.code === '42P01') {
          return {
            connected: true,
            tableExists: false,
            error: 'Table public.development_roadmap has not been created yet in Supabase.',
          }
        }
        return { connected: true, tableExists: false, error: error.message }
      }
      return { connected: true, tableExists: true, isSecuredByRls: false }
    } catch (err: any) {
      return { connected: true, tableExists: false, error: err?.message || 'Database error' }
    }
  },

  // Fetch all roadmap items (combining database source-of-truth with local preservation)
  async getAllItems(): Promise<{ items: RoadmapItem[]; fromSupabase: boolean; error?: string }> {
    const local = getLocalRoadmap()
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('development_roadmap')
          .select('*')
          .order('date_added', { ascending: false })

        if (!error && data && data.length > 0) {
          const mapped: RoadmapItem[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            moduleLocation: d.module_location,
            category: d.category,
            priority: d.priority,
            reasonRemovedOrDeferred: d.reason_removed_or_deferred,
            notes: d.notes,
            tags: d.tags || [],
            dateAdded: d.date_added,
            updatedAt: d.updated_at,
          }))

          // Safeguard: Check if local storage contains custom items not yet in Supabase
          const supabaseTitles = new Set(mapped.map((m) => m.title.toLowerCase().trim()))
          const customLocalItems = local.filter(
            (l) => !supabaseTitles.has(l.title.toLowerCase().trim())
          )

          const merged = [...mapped, ...customLocalItems]
          saveLocalRoadmap(merged)
          return { items: merged, fromSupabase: true }
        } else if (!error && data && data.length === 0) {
          // Table exists but is empty before SQL import
          return { items: local, fromSupabase: false }
        } else if (error) {
          return { items: local, fromSupabase: false, error: error.message }
        }
      } catch (err: any) {
        return { items: local, fromSupabase: false, error: err?.message }
      }
    }

    return { items: local, fromSupabase: false }
  },

  // Add new item with reliable error reporting and valid UUIDs
  async addItem(
    item: Omit<RoadmapItem, 'id' | 'dateAdded' | 'updatedAt'>
  ): Promise<RoadmapMutationResult<RoadmapItem>> {
    const now = new Date().toISOString()
    const generatedUuid =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined
    const safeUuid =
      generatedUuid ||
      'a0000000-' +
        Math.floor(Math.random() * 0xffff)
          .toString(16)
          .padStart(4, '0') +
        '-4000-8000-' +
        Date.now().toString(16).padStart(12, '0')

    const newItem: RoadmapItem = {
      ...item,
      id: safeUuid,
      dateAdded: now,
      updatedAt: now,
    }

    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          id: safeUuid,
          title: newItem.title,
          description: newItem.description,
          module_location: newItem.moduleLocation,
          category: newItem.category,
          priority: newItem.priority,
          reason_removed_or_deferred: newItem.reasonRemovedOrDeferred || null,
          notes: newItem.notes || null,
          tags: newItem.tags || [],
          date_added: newItem.dateAdded,
          updated_at: newItem.updatedAt,
        }

        const { data, error } = await supabase
          .from('development_roadmap')
          .insert(payload)
          .select()
          .single()

        if (!error && data) {
          const itemWithDbId = { ...newItem, id: data.id }
          const local = getLocalRoadmap()
          saveLocalRoadmap([itemWithDbId, ...local.filter((it) => it.id !== itemWithDbId.id)])
          return { data: itemWithDbId, persistedToSupabase: true }
        } else if (error) {
          const local = getLocalRoadmap()
          saveLocalRoadmap([newItem, ...local])
          return {
            data: newItem,
            persistedToSupabase: false,
            error: `Supabase persistence failed (${error.message}). Saved to local cache.`,
          }
        }
      } catch (err: any) {
        const local = getLocalRoadmap()
        saveLocalRoadmap([newItem, ...local])
        return {
          data: newItem,
          persistedToSupabase: false,
          error: `Supabase network error: ${err?.message || 'Unknown'}. Saved to local cache.`,
        }
      }
    }

    const local = getLocalRoadmap()
    saveLocalRoadmap([newItem, ...local])
    return { data: newItem, persistedToSupabase: false, error: 'Supabase not configured' }
  },

  // Update item with reliable error reporting and title-fallback support
  async updateItem(
    id: string,
    updates: Partial<RoadmapItem>
  ): Promise<RoadmapMutationResult<RoadmapItem>> {
    const now = new Date().toISOString()
    const local = getLocalRoadmap()
    const target = local.find((it) => it.id === id)
    const updatedLocalItem: RoadmapItem = target
      ? { ...target, ...updates, updatedAt: now }
      : {
          id,
          title: updates.title || '',
          description: updates.description || '',
          moduleLocation: updates.moduleLocation || 'Student Portal',
          category: updates.category || 'pending',
          priority: updates.priority || 'medium',
          ...updates,
          dateAdded: now,
          updatedAt: now,
        }

    if (isSupabaseConfigured()) {
      try {
        const payload: any = { updated_at: now }
        if (updates.title !== undefined) payload.title = updates.title
        if (updates.description !== undefined) payload.description = updates.description
        if (updates.category !== undefined) payload.category = updates.category
        if (updates.priority !== undefined) payload.priority = updates.priority
        if (updates.reasonRemovedOrDeferred !== undefined)
          payload.reason_removed_or_deferred = updates.reasonRemovedOrDeferred
        if (updates.notes !== undefined) payload.notes = updates.notes
        if (updates.moduleLocation !== undefined) payload.module_location = updates.moduleLocation
        if (updates.tags !== undefined) payload.tags = updates.tags

        const targetUuid = ROADMAP_DETERMINISTIC_UUID_MAP[id] || id

        let { data, error } = await supabase
          .from('development_roadmap')
          .update(payload)
          .eq('id', targetUuid)
          .select()
          .single()

        // Fallback: If update by ID didn't find the row, match by title
        if (error && target?.title) {
          const res = await supabase
            .from('development_roadmap')
            .update(payload)
            .eq('title', target.title)
            .select()
            .single()
          if (!res.error && res.data) {
            data = res.data
            error = null
          }
        }

        if (!error && data) {
          const persistedItem = { ...updatedLocalItem, id: data.id }
          const updated = local.map((it) => (it.id === id ? persistedItem : it))
          saveLocalRoadmap(updated)
          return { data: persistedItem, persistedToSupabase: true }
        } else if (error) {
          const updated = local.map((it) => (it.id === id ? updatedLocalItem : it))
          saveLocalRoadmap(updated)
          return {
            data: updatedLocalItem,
            persistedToSupabase: false,
            error: `Supabase persistence failed (${error.message}). Saved to local cache.`,
          }
        }
      } catch (err: any) {
        const updated = local.map((it) => (it.id === id ? updatedLocalItem : it))
        saveLocalRoadmap(updated)
        return {
          data: updatedLocalItem,
          persistedToSupabase: false,
          error: `Supabase network error: ${err?.message || 'Unknown'}. Saved to local cache.`,
        }
      }
    }

    const updated = local.map((it) => (it.id === id ? updatedLocalItem : it))
    saveLocalRoadmap(updated)
    return { data: updatedLocalItem, persistedToSupabase: false }
  },

  // Delete item with reliable error reporting
  async deleteItem(id: string): Promise<RoadmapMutationResult<boolean>> {
    let persistedToSupabase = false
    let errorMsg: string | null = null

    if (isSupabaseConfigured()) {
      try {
        const targetUuid = ROADMAP_DETERMINISTIC_UUID_MAP[id] || id
        const { error } = await supabase.from('development_roadmap').delete().eq('id', targetUuid)
        if (!error) {
          persistedToSupabase = true
        } else {
          errorMsg = `Supabase delete failed (${error.message}). Removed from local cache.`
        }
      } catch (err: any) {
        errorMsg = err?.message || 'Database error'
      }
    }

    const local = getLocalRoadmap().filter((it) => it.id !== id)
    saveLocalRoadmap(local)
    return { data: true, persistedToSupabase, error: errorMsg }
  },

  // Export current roadmap entries as formatted JSON for backup preservation
  exportLocalBackup(): string {
    const items = getLocalRoadmap()
    return JSON.stringify(
      {
        version: '1.0',
        system: 'Mentor Connect Development Roadmap',
        exportedAt: new Date().toISOString(),
        itemCount: items.length,
        items,
      },
      null,
      2
    )
  },

  // Import roadmap entries from JSON with duplicate prevention
  async importLocalBackup(
    jsonStr: string
  ): Promise<{ success: boolean; importedCount: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonStr)
      const candidateItems: RoadmapItem[] = Array.isArray(parsed) ? parsed : parsed.items
      if (!Array.isArray(candidateItems) || candidateItems.length === 0) {
        return {
          success: false,
          importedCount: 0,
          error: 'Invalid backup file: no roadmap items found in JSON.',
        }
      }

      const local = getLocalRoadmap()
      const existingTitles = new Set(local.map((it) => it.title.toLowerCase().trim()))

      const newItems: RoadmapItem[] = []
      for (const item of candidateItems) {
        if (item.title && item.description && !existingTitles.has(item.title.toLowerCase().trim())) {
          newItems.push({
            id:
              item.id ||
              'a0000000-' +
                Math.floor(Math.random() * 0xffff)
                  .toString(16)
                  .padStart(4, '0') +
                '-4000-8000-' +
                Date.now().toString(16).padStart(12, '0'),
            title: item.title,
            description: item.description,
            moduleLocation: item.moduleLocation || 'Student Portal',
            category: item.category || 'pending',
            priority: item.priority || 'medium',
            reasonRemovedOrDeferred: item.reasonRemovedOrDeferred,
            notes: item.notes,
            tags: item.tags || [],
            dateAdded: item.dateAdded || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          existingTitles.add(item.title.toLowerCase().trim())
        }
      }

      if (newItems.length > 0) {
        const merged = [...newItems, ...local]
        saveLocalRoadmap(merged)
      }

      return { success: true, importedCount: newItems.length }
    } catch (err: any) {
      return {
        success: false,
        importedCount: 0,
        error: err?.message || 'Failed to parse JSON backup.',
      }
    }
  },
}

