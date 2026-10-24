import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Compass,
  Lock,
  Eye,
  Sparkles,
  Award,
  MapPin,
  Users,
  HelpCircle,
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
import { studentService, type StudentFullDetails } from '@/services/studentService'
import { useAuth } from '@/app/providers/AuthContext'

export const Mentor360View: React.FC = () => {
  const { isConfigured } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedRoll = searchParams.get('roll') || '23L31A5401'
  
  const [activeTab, setActiveTab] = React.useState('overview')
  const [dbDetails, setDbDetails] = React.useState<StudentFullDetails | null>(null)

  // Confidential Mentor Notes local state for interactive demo editing
  const [newConfidentialNote, setNewConfidentialNote] = React.useState('')
  const [newStudentSuggestion, setNewStudentSuggestion] = React.useState('')
  const [noteStaged, setNoteStaged] = React.useState(false)

  React.useEffect(() => {
    if (isConfigured) {
      studentService.getStudentByRoll(selectedRoll).then(setDbDetails)
    }
  }, [isConfigured, selectedRoll])

  const fallbackStudent: StudentProfile =
    MOCK_STUDENTS.find((s) => s.rollNumber.toLowerCase() === selectedRoll.toLowerCase()) || MOCK_STUDENTS[0]

  const student: StudentProfile = React.useMemo(() => {
    if (!dbDetails?.student) return fallbackStudent

    const dbS = dbDetails.student
    const dbP = dbDetails.personal
    const dbF = dbDetails.family

    return {
      ...fallbackStudent,
      fullName: dbS.name || fallbackStudent.fullName,
      rollNumber: dbS.roll_number || fallbackStudent.rollNumber,
      department: dbS.department || fallbackStudent.department,
      year: dbS.year || fallbackStudent.year,
      section: dbS.section || fallbackStudent.section,
      avatarUrl: dbS.avatar_url || fallbackStudent.avatarUrl,
      email: dbS.email || fallbackStudent.email,
      phone: dbP?.phone || fallbackStudent.phone,
      dob: dbP?.dob || fallbackStudent.dob,
      presentAddress: dbP?.current_address || fallbackStudent.presentAddress,
      permanentAddress: dbP?.permanent_address || fallbackStudent.permanentAddress,
      emergencyContact: dbP?.emergency_contact || fallbackStudent.emergencyContact,
      fatherName: dbF?.father_name || fallbackStudent.fatherName,
      fatherOccupation: dbF?.father_occupation || fallbackStudent.fatherOccupation,
      fatherPhone: dbF?.father_phone || fallbackStudent.fatherPhone,
      motherName: dbF?.mother_name || fallbackStudent.motherName,
      motherOccupation: dbF?.mother_occupation || fallbackStudent.motherOccupation,
      motherPhone: dbF?.mother_phone || fallbackStudent.motherPhone,
    }
  }, [dbDetails, fallbackStudent])

  const attendance = MOCK_ATTENDANCE[student.rollNumber] || MOCK_ATTENDANCE['23L31A5401']
  const session =
    MOCK_SESSIONS.find((sess) => sess.studentRollNumber === student.rollNumber) || MOCK_SESSIONS[0]
  const chatMessages = MOCK_CHAT_MESSAGES[student.rollNumber] || []

  const handleStudentSwitch = (roll: string) => {
    setSearchParams({ roll })
    setNoteStaged(false)
  }

  // 9 Tabs as required by prompt
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
      {/* Student Selector & Fast Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-purple-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Mentor 360° Student Working Console</h2>
            <p className="text-xs text-slate-500">Select any mentee to review their comprehensive profile</p>
          </div>
        </div>

        {/* Dropdown student picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 hidden sm:inline">Active Mentee:</label>
          <select
            value={student.rollNumber}
            onChange={(e) => handleStudentSwitch(e.target.value)}
            className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950 focus:border-purple-500 outline-none"
          >
            {MOCK_STUDENTS.map((s) => (
              <option key={s.rollNumber} value={s.rollNumber}>
                {s.rollNumber} — {s.fullName} ({s.followUpPriority} Priority)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STUDENT HEADER CARD (Name, Roll, Dept, Semester, Status, Priority Badge) */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 via-white to-blue-50 border-purple-200">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Avatar
              src={student.avatarUrl}
              alt={student.fullName}
              fallback={student.fullName}
              size="xl"
              className="ring-4 ring-white shadow-md"
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
                {student.department} ({student.branch}) • Year {student.year}, Section {student.section}
              </p>
              <p className="text-xs text-slate-500">
                Current Semester: <strong className="text-slate-800">{student.currentSemester}</strong> • Batch: {student.academicBatch} • {student.admissionType} Entry
              </p>
            </div>
          </div>

          {/* Right Badges: Status & Priority */}
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Profile Status:</span>
              <Badge variant={student.profileStatus === 'Approved' ? 'approved' : student.profileStatus === 'Pending Approval' ? 'pending' : 'changes'}>
                {student.profileStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Follow-up Priority:</span>
              <Badge variant={student.followUpPriority === 'High' ? 'high' : student.followUpPriority === 'Medium' ? 'medium' : 'low'}>
                {student.followUpPriority} Priority
              </Badge>
            </div>

            <div className="text-[11px] text-slate-400 mt-1">
              Assigned: {student.assignedMentor}
            </div>
          </div>
        </div>
      </Card>

      <DemoNotice
        variant="inline"
        message="Confidential Working Screen. Demonstrates role-based separation between mentor-only confidential notes and student-visible suggestions."
      />

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
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Official Attendance</span>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {attendance.officialPercentage}%
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <Badge variant={attendance.health === 'Good' ? 'good' : attendance.health === 'Warning' ? 'warning' : 'critical'}>
                    {attendance.health}
                  </Badge>
                  <span className="text-slate-400 text-[10px]">{attendance.classesAttended}/{attendance.totalClassesHeld}</span>
                </div>
              </CardContent>
            </Card>

            {/* CGPA */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cumulative CGPA</span>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
                  {student.academics.cgpa}
                </div>
                <p className="text-xs text-slate-500">Sem 1-1: {student.academics.sem1_1.sgpa} | 1-2: {student.academics.sem1_2.sgpa}</p>
              </CardContent>
            </Card>

            {/* Active Backlogs */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Backlogs</span>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {student.academics.totalBacklogs}
                </div>
                <p className="text-xs text-slate-500">
                  {student.academics.totalBacklogs === 0 ? 'Clear record' : 'Backlog clearing plan active'}
                </p>
              </CardContent>
            </Card>

            {/* Next Follow-up Date */}
            <Card className="bg-purple-50/50 border-purple-200">
              <CardHeader className="pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">Next Scheduled Session</span>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xl sm:text-2xl font-extrabold text-purple-950">
                  {student.nextMentoringDate || 'TBD'}
                </div>
                <p className="text-xs text-purple-700">Slot #204 • Weekly Review</p>
              </CardContent>
            </Card>
          </div>

          {/* DISTINCTIVE HIGHLIGHT PANEL: "Prepare for Your Next Mentoring Session" */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-indigo-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Prepare for Your Next Mentoring Session
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

              {/* Suggested Next Questions (Rule-based Examples) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-[10px] tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                    Rule-Based Suggested Questions for This Session
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    Not AI medical/psychological scores
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

          {/* CONFIDENTIALITY WORKSPACE: Confidential Notes vs Student-Visible Suggestions */}
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
                  {session.duringSession.confidentialMentorNotes}
                </div>

                <form onSubmit={handleStageNotes} className="space-y-2 pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Add Session Note:
                  </label>
                  <textarea
                    rows={2}
                    value={newConfidentialNote}
                    onChange={(e) => setNewConfidentialNote(e.target.value)}
                    placeholder="Enter confidential observation regarding family, behavior or medical leave..."
                    className="w-full text-xs p-2.5 rounded-xl border border-rose-200 bg-white outline-none focus:border-rose-500"
                  />
                  <Button type="submit" variant="destructive" size="sm" className="w-full text-xs">
                    Stage Confidential Note (Demo)
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
                  {session.duringSession.studentVisibleSuggestions}
                </div>

                <form onSubmit={handleStageNotes} className="space-y-2 pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Add Action Advice:
                  </label>
                  <textarea
                    rows={2}
                    value={newStudentSuggestion}
                    onChange={(e) => setNewStudentSuggestion(e.target.value)}
                    placeholder="Enter concrete study goal, tutorial task, or coding drill..."
                    className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 bg-white outline-none focus:border-indigo-500"
                  />
                  <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
                    Publish Student Advice (Demo)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {noteStaged && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold text-center animate-fade-in">
              Staged demo notes in local memory. In Stage 2, Supabase Row-Level Security (RLS) will enforce confidential isolation.
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
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                Contact & Residential Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Mobile Number</span>
                <p className="text-sm font-bold text-slate-800">{student.phone}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">College Email</span>
                <p className="text-sm font-medium text-slate-800">{student.email}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Residence Type & Commute</span>
                <p className="text-sm font-medium text-slate-800">{student.residenceType} • {student.transportType}</p>
                {student.transportRoute && (
                  <p className="text-xs text-slate-500 mt-0.5">{student.transportRoute}</p>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Permanent Address</span>
                <p className="text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 mt-1">
                  {student.permanentAddress}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Parent & Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Father: {student.fatherName}</span>
                <p className="text-xs text-slate-500">Occupation: {student.fatherOccupation || 'N/A'}</p>
                <p className="text-xs text-slate-700 font-mono">Contact: {student.fatherPhone || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Mother: {student.motherName}</span>
                <p className="text-xs text-slate-500">Occupation: {student.motherOccupation || 'N/A'}</p>
                <p className="text-xs text-slate-700 font-mono">Contact: {student.motherPhone || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-0.5">
                <span className="font-bold text-[11px] uppercase tracking-wider block">Emergency Contact</span>
                <p className="text-xs font-bold">{student.emergencyContact}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ACADEMICS (Sem 2-1 Coursework & Assessments) */}
      {activeTab === 'academics' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Semester 2-1 Subject Assessments</CardTitle>
                  <p className="text-xs text-slate-500">Internal components (WT1–WT4, Mid-1, Mid-2, Lab)</p>
                </div>
                <Badge variant="low">Current Term: 2-1</Badge>
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
                    {student.academics.subjects.map((s) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ATTENDANCE (Official vs Student-Reported) */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-900">Official Institutional Attendance</CardTitle>
                <p className="text-xs text-slate-500">Weekly upload from departmental biometric registers</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-extrabold text-emerald-900">{attendance.officialPercentage}%</div>
                <p className="text-xs text-slate-600">
                  {attendance.classesAttended} classes attended out of {attendance.totalClassesHeld} conducted
                </p>
                <span className="text-[10px] text-slate-400">Last Official Update: {attendance.lastUpdated}</span>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-900">Discrepancy Tracker</CardTitle>
                <p className="text-xs text-slate-500">Differences between official record and daily self-check-ins</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-extrabold text-amber-900">{attendance.discrepancyCount} Flags</div>
                <p className="text-xs text-slate-600">
                  {attendance.discrepancyCount === 0
                    ? 'Records reconciled. No discrepancy detected.'
                    : 'Discrepancy flagged between student leave application and register.'}
                </p>
                <span className="text-[10px] text-slate-400">Warning threshold: 80% • Critical: &lt;75%</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Recent Student-Reported Morning Check-ins (10:30 AM IST)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {attendance.studentReportedCheckIns.map((ci, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{ci.date}</span>
                    {ci.note && <span className="text-slate-500 text-[11px] ml-2 italic">— {ci.note}</span>}
                  </div>
                  <Badge variant={ci.status === 'Present' ? 'good' : 'warning'}>{ci.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: MENTORING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Recorded Mentoring Sessions History</CardTitle>
                <Badge variant="approved">Session #{session.sessionNumber} Recorded</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
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
                  Conducted by {session.facultyName} • Next Follow-up: {session.afterSession.nextFollowUpDate}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: SKILLS & ASPIRATIONS */}
      {activeTab === 'skills' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Career Interests & Ambitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {student.careerInterests.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-semibold">
                    {c}
                  </span>
                ))}
              </div>
              <div className="pt-2">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Higher Education Plans</span>
                <p className="text-xs text-slate-800 font-medium mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  {student.higherEducationAspirations}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Technical & Soft Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Target Technical Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {student.desiredTechnicalSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">Personal Strengths</span>
                <div className="flex flex-wrap gap-1.5">
                  {student.personalStrengths.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: ACHIEVEMENTS & CERTIFICATIONS */}
      {activeTab === 'achievements' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Verified Activities, Certifications & Competitions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            {student.certifications.map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 flex items-center justify-between">
                <span className="font-bold">{c}</span>
                <Badge variant="good">Verified by Mentor</Badge>
              </div>
            ))}
            {student.competitions.map((comp, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                • {comp}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 8: COMMUNICATIONS (Private Chat History) */}
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
                <div className="p-6 text-center text-xs text-slate-400">
                  No private messages exchanged with this student yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 9: FOLLOW-UPS & TIMELINE */}
      {activeTab === 'timeline' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Mentoring Timeline & Follow-up Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="relative pl-6 space-y-4 border-l-2 border-purple-200">
              <div className="relative">
                <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-purple-600 ring-4 ring-white" />
                <span className="text-[10px] font-mono text-purple-700 font-bold">28 October 2026</span>
                <h4 className="font-bold text-slate-900 text-xs">Upcoming Session #{session.sessionNumber + 1}</h4>
                <p className="text-slate-600 text-[11px]">Follow-up on Kaggle EDA literature survey and WT-2 marks.</p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-slate-300 ring-4 ring-white" />
                <span className="text-[10px] font-mono text-slate-400 font-bold">14 October 2026</span>
                <h4 className="font-bold text-slate-800 text-xs">Session #{session.sessionNumber} Completed</h4>
                <p className="text-slate-500 text-[11px]">Outcome: {session.afterSession.outcome}. 2 commitments recorded.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
