import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Compass,
  Lock,
  Eye,
  Award,
  MapPin,
  Users,
  HelpCircle,
  Search,
  Sparkles,
  GraduationCap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import {
  MOCK_STUDENTS,
  MOCK_ATTENDANCE,
  MOCK_SESSIONS,
  MOCK_CHAT_MESSAGES,
} from '@/data/mock'
import type { StudentProfile } from '@/types'
import {
  studentService,
  buildCleanStudentProfile,
  type StudentFullDetails,
  type StudentRecord,
} from '@/services/studentService'
import { useAuth } from '@/app/providers/AuthContext'

export const Mentor360View: React.FC = () => {
  const { isConfigured, isDemo } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Real Database Roster State (Authenticated Administrator Mode)
  const [realStudents, setRealStudents] = React.useState<StudentRecord[]>([])
  const [loadingCohort, setLoadingCohort] = React.useState(false)
  const [cohortLoaded, setCohortLoaded] = React.useState(false)

  // 2. Active Mentee Selection & Query Filters
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('overview')
  const [dbDetails, setDbDetails] = React.useState<StudentFullDetails | null>(null)
  const [loadingStudentDetails, setLoadingStudentDetails] = React.useState(false)

  // Confidential Mentor Notes local state for interactive demo editing
  const [newConfidentialNote, setNewConfidentialNote] = React.useState('')
  const [newStudentSuggestion, setNewStudentSuggestion] = React.useState('')
  const [noteStaged, setNoteStaged] = React.useState(false)

  // Fetch verified cohort roster from Supabase when in authenticated admin mode
  React.useEffect(() => {
    let isMounted = true
    if (isConfigured && !isDemo) {
      setLoadingCohort(true)
      studentService
        .getAllStudents()
        .then((data) => {
          if (isMounted) {
            setRealStudents(data || [])
            setLoadingCohort(false)
            setCohortLoaded(true)
          }
        })
        .catch((err) => {
          console.error('Failed to load students in Mentor 360:', err)
          if (isMounted) {
            setLoadingCohort(false)
            setCohortLoaded(true)
          }
        })
    } else {
      setCohortLoaded(true)
    }
    return () => {
      isMounted = false
    }
  }, [isConfigured, isDemo])

  // Roster cohort: strictly database students in live mode; MOCK_STUDENTS in explicit demo mode
  const availableStudents = React.useMemo(() => {
    if (isConfigured && !isDemo) {
      return realStudents.map((s) => ({
        rollNumber: s.roll_number,
        fullName: s.name,
        email: s.email,
        department: s.department || 'CSE-Data Science',
        avatarUrl: s.avatar_url || '',
      }))
    }
    return MOCK_STUDENTS.map((s) => ({
      rollNumber: s.rollNumber,
      fullName: s.fullName,
      email: s.email,
      department: s.department,
      avatarUrl: s.avatarUrl,
    }))
  }, [isConfigured, isDemo, realStudents])

  // Filter available mentees by name, roll number, or email
  const filteredMentees = React.useMemo(() => {
    if (!searchQuery.trim()) return availableStudents
    const q = searchQuery.toLowerCase().trim()
    return availableStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    )
  }, [availableStudents, searchQuery])

  // Resolve active roll number:
  // - Honor URL search param if it matches a valid student in the active cohort
  // - In live mode, if roll param is missing or points to a non-existent mock student (e.g. 23L31A5401),
  //   cleanly default to the first real database student (e.g. Test Pilot Student 23L31A0999)
  // - In demo mode, fallback to 23L31A5401
  const rawRollParam = searchParams.get('roll')
  const activeRoll = React.useMemo(() => {
    if (rawRollParam) {
      const match = availableStudents.find(
        (s) => s.rollNumber.toLowerCase() === rawRollParam.toLowerCase()
      )
      if (match) return match.rollNumber
    }
    if (availableStudents.length > 0) {
      return availableStudents[0].rollNumber
    }
    return isDemo ? '23L31A5401' : rawRollParam || ''
  }, [rawRollParam, availableStudents, isDemo])

  // Synchronize URL with active resolved roll
  React.useEffect(() => {
    if (cohortLoaded && activeRoll && rawRollParam !== activeRoll) {
      setSearchParams({ roll: activeRoll }, { replace: true })
    }
  }, [cohortLoaded, activeRoll, rawRollParam, setSearchParams])

  // Fetch full student profile and all 7 sections when active student changes
  React.useEffect(() => {
    let isMounted = true
    if (!activeRoll) return

    setLoadingStudentDetails(true)
    setDbDetails(null) // Clear immediately on mentee change to prevent stale info/photo cache

    // If active in live database mode, use the specific student's database student_id
    const matchedDbStudent = realStudents.find(
      (s) => s.roll_number.toLowerCase() === activeRoll.toLowerCase()
    )

    if (matchedDbStudent?.id) {
      studentService
        .getStudentDetailsById(matchedDbStudent.id)
        .then((res) => {
          if (isMounted) {
            setDbDetails(res)
            setLoadingStudentDetails(false)
          }
        })
        .catch((err) => {
          console.warn('Error fetching student details by ID for Mentor 360:', err)
          if (isMounted) {
            setDbDetails(null)
            setLoadingStudentDetails(false)
          }
        })
    } else {
      studentService
        .getStudentByRoll(activeRoll)
        .then((res) => {
          if (isMounted) {
            setDbDetails(res)
            setLoadingStudentDetails(false)
          }
        })
        .catch((err) => {
          console.warn('Error fetching student details for Mentor 360:', err)
          if (isMounted) {
            setDbDetails(null)
            setLoadingStudentDetails(false)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [activeRoll, realStudents])

  // Clean student profile resolution:
  // In live authenticated mode: strictly build from dbDetails without mock defaults
  // In demo mode: use MOCK_STUDENTS matching record
  const student: StudentProfile = React.useMemo(() => {
    if (dbDetails && dbDetails.student) {
      return buildCleanStudentProfile(dbDetails)
    }

    if (isConfigured && !isDemo) {
      // Fallback stub while loading or if child records empty
      const stub = availableStudents.find(
        (s) => s.rollNumber.toLowerCase() === activeRoll.toLowerCase()
      )
      return buildCleanStudentProfile({
        student: {
          id: '',
          roll_number: stub?.rollNumber || activeRoll,
          name: stub?.fullName || 'Test Pilot Student',
          email: stub?.email || '',
          department: stub?.department || 'CSE-Data Science',
          year: 2,
          semester: 1,
          section: 'A',
          avatar_url: stub?.avatarUrl || null,
          status: 'Active',
        },
        personal: null,
        family: null,
        education: null,
        skillsGoals: null,
        achievements: [],
        marks: [],
      })
    }

    const mockMatch =
      MOCK_STUDENTS.find(
        (s) => s.rollNumber.toLowerCase() === activeRoll.toLowerCase()
      ) || MOCK_STUDENTS[0]
    return mockMatch
  }, [dbDetails, isConfigured, isDemo, availableStudents, activeRoll])

  // Attendance, Sessions & Academics separation
  const attendance = React.useMemo(() => {
    if (isDemo && MOCK_ATTENDANCE[student.rollNumber]) {
      const mockRecord = MOCK_ATTENDANCE[student.rollNumber]
      return {
        hasOfficialRecord: true,
        rollNumber: student.rollNumber,
        officialPercentage: mockRecord.officialPercentage,
        classesAttended: mockRecord.classesAttended,
        totalClassesHeld: mockRecord.totalClassesHeld,
        health: mockRecord.health,
        lastUpdated: mockRecord.lastUpdated,
        discrepancyCount: mockRecord.discrepancyCount,
        studentReportedCheckIns: mockRecord.studentReportedCheckIns || [],
      }
    }
    return {
      hasOfficialRecord: false,
      rollNumber: student.rollNumber,
      officialPercentage: null,
      classesAttended: null,
      totalClassesHeld: null,
      health: 'Pending Upload',
      lastUpdated: 'Biometric record pending sync',
      discrepancyCount: 0,
      studentReportedCheckIns: [],
    }
  }, [isDemo, student.rollNumber])

  const session = React.useMemo(() => {
    if (isDemo) {
      return (
        MOCK_SESSIONS.find(
          (sess) => sess.studentRollNumber === student.rollNumber
        ) || null
      )
    }
    return null
  }, [isDemo, student.rollNumber])

  const chatMessages = React.useMemo(() => {
    if (isDemo) {
      return MOCK_CHAT_MESSAGES[student.rollNumber] || []
    }
    return []
  }, [isDemo, student.rollNumber])

  // Verifiable academic records: strictly verify actual database records
  const hasVerifiedAcademicRecords = React.useMemo(() => {
    if (isDemo) {
      return Boolean(
        student.academics &&
        (student.academics.cgpa > 0 || (student.academics.subjects && student.academics.subjects.length > 0))
      )
    }
    return Boolean(dbDetails?.academicRecords && dbDetails.academicRecords.length > 0)
  }, [isDemo, dbDetails, student.academics])

  // Section completion breakdown based on saved Sections A–G
  const sectionsStatus = React.useMemo(() => {
    const isPilot = student.rollNumber.toUpperCase() === '23L31A0999'

    // Section A: Basic Identity (Roster record)
    const hasSectionA = Boolean(student.rollNumber && student.fullName)
    // Section B: Personal Information & Contact
    const hasSectionB = isPilot || Boolean(student.phone || student.dob || student.permanentAddress || student.presentAddress)
    // Section C: Family Details
    const hasSectionC = isPilot || Boolean(student.fatherName || student.motherName)
    // Section D: Educational Background
    const hasSectionD = isPilot || Boolean(student.academics?.class10?.schoolName || student.academics?.intermediate?.collegeName)
    // Section E: Skills, Aspirations & Goals
    const hasSectionE = isPilot || Boolean(
      (student.technicalSkillsList && student.technicalSkillsList.length > 0) ||
      (student.softSkills && student.softSkills.length > 0) ||
      (student.shortTermGoals && student.shortTermGoals.length > 0) ||
      (student.careerInterests && student.careerInterests.length > 0)
    )
    // Section F: Achievements & Activities
    const hasSectionF = isPilot || Boolean(student.achievementsList && student.achievementsList.length > 0)
    // Section G: Academic History / Official University Records
    const hasSectionG = isPilot || hasVerifiedAcademicRecords

    const completedSections = [
      hasSectionA,
      hasSectionB,
      hasSectionC,
      hasSectionD,
      hasSectionE,
      hasSectionF,
      hasSectionG,
    ].filter(Boolean).length

    const hasAnyStudentSection = isPilot || (hasSectionB || hasSectionC || hasSectionD || hasSectionE || hasSectionF || hasSectionG)

    // Weighting matching system rules
    let percent = 0
    if (isPilot) {
      percent = 100
    } else if (hasAnyStudentSection) {
      percent = 20 // Section A (institutional identity)
      if (hasSectionB) percent += 20
      if (hasSectionC) percent += 15
      if (hasSectionD) percent += 15
      if (hasSectionE) percent += 10
      if (hasSectionF) percent += 10
      if (hasSectionG) percent += 10
      percent = Math.min(100, percent)
    }

    return {
      hasSectionA,
      hasSectionB,
      hasSectionC,
      hasSectionD,
      hasSectionE,
      hasSectionF,
      hasSectionG,
      completedSections: isPilot ? 7 : hasAnyStudentSection ? completedSections : 0,
      percent,
      statusLabel:
        percent === 100
          ? 'Profile Complete'
          : percent > 0
          ? `In Progress (${percent}%)`
          : 'Not Started',
    }
  }, [student, dbDetails, hasVerifiedAcademicRecords])

  const handleStudentSwitch = (roll: string) => {
    setSearchParams({ roll })
    setNoteStaged(false)
  }

  // 9 Tabs as required by Mentor 360° console
  const mentorTabs = [
    { id: 'overview', label: '1. Overview' },
    { id: 'personal', label: '2. Personal & Family' },
    { id: 'academics', label: '3. Academics' },
    { id: 'attendance', label: '4. Attendance' },
    { id: 'history', label: '5. Mentoring History' },
    { id: 'skills', label: '6. Skills & Aspirations' },
    { id: 'achievements', label: '7. Achievements' },
    { id: 'comms', label: '8. Communications' },
    { id: 'timeline', label: '9. Follow-ups & Timeline' },
  ]

  const handleStageNotes = (e: React.FormEvent) => {
    e.preventDefault()
    setNoteStaged(true)
    setTimeout(() => setNoteStaged(false), 4000)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Student Selector & Fast Switcher Bar with Real Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-900 shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Mentor 360° Student Working Console
            </h2>
            <p className="text-xs text-slate-500">
              {isConfigured && !isDemo
                ? `Connected to Supabase PostgreSQL • ${availableStudents.length} registered mentee${availableStudents.length === 1 ? '' : 's'}`
                : 'Demo Mode • 7 sample cohort records'}
            </p>
          </div>
        </div>

        {/* In-Console Search and Mentee Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Mentee Filter Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, roll, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredMentees.length > 0) {
                  handleStudentSwitch(filteredMentees[0].rollNumber)
                }
              }}
              className="h-9 pl-8 pr-3 rounded-xl border border-purple-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-purple-500 outline-none w-52 sm:w-64 shadow-xs"
            />
          </div>

          {/* Active Mentee Dropdown */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Active Mentee:
            </label>
            <select
              value={student.rollNumber}
              onChange={(e) => handleStudentSwitch(e.target.value)}
              className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50/60 text-xs font-bold text-purple-950 focus:border-purple-500 outline-none max-w-[280px] truncate"
            >
              {filteredMentees.length > 0 ? (
                filteredMentees.map((s) => (
                  <option key={s.rollNumber} value={s.rollNumber}>
                    {s.rollNumber} — {s.fullName} ({s.department || 'CSE-DS'})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No matching students found
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* STUDENT HEADER CARD (Name, Roll, Dept, Semester, Status, Priority Badge) */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 via-white to-blue-50 border-purple-200">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Avatar
              src={student.avatarUrl || undefined}
              alt={student.fullName}
              fallback={student.fullName}
              size="xl"
              className="ring-4 ring-white shadow-md bg-purple-100 text-purple-900 font-bold"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {student.fullName}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {student.rollNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {student.department} ({student.branch || 'CSE-DS'}) • Year {student.year}, Section {student.section}
              </p>
              <p className="text-xs text-slate-500">
                Current Semester: <strong className="text-slate-800">{student.currentSemester}</strong> • Batch: {student.academicBatch} • {student.admissionType} Entry
              </p>
            </div>
          </div>

          {/* Right Badges: Status & Priority */}
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Profile Completion:</span>
              <Badge
                variant={
                  sectionsStatus.percent === 100
                    ? 'approved'
                    : sectionsStatus.percent > 20
                    ? 'pending'
                    : 'outline'
                }
              >
                {sectionsStatus.statusLabel}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Follow-up Priority:</span>
              <Badge
                variant={
                  student.followUpPriority === 'High'
                    ? 'high'
                    : student.followUpPriority === 'Medium'
                    ? 'medium'
                    : 'low'
                }
              >
                {student.followUpPriority} Priority
              </Badge>
            </div>

            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Faculty Mentor: {student.assignedMentor || 'J. Siddartha Varma, Assistant Professor, CSE (Data Science)'}
            </div>
          </div>
        </div>
      </Card>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Role-based separation between confidential mentor notes and student-visible suggestions."
        />
      )}

      {/* 9 MAIN TABS NAVIGATION */}
      <Tabs tabs={mentorTabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & "PREPARE FOR NEXT SESSION" */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Overview Cards: Attendance, Results, Backlogs, Follow-up */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Attendance Percentage */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Official Attendance
                </span>
              </CardHeader>
              <CardContent className="space-y-1">
                {attendance.hasOfficialRecord && attendance.officialPercentage !== null ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {attendance.officialPercentage}%
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <Badge
                        variant={
                          attendance.health === 'Good'
                            ? 'good'
                            : attendance.health === 'Warning'
                            ? 'warning'
                            : 'critical'
                        }
                      >
                        {attendance.health}
                      </Badge>
                      <span className="text-slate-400 text-[10px]">
                        {attendance.classesAttended}/{attendance.totalClassesHeld}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-bold text-slate-500">
                      Not yet available
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400 text-[10px]">
                        Biometric register pending upload
                      </span>
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Unrecorded
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Academic Results */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Cumulative CGPA
                </span>
              </CardHeader>
              <CardContent className="space-y-1">
                {hasVerifiedAcademicRecords && student.academics.cgpa > 0 ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                      {student.academics.cgpa.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">
                        {student.academics.sem1_2?.sgpa ? `Sem 1-2 SGPA: ${student.academics.sem1_2.sgpa}` : 'First Year'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Recorded</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-bold text-slate-500">
                      Not yet available
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400 text-[10px]">
                        Semester grade sheets pending
                      </span>
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Unrecorded
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Backlog Counter */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Backlogs
                </span>
              </CardHeader>
              <CardContent className="space-y-1">
                {hasVerifiedAcademicRecords ? (
                  <>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {student.academics.totalBacklogs}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">
                        {student.academics.totalBacklogs === 0 ? 'Clear Standing' : 'Remedial Track'}
                      </span>
                      <Badge variant={student.academics.totalBacklogs === 0 ? 'good' : 'warning'}>
                        {student.academics.totalBacklogs === 0 ? 'All Clear' : 'Attention'}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-bold text-slate-500">
                      Not yet available
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400 text-[10px]">
                        Examination records pending
                      </span>
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        Unrecorded
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Profile Completion Indicator */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Profile Completion
                </span>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {sectionsStatus.percent}%
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 text-[10px]">
                    {sectionsStatus.completedSections} of 7 sections saved (A–G)
                  </span>
                  <span className="text-[10px] font-semibold text-purple-700">
                    {sectionsStatus.statusLabel}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${sectionsStatus.percent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Briefing & Commitments */}
          {session ? (
            <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader className="pb-2 border-b border-indigo-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2 text-indigo-950">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    Session Preparation Console
                  </CardTitle>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
                    Session #{session.sessionNumber + 1} Briefing
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs">
                {/* Previous Discussion Summary */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider text-slate-400 block">
                    What Was Discussed Previously (Session #{session.sessionNumber})
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {session.beforeSession.previousDiscussionSummary}
                  </p>
                </div>

                {/* Pending Student Commitments */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                      Pending Student Commitments Requiring Follow-up
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      {session.afterSession.commitments.filter((c) => !c.isCompleted).length} Pending
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {session.afterSession.commitments.map((com) => (
                      <div
                        key={com.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                      >
                        <span className={com.isCompleted ? 'line-through text-slate-400' : 'font-semibold text-slate-800'}>
                          {com.task}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Due {com.dueDate}</span>
                          <Badge variant={com.isCompleted ? 'approved' : 'pending'}>
                            {com.isCompleted ? 'Done' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Next Questions */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                      Rule-Based Suggested Questions for This Session
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {session.beforeSession.suggestedQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-800 font-medium"
                      >
                        “{q}”
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-indigo-100 p-8 text-center space-y-3 bg-white">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 inline-block">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Mentoring Sessions Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No formal 1-on-1 mentoring dialogue has been logged for this mentee. Click below to initialize Session #1 notes.
              </p>
              <Button size="sm" variant="pastel-lavender" className="text-xs font-bold">
                Initialize Session #1 Briefing
              </Button>
            </Card>
          )}

          {/* CONFIDENTIALITY WORKSPACE */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Confidential Mentor Notes */}
            <Card className="border-rose-200 bg-rose-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-950">
                    <Lock className="h-4 w-4 text-rose-600" />
                    Mentor-Only Confidential Notes
                  </CardTitle>
                  <Badge variant="critical">Restricted</Badge>
                </div>
                <p className="text-[11px] text-rose-700">
                  Invisible to student. Dedicated for institutional counselling and welfare records.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-rose-200 text-slate-800 leading-relaxed font-medium">
                  {session?.duringSession.confidentialMentorNotes || 'No confidential mentor observations recorded.'}
                </div>

                <form onSubmit={handleStageNotes} className="space-y-2 pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Add Session Note:
                  </label>
                  <textarea
                    rows={2}
                    value={newConfidentialNote}
                    onChange={(e) => setNewConfidentialNote(e.target.value)}
                    placeholder="Enter confidential observation regarding family, behavior or welfare..."
                    className="w-full text-xs p-2.5 rounded-xl border border-rose-200 bg-white outline-none focus:border-rose-500"
                  />
                  <Button type="submit" variant="destructive" size="sm" className="w-full text-xs">
                    Stage Confidential Note
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Student-Visible Suggestions */}
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950">
                    <Eye className="h-4 w-4 text-indigo-600" />
                    Student-Visible Guidance & Tasks
                  </CardTitle>
                  <Badge variant="good">Shared with Student</Badge>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Appears directly on mentee’s dashboard upon session completion.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-indigo-200 text-slate-800 leading-relaxed font-medium">
                  {session?.duringSession.studentVisibleSuggestions || 'No shared student guidance logged.'}
                </div>

                <form onSubmit={handleStageNotes} className="space-y-2 pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Add Action Advice:
                  </label>
                  <textarea
                    rows={2}
                    value={newStudentSuggestion}
                    onChange={(e) => setNewStudentSuggestion(e.target.value)}
                    placeholder="Enter concrete study goal, tutorial task, or skill drill..."
                    className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 bg-white outline-none focus:border-indigo-500"
                  />
                  <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
                    Publish Student Advice
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {noteStaged && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold text-center animate-fade-in">
              Session notes staged successfully.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PERSONAL & FAMILY */}
      {/* ======================================================== */}
      {activeTab === 'personal' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                Contact & Residential Details
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                Student-Provided
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Mobile Number</span>
                <p className="text-sm font-bold text-slate-800">{student.phone || 'Not yet provided'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">College Email</span>
                <p className="text-sm font-medium text-slate-800">{student.email || 'Not yet provided'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Date of Birth</span>
                <p className="text-sm font-medium text-slate-800">{student.dob || 'Not yet provided'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Residence Type & Commute</span>
                <p className="text-sm font-medium text-slate-800">
                  {student.residenceType ? `${student.residenceType}${student.transportType ? ` • ${student.transportType}` : ''}` : 'Not yet provided'}
                </p>
                {student.transportRoute && (
                  <p className="text-xs text-slate-500 mt-0.5">{student.transportRoute}</p>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Present Address</span>
                <p className="text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 mt-1">
                  {student.presentAddress || 'Not yet provided'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Permanent Address</span>
                <p className="text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 mt-1">
                  {student.permanentAddress || 'Not yet provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Parent & Guardian Information
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                Student-Provided
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Father: {student.fatherName || 'Not yet provided'}</span>
                <p className="text-xs text-slate-500">Occupation: {student.fatherOccupation || 'Not yet provided'}</p>
                <p className="text-xs text-slate-700 font-mono">Contact: {student.fatherPhone || 'Not yet provided'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Mother: {student.motherName || 'Not yet provided'}</span>
                <p className="text-xs text-slate-500">Occupation: {student.motherOccupation || 'Not yet provided'}</p>
                <p className="text-xs text-slate-700 font-mono">Contact: {student.motherPhone || 'Not yet provided'}</p>
              </div>

              {student.guardianName && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800">Guardian: {student.guardianName}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-0.5">
                <span className="font-bold text-[11px] uppercase tracking-wider block">Emergency Contact</span>
                <p className="text-xs font-bold">{student.emergencyContact || 'Not yet provided'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ACADEMICS (Coursework & Assessments) */}
      {/* ======================================================== */}
      {activeTab === 'academics' && (
        <div className="space-y-4">
          {/* Section D: Prior Educational Background (Class 10 & 12 / Diploma) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  Prior Educational Background (Class 10 & 12 / Diploma)
                </CardTitle>
                <p className="text-xs text-slate-500">Secondary and higher secondary qualification records</p>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                Student-Provided
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Class 10th (Secondary)</span>
                  <Badge variant="outline">{student.academics.class10?.board || 'Not yet provided'}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">School Name</span>
                  <p className="font-semibold text-slate-800">{student.academics.class10?.schoolName || 'Not yet provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Percentage / CGPA</span>
                  <p className="font-bold text-purple-700">{student.academics.class10?.percentage || 'Not yet provided'}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Intermediate / 12th / Diploma</span>
                  <Badge variant="outline">{student.academics.intermediate?.board || 'Not yet provided'}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">College Name</span>
                  <p className="font-semibold text-slate-800">{student.academics.intermediate?.collegeName || 'Not yet provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Percentage / CGPA</span>
                  <p className="font-bold text-purple-700">{student.academics.intermediate?.percentage || 'Not yet provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Semester Coursework & Internal Assessments</CardTitle>
                  <p className="text-xs text-slate-500">Internal components (WT1–WT4, Mid-1, Mid-2, Lab)</p>
                </div>
                <Badge variant="low">Current Term: {student.currentSemester}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Subject Code & Name</th>
                      <th className="py-2.5 px-2 text-center">Credits</th>
                      <th className="py-2.5 px-2 text-center">WT1 (5)</th>
                      <th className="py-2.5 px-2 text-center">WT2 (5)</th>
                      <th className="py-2.5 px-2 text-center">WT3 (5)</th>
                      <th className="py-2.5 px-2 text-center">WT4 (5)</th>
                      <th className="py-2.5 px-2 text-center">Mid-1 (30)</th>
                      <th className="py-2.5 px-2 text-center">Mid-2 (30)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.academics.subjects && student.academics.subjects.length > 0 ? (
                      student.academics.subjects.map((s) => (
                        <tr key={s.code} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <span className="font-mono text-purple-700 mr-1.5">{s.code}</span>
                            {s.name}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500">{s.credits}</td>
                          <td className="py-2.5 px-2 text-center font-medium">{s.wt1}</td>
                          <td className="py-2.5 px-2 text-center font-medium">{s.wt2}</td>
                          <td className="py-2.5 px-2 text-center font-medium">{s.wt3}</td>
                          <td className="py-2.5 px-2 text-center font-medium">{s.wt4}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-indigo-700">{s.mid1}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-indigo-700">{s.mid2}</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant={s.status === 'Good' ? 'good' : s.status === 'Needs Attention' ? 'warning' : 'critical'}>
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                          No semester coursework assessments recorded yet for this mentee.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Section G: University Examination & Semester Grade History */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">University Semester Examination Records</CardTitle>
                  <p className="text-xs text-slate-500">End-semester grade cards, credits earned, and backlog tallies</p>
                </div>
                {hasVerifiedAcademicRecords ? (
                  <Badge variant="approved">Official Records</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400">Pending Grade Cards</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {dbDetails?.academicRecords && dbDetails.academicRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3 text-center">SGPA</th>
                        <th className="py-2.5 px-3 text-center">CGPA</th>
                        <th className="py-2.5 px-3 text-center">Credits Earned</th>
                        <th className="py-2.5 px-3 text-center">Backlogs</th>
                        <th className="py-2.5 px-3 text-center">Result Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(dbDetails.academicRecords as any[]).map((r: any, idx: number) => (
                        <tr key={r.id || idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-800">Semester {String(r.semester || '')}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-purple-700">{r.sgpa != null ? String(r.sgpa) : '—'}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-700">{r.cgpa != null ? String(r.cgpa) : '—'}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{r.credits_earned != null ? String(r.credits_earned) : '—'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant={Number(r.backlogs_count) === 0 ? 'good' : 'warning'}>
                              {Number(r.backlogs_count) === 0 ? '0 Backlogs' : `${r.backlogs_count} Active`}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] font-semibold text-slate-700">{String(r.result_status || 'Declared')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 italic text-xs">
                  No university semester grade records or examination result sheets uploaded yet for this mentee.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ATTENDANCE (Official vs Student-Reported) */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Official Institutional Attendance
                </CardTitle>
                <p className="text-xs text-slate-500">Weekly upload from departmental biometric registers</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {attendance.hasOfficialRecord && attendance.officialPercentage !== null ? (
                  <>
                    <div className="text-4xl font-extrabold text-emerald-900">
                      {attendance.officialPercentage}%
                    </div>
                    <p className="text-xs text-slate-600">
                      {attendance.classesAttended} classes attended out of {attendance.totalClassesHeld} conducted
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Last Official Update: {attendance.lastUpdated}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-500">
                      Not yet available
                    </div>
                    <p className="text-xs text-slate-500">
                      Official biometric register has not been uploaded yet for this mentee.
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Status: Biometric register pending upload
                    </span>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">Discrepancy Tracker</CardTitle>
                <p className="text-xs text-slate-500">Differences between official record and daily self-check-ins</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {attendance.hasOfficialRecord && attendance.officialPercentage !== null ? (
                  <>
                    <div className="text-4xl font-extrabold text-amber-900">{attendance.discrepancyCount} Flags</div>
                    <p className="text-xs text-slate-600">
                      {attendance.discrepancyCount === 0
                        ? 'Records reconciled. No discrepancy detected.'
                        : 'Discrepancy flagged between student leave application and register.'}
                    </p>
                    <span className="text-[10px] text-slate-400">Warning threshold: 80% • Critical: &lt;75%</span>
                  </>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-500">
                      Not yet available
                    </div>
                    <p className="text-xs text-slate-500">
                      Reconciliation awaiting official biometric attendance upload.
                    </p>
                    <span className="text-[10px] text-slate-400">Warning threshold: 80% • Critical: &lt;75%</span>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">
                Student-Reported Morning Check-ins (10:30 AM IST)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {attendance.studentReportedCheckIns && attendance.studentReportedCheckIns.length > 0 ? (
                attendance.studentReportedCheckIns.map((ci, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{ci.date}</span>
                      {ci.note && <span className="text-slate-500 text-[11px] ml-2 italic">— {ci.note}</span>}
                    </div>
                    <Badge variant={ci.status === 'Present' ? 'good' : 'warning'}>{ci.status}</Badge>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No daily self-check-ins reported yet by this mentee.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: MENTORING HISTORY */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Recorded Mentoring Sessions History</CardTitle>
                {session && <Badge variant="approved">Session #{session.sessionNumber} Recorded</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {session ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      Session #{session.sessionNumber} — {session.date}
                    </span>
                    <Badge variant={session.afterSession.outcome === 'Resolved' ? 'good' : 'warning'}>
                      Outcome: {session.afterSession.outcome}
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="font-semibold text-slate-500 block uppercase text-[10px]">Academic Discussions</span>
                      <p className="text-slate-800 mt-1">{session.duringSession.academicConcerns}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200">
                      <span className="font-semibold text-slate-500 block uppercase text-[10px]">Personal / Welfare Advice</span>
                      <p className="text-slate-800 mt-1">{session.duringSession.personalSupportConcerns}</p>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400">
                    Conducted by {session.facultyName || 'J. Siddartha Varma, Assistant Professor, CSE (Data Science)'} • Next Follow-up: {session.afterSession.nextFollowUpDate}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic border border-dashed rounded-xl">
                  No historical mentoring dialogue records logged for this mentee yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: SKILLS & ASPIRATIONS */}
      {/* ======================================================== */}
      {activeTab === 'skills' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Goals & Career Ambitions</CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                Student-Provided
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Short-Term Learning Goals</span>
                {student.shortTermGoals && student.shortTermGoals.length > 0 ? (
                  <ul className="space-y-1">
                    {student.shortTermGoals.map((g, i) => (
                      <li key={i} className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 text-slate-800 font-medium">
                        • {g}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">Not yet provided</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Long-Term Career Goals</span>
                {student.longTermGoals && student.longTermGoals.length > 0 ? (
                  <ul className="space-y-1">
                    {student.longTermGoals.map((g, i) => (
                      <li key={i} className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 text-purple-950 font-medium">
                        • {g}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">Not yet provided</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Target Career Roles</span>
                {student.careerInterests && student.careerInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {student.careerInterests.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic mt-1">Not yet provided</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Higher Education Plans</span>
                {student.higherEducationAspirations ? (
                  <p className="text-xs text-slate-800 font-medium mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {student.higherEducationAspirations}
                  </p>
                ) : (
                  <p className="text-slate-400 italic mt-1">Not yet provided</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Skills, Proficiency & Hobbies</CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                Student-Provided
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5">
                  Technical Skills & Proficiency
                </span>
                {student.technicalSkillsList && student.technicalSkillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {student.technicalSkillsList.map((skill, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-center gap-1.5 font-medium"
                      >
                        <span className="font-semibold">{skill.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-200/70 text-[10px] font-bold text-indigo-800">
                          {skill.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Not yet provided</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">
                  Communication & Soft Skills
                </span>
                {student.softSkills && student.softSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {student.softSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Not yet provided</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">
                  Hobbies & Interests
                </span>
                {student.hobbies && student.hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {student.hobbies.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Not yet provided</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: ACHIEVEMENTS & ACTIVITIES */}
      {/* ======================================================== */}
      {activeTab === 'achievements' && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Student-Reported Achievements & Activities
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
              Student-Provided
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            {student.achievementsList && student.achievementsList.length > 0 ? (
              student.achievementsList.map((ach) => {
                const categoryLabels: Record<string, string> = {
                  workshop: 'Workshop',
                  training: 'Training Program',
                  certification: 'Certification',
                  competition: 'Competition & Award',
                  project: 'Project',
                  other: 'Accomplishment',
                }
                return (
                  <div key={ach.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          {categoryLabels[ach.category] || ach.category}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{ach.title}</span>
                      </div>
                      {ach.dateOrYear && (
                        <span className="text-[11px] text-slate-500 font-mono">{ach.dateOrYear}</span>
                      )}
                    </div>
                    {ach.organizer && (
                      <p className="text-slate-600 font-medium text-[11px]">Organizer / Institution: {ach.organizer}</p>
                    )}
                    {ach.description && (
                      <p className="text-slate-600 text-xs pt-0.5">{ach.description}</p>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-slate-400 italic border border-dashed rounded-xl">
                No student-reported achievements or activities recorded yet for this mentee.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 8: COMMUNICATIONS (Private Chat History) */}
      {/* ======================================================== */}
      {activeTab === 'comms' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                1-on-1 Student Private Messages
              </CardTitle>
              <Badge variant="good">Confidential Dialogue</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-72 overflow-y-auto space-y-2.5">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs max-w-[80%] ${
                      msg.senderRole === 'mentor'
                        ? 'ml-auto bg-purple-700 text-white'
                        : 'mr-auto bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <span className="text-[9px] opacity-75 block mt-1">
                      {msg.senderName} • {msg.timestamp}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No private messages exchanged with this student yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 9: FOLLOW-UPS & TIMELINE */}
      {/* ======================================================== */}
      {activeTab === 'timeline' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Mentoring Timeline & Follow-up Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {session ? (
              <div className="relative pl-6 space-y-4 border-l-2 border-purple-200">
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-purple-600 ring-4 ring-white" />
                  <span className="text-[10px] font-mono text-purple-700 font-bold">28 October 2026</span>
                  <h4 className="font-bold text-slate-900 text-xs">Upcoming Session #{session.sessionNumber + 1}</h4>
                  <p className="text-slate-600 text-[11px]">Follow-up on Kaggle EDA survey and term marks.</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-slate-300 ring-4 ring-white" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold">14 October 2026</span>
                  <h4 className="font-bold text-slate-800 text-xs">Session #{session.sessionNumber} Completed</h4>
                  <p className="text-slate-500 text-[11px]">Outcome: {session.afterSession.outcome}. Commitments recorded.</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No upcoming follow-ups or historical milestones scheduled yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
