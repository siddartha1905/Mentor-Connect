import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { QuoteCard } from '@/components/shared/QuoteCard'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MOCK_STUDENTS, MOCK_ATTENDANCE, MOCK_SESSIONS, MOCK_ANNOUNCEMENTS } from '@/data/mock'

export const StudentHome: React.FC = () => {
  const student = MOCK_STUDENTS[0] // Aarav Sharma
  const attendance = MOCK_ATTENDANCE[student.rollNumber]
  const session = MOCK_SESSIONS[0]
  const announcement = MOCK_ANNOUNCEMENTS[0]

  // Local state for commitments toggle
  const [commitments, setCommitments] = React.useState(session.afterSession.commitments)

  const toggleCommitment = (id: string) => {
    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isCompleted: !c.isCompleted } : c))
    )
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-50 border border-purple-200/80 p-5 sm:p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Semester 2-1 Active
            </span>
            <Badge variant="approved">Profile Approved</Badge>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500">
            {student.rollNumber}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {student.fullName.split(' ')[0]}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Faculty Mentor: <strong className="text-slate-800">{student.assignedMentor}</strong>
        </p>
      </div>

      {/* Demo Notice */}
      <DemoNotice
        variant="inline"
        message="Stage 1 Student Experience. Fictional demo dataset for CSE-Data Science 2nd Year."
      />

      {/* Daily Motivational Quote */}
      <QuoteCard variant="lavender" />

      {/* Primary KPI Grid: Attendance & Academic Snapshot */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Official Attendance Card */}
        <Card className="bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Official Attendance
              </span>
              <Badge variant="good">{attendance.health}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-emerald-900 tracking-tight">
              {attendance.officialPercentage}%
            </div>
            <p className="text-[11px] text-slate-500">
              {attendance.classesAttended} of {attendance.totalClassesHeld} classes attended
            </p>
            <div className="pt-2">
              <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${attendance.officialPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Threshold: 80% (Warning) | 75% (Critical)
            </p>
          </CardContent>
        </Card>

        {/* Current Academic Snapshot Card */}
        <Card className="bg-gradient-to-br from-indigo-50/70 to-white border-indigo-200/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                Academic Progress
              </span>
              <Badge variant="low">0 Backlogs</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-indigo-900 tracking-tight">
              {student.academics.cgpa} <span className="text-xs font-normal text-slate-500">CGPA</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sem 1-1: {student.academics.sem1_1.sgpa} | Sem 1-2: {student.academics.sem1_2.sgpa}
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px]">
              <span className="text-indigo-700 font-semibold">6 Subjects Enrolled</span>
              <Link to="/student/journey" className="text-indigo-600 hover:underline inline-flex items-center">
                Details <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Mentoring Session Preview */}
      <Card className="border-indigo-100 bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Upcoming Mentoring Discussion
            </CardTitle>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Session #{session.sessionNumber + 1} Scheduled
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Wednesday, 28th October 2026 at 3:45 PM
              </p>
              <p className="text-xs text-slate-500">
                Faculty Cabin #204, CSE Department Block
              </p>
            </div>
            <Link to="/student/check-in">
              <Button size="sm" variant="pastel-lavender">
                Review Questions
              </Button>
            </Link>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800">Discussion Focus:</span>
            <p className="text-slate-500 italic">
              “{session.duringSession.studentVisibleSuggestions}”
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Commitments / Action Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              My Mentoring Commitments
            </CardTitle>
            <span className="text-xs text-slate-400">
              {commitments.filter((c) => c.isCompleted).length}/{commitments.length} Completed
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {commitments.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCommitment(item.id)}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200/70 hover:bg-slate-50 transition-colors cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => {}} // handled by div click
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 pointer-events-none"
              />
              <div className="flex-1 text-xs">
                <p className={item.isCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}>
                  {item.task}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                  <span>Owner: {item.owner === 'student' ? 'You' : 'Faculty Mentor'}</span>
                  <span>Due: {item.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Latest Mentor Announcement */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Latest Announcement
            </span>
            <span className="text-[10px] text-slate-400">{announcement.date}</span>
          </div>
          <CardTitle className="text-sm font-bold text-slate-900 mt-1">
            {announcement.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            {announcement.content}
          </p>
          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">By {announcement.author}</span>
            <Link to="/student/messages" className="text-indigo-600 font-semibold inline-flex items-center hover:underline">
              View Feed <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Link
          to="/student/journey"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors flex flex-col items-center gap-1"
        >
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800">My Journey</span>
          <span className="text-[10px] text-slate-400">Marks & Goals</span>
        </Link>

        <Link
          to="/student/check-in"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors flex flex-col items-center gap-1"
        >
          <Clock className="h-5 w-5 text-teal-600" />
          <span className="text-xs font-semibold text-slate-800">Check-in</span>
          <span className="text-[10px] text-slate-400">10:30 AM IST</span>
        </Link>

        <Link
          to="/student/profile"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors flex flex-col items-center gap-1"
        >
          <UserCheck className="h-5 w-5 text-purple-600" />
          <span className="text-xs font-semibold text-slate-800">My Profile</span>
          <span className="text-[10px] text-slate-400">7 Sections</span>
        </Link>
      </div>
    </div>
  )
}
