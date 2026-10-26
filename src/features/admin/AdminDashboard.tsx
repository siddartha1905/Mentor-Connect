import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Clock,
  CheckSquare,
  Compass,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CalendarClock,
  Megaphone,
  UserCheck,
  UserPlus,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  Link2,
  FileCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/app/providers/AuthContext'
import { studentService, type StudentRecord } from '@/services/studentService'
import { deadlineService, type DeadlineSettings } from '@/services/deadlineService'
import { announcementService, type AnnouncementRecord } from '@/services/announcementService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface DashboardMetrics {
  totalRoster: number
  invitationsSentCount: number
  linkedAuthCount: number
  activatedCount: number
  completedProfilesCount: number
  pendingApprovalsCount: number
}

export const AdminDashboard: React.FC = () => {
  const { isConfigured, isDemo } = useAuth()

  const [loading, setLoading] = React.useState(true)
  const [students, setStudents] = React.useState<StudentRecord[]>([])
  const [deadlineSettings, setDeadlineSettings] = React.useState<DeadlineSettings | null>(null)
  const [announcements, setAnnouncements] = React.useState<AnnouncementRecord[]>([])
  const [invitedEmails, setInvitedEmails] = React.useState<Set<string>>(new Set())
  const [activatedEmails, setActivatedEmails] = React.useState<Set<string>>(new Set())
  const [completedStudentIds, setCompletedStudentIds] = React.useState<Set<string>>(new Set())
  const [metrics, setMetrics] = React.useState<DashboardMetrics>({
    totalRoster: 0,
    invitationsSentCount: 0,
    linkedAuthCount: 0,
    activatedCount: 0,
    completedProfilesCount: 0,
    pendingApprovalsCount: 0,
  })

  const loadRealDashboardData = React.useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch real invited & activated tracking from local persistence
      let localInvited = new Set<string>()
      let localActivated = new Set<string>()
      try {
        const invSaved = localStorage.getItem('mentor_connect_invited_emails')
        if (invSaved) localInvited = new Set(JSON.parse(invSaved))
        const actSaved = localStorage.getItem('mentor_connect_activated_emails')
        if (actSaved) localActivated = new Set(JSON.parse(actSaved))
      } catch {
        // ignore
      }
      setInvitedEmails(localInvited)
      setActivatedEmails(localActivated)

      // 2. Fetch all real students, active deadline, announcements
      const [allStudents, deadline, allAnnouncements] = await Promise.all([
        studentService.getAllStudents(),
        deadlineService.getDeadlineSettings(),
        announcementService.getAllAnnouncements(),
      ])

      const studentList = allStudents || []
      setStudents(studentList)
      setDeadlineSettings(deadline)
      setAnnouncements(allAnnouncements || [])

      // 3. Compute distinct real metrics (zero assumptions or mock counts)
      const totalRoster = studentList.length
      const linkedAuthCount = studentList.filter((s) => Boolean(s.user_id)).length
      const invitationsSentCount = studentList.filter((s) =>
        localInvited.has((s.email || '').toLowerCase())
      ).length

      let completedProfilesCount = 0
      let pendingApprovalsCount = 0
      const completedIds = new Set<string>()

      if (isSupabaseConfigured() && !isDemo) {
        try {
          const [pendingRes, completedRes] = await Promise.all([
            supabase
              .from('profile_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending'),
            supabase
              .from('student_personal_details')
              .select('student_id'),
          ])

          pendingApprovalsCount = pendingRes.count || 0
          if (completedRes.data) {
            completedRes.data.forEach((row: any) => completedIds.add(row.student_id))
            completedProfilesCount = completedIds.size
          }
        } catch {
          pendingApprovalsCount = 0
        }
      } else {
        // In local/demo mode, Test Pilot Student has completed profiles
        studentList.forEach((s) => {
          if (s.roll_number === '23L31A0999') completedIds.add(s.id)
        })
        completedProfilesCount = completedIds.size
      }

      setCompletedStudentIds(completedIds)

      // Reliable activated count: confirmed sign-in evidence OR active profile completion
      const activatedCount = studentList.filter((s) => {
        const emailLower = (s.email || '').toLowerCase()
        return (
          localActivated.has(emailLower) ||
          (Boolean(s.user_id) && s.status === 'Active' && completedIds.has(s.id))
        )
      }).length

      setMetrics({
        totalRoster,
        invitationsSentCount,
        linkedAuthCount,
        activatedCount,
        completedProfilesCount,
        pendingApprovalsCount,
      })
    } finally {
      setLoading(false)
    }
  }, [isConfigured, isDemo])

  React.useEffect(() => {
    loadRealDashboardData()
  }, [loadRealDashboardData])

  const isDeadlineExpired = deadlineSettings
    ? new Date() > new Date(deadlineSettings.deadline)
    : false
  
  // Explicit 3-mode editing status
  const editingMode = !deadlineSettings?.is_enabled
    ? 'locked_admin'
    : isDeadlineExpired
    ? 'locked_expired'
    : 'open_deadline'

  const getStudentOnboardingBadge = (st: StudentRecord) => {
    const emailLower = (st.email || '').toLowerCase()
    const isActivated =
      activatedEmails.has(emailLower) ||
      (Boolean(st.user_id) && st.status === 'Active' && completedStudentIds.has(st.id))

    if (isActivated) {
      return (
        <Badge variant="approved" className="text-[10px]">
          ACTIVATED
        </Badge>
      )
    }
    if (st.user_id) {
      return (
        <Badge
          variant="approved"
          className="text-[10px] bg-blue-100 text-blue-900 border-blue-200"
        >
          AUTH LINKED
        </Badge>
      )
    }
    if (invitedEmails.has(emailLower)) {
      return (
        <Badge variant="pending" className="text-[10px]">
          INVITE SENT
        </Badge>
      )
    }
    return (
      <Badge
        variant="draft"
        className="text-[10px] bg-slate-100 text-slate-700 border-slate-200"
      >
        ROSTER ONLY
      </Badge>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-50 border border-purple-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-900 bg-white/80 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
              Faculty Workspace
            </span>
            <span className="text-xs font-mono text-purple-700 font-semibold">Semester 2-1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            CSE-Data Science Mentoring Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Faculty Mentoring Workspace • Department of CSE (Data Science) • Vignan Institute of Information Technology
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link to="/admin/mentor360">
            <Button
              variant="primary"
              size="sm"
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-200"
            >
              <Compass className="h-4 w-4 mr-1.5" />
              Open Mentor 360°
            </Button>
          </Link>
          <Link to="/admin/deadlines">
            <Button variant="outline" size="sm" className="bg-white text-xs font-semibold">
              <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-purple-700" />
              Profile Deadlines
            </Button>
          </Link>
          <Link to="/admin/roadmap">
            <Button variant="outline" size="sm" className="bg-white text-xs font-semibold">
              <Layers className="h-3.5 w-3.5 mr-1.5 text-purple-700" />
              Roadmap
            </Button>
          </Link>
        </div>
      </div>

      {/* Real 6-Dimension Metric Summary Cards (Zero Mock Figures) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Roster Students */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-1.5 px-3.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Roster Students
              </span>
              <Users className="h-3.5 w-3.5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
              {metrics.totalRoster}
            </div>
            <p className="text-[10px] text-slate-500 truncate">Imported in cohort</p>
          </CardContent>
        </Card>

        {/* 2. Invitations Sent */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-1.5 px-3.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Invited Students
              </span>
              <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-950 font-mono">
              {metrics.invitationsSentCount}
            </div>
            <p className="text-[10px] text-slate-500 truncate">Invites dispatched</p>
          </CardContent>
        </Card>

        {/* 3. Linked Auth Accounts */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-1.5 px-3.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Linked Auth
              </span>
              <Link2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-extrabold text-blue-950 font-mono">
              {metrics.linkedAuthCount}
            </div>
            <p className="text-[10px] text-slate-500 truncate">Auth linked to roll</p>
          </CardContent>
        </Card>

        {/* 4. Activated Accounts */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-1.5 px-3.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Activated Accounts
              </span>
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 font-mono">
              {metrics.activatedCount}
            </div>
            <p className="text-[10px] text-slate-500 truncate">Confirmed & active</p>
          </CardContent>
        </Card>

        {/* 5. Completed Profiles */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-1.5 px-3.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Completed Profiles
              </span>
              <FileCheck className="h-3.5 w-3.5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-extrabold text-teal-950 font-mono">
              {metrics.completedProfilesCount}
            </div>
            <p className="text-[10px] text-slate-500 truncate">Sections B–G saved</p>
          </CardContent>
        </Card>

        {/* 6. Pending Approvals */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-1.5 px-3.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Pending Approvals
              </span>
              <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-extrabold text-amber-950 font-mono">
              {metrics.pendingApprovalsCount}
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              {metrics.pendingApprovalsCount > 0 ? 'Awaiting review' : 'Queue clear'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Real Operational Sections */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Real Students & Deadline Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Profile Editing Deadline Card */}
          <Card className="border-purple-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <CalendarClock className="h-4 w-4 text-purple-700" />
                    <span>Student Profile Submission Deadline</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Enforced by PostgreSQL database trigger on all student profile tables
                  </p>
                </div>
                <Badge
                  variant={editingMode === 'open_deadline' ? 'approved' : 'critical'}
                  className="text-[10px] font-bold"
                >
                  {editingMode === 'open_deadline'
                    ? 'EDITING OPEN (DEADLINE-BASED)'
                    : editingMode === 'locked_admin'
                    ? 'EDITING LOCKED (CLOSED BY ADMIN)'
                    : 'EDITING LOCKED (DEADLINE EXPIRED)'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                    Confirmed Onboarding Deadline
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {deadlineSettings?.formatted_ist || 'Tuesday, November 3, 2026 at 11:59:59 PM IST'}
                  </p>
                </div>

                <Link to="/admin/deadlines">
                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs whitespace-nowrap"
                  >
                    Manage Extensions
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                <span>
                  Onboarding Progress:{' '}
                  <strong className="text-slate-900 font-bold">
                    {metrics.activatedCount} of {metrics.totalRoster} Accounts Activated
                  </strong>
                </span>
                <span className="font-mono text-[11px] text-purple-700 font-semibold">
                  {metrics.totalRoster > 0
                    ? `${Math.round((metrics.activatedCount / metrics.totalRoster) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-700 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      metrics.totalRoster > 0
                        ? Math.min(100, Math.round((metrics.activatedCount / metrics.totalRoster) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Real Registered Students (Actual Supabase Data) */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-700" />
                    <span>Registered Student Cohort</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Live records retrieved directly from public.students in Supabase
                  </p>
                </div>

                <Link
                  to="/admin/students"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {students.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <Users className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">No Roster Students Imported Yet</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Import your mentee roster via CSV or invite students individually in Student Management.
                  </p>
                  <Link to="/admin/students" className="inline-block pt-1">
                    <Button size="sm" variant="outline" className="text-xs">
                      Open Student Management
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {students.slice(0, 5).map((st) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={st.avatar_url || undefined}
                          alt={st.name}
                          fallback={st.name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{st.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {st.roll_number} • {st.department || 'CSE-DS'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getStudentOnboardingBadge(st)}
                        <Link
                          to={`/admin/mentor360?roll=${st.roll_number}`}
                          className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-0.5"
                        >
                          360° <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Communications & Realistic Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Announcements & Communications Summary */}
          <Card className="border-purple-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-purple-700" />
                  <span>Cohort Announcements</span>
                </CardTitle>
                <Link
                  to="/admin/communication"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"
                >
                  Manage <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {announcements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                  <p>No announcements published yet.</p>
                  <Link to="/admin/communication">
                    <Button size="sm" variant="outline" className="text-xs mt-2">
                      Post First Announcement
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.slice(0, 3).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                          {ann.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs">{ann.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic & Attendance Institutional Data Status */}
          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Attendance & Academic Data Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <p className="leading-relaxed">
                Official class attendance and semester examination grades are populated directly from institution-provided spreadsheets and examination branch reports.
              </p>
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Attendance Thresholds:</span>
                <p className="text-[11px] text-slate-500">
                  Warning at 80% • Critical below 75% (Medical condonation required).
                </p>
              </div>
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Phase: Onboarding</span>
                <Link
                  to="/admin/roadmap"
                  className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
                >
                  View in Roadmap <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
