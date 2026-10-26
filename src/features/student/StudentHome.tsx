import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  UserCheck,
  Edit3,
  Megaphone,
  User,
  Phone,
  Mail,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/AuthContext'
import { announcementService, type AnnouncementRecord } from '@/services/announcementService'
import { AnnouncementContent } from '@/components/shared/AnnouncementContent'

export const StudentHome: React.FC = () => {
  const { studentProfile, accountLinkingError, user } = useAuth()
  const student = studentProfile
  const isLinked = user ? Boolean(studentProfile && !accountLinkingError) : true

  // Profile completion status based on actual data (Section C: no fake approval)
  const isComplete = Boolean((student?.profileCompletionPercent ?? 0) >= 100)

  // Announcements from administrator / faculty mentor
  const [announcements, setAnnouncements] = React.useState<AnnouncementRecord[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = React.useState(true)

  React.useEffect(() => {
    announcementService
      .getPublishedAnnouncements()
      .then((data) => {
        setAnnouncements(data)
      })
      .finally(() => {
        setLoadingAnnouncements(false)
      })
  }, [])

  const studentFirstName = isLinked && student?.fullName ? student.fullName.split(' ')[0] : 'Student'

  return (
    <div className="space-y-5 pb-6">
      {/* ------------------------------------------------------------- */}
      {/* Top Welcome Banner                                            */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-100 via-indigo-50 to-slate-50 border border-purple-200/80 p-5 sm:p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLinked ? (
              <>
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider bg-white/90 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                  Semester {student?.currentSemester || '2-1'} Active
                </span>
                {isComplete ? (
                  <Badge variant="approved" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                    Profile Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-bold">
                    Profile Incomplete
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-400 font-bold">
                Account Not Linked
              </Badge>
            )}
          </div>

          <span className="text-xs font-mono font-bold text-slate-700 bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            {isLinked ? (student?.rollNumber || 'Roster Student') : 'Unlinked Account'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {studentFirstName}!
        </h1>

        {/* Compact Faculty Mentor Contact Information */}
        <div className="pt-2.5 mt-2 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-slate-600">
              Faculty Mentor:{' '}
              <strong className="text-purple-950 font-bold">
                {student?.assignedMentor || 'J. Siddartha Varma'}
              </strong>
              <span className="text-slate-500 block sm:inline sm:ml-1.5 font-medium">
                • Assistant Professor, CSE (Data Science)
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:8885259838"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 border border-purple-200/90 text-purple-900 hover:bg-purple-100/80 font-semibold shadow-2xs transition-colors"
              title="Call Faculty Mentor"
            >
              <Phone className="h-3.5 w-3.5 text-purple-700 shrink-0" />
              <span>8885259838</span>
            </a>

            <a
              href="mailto:siddartha@vignaniit.edu.in"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 border border-purple-200/90 text-purple-900 hover:bg-purple-100/80 font-semibold shadow-2xs transition-colors"
              title="Email Faculty Mentor"
            >
              <Mail className="h-3.5 w-3.5 text-purple-700 shrink-0" />
              <span>siddartha@vignaniit.edu.in</span>
            </a>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Account Not Linked Alert (if applicable)                      */}
      {/* ------------------------------------------------------------- */}
      {!isLinked && (
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Student Profile Linking Pending
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {accountLinkingError ||
                  'Your authenticated account is not yet linked to an official student roster record. Profile completion and institutional onboarding actions are unavailable until an administrator verifies and links your student record.'}
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Please contact your faculty mentor to link your account.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Profile Onboarding / Incomplete Banner                        */}
      {/* ------------------------------------------------------------- */}
      {isLinked && !isComplete && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-slate-50 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-700 text-white text-xs font-bold shrink-0">
                  !
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  First-Time Onboarding: Complete Your Profile
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Please complete your personal information, family details, previous academics, skills, and goals in Sections A through G. Basic roster details are pre-filled and locked for security.
              </p>
              <span className="sr-only">No upcoming 1-on-1 session scheduled</span>

              {/* Real Progress Indicator */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Profile Completion</span>
                  <span className="font-bold text-purple-700 font-mono">
                    {student?.profileCompletionPercent ?? 0}% Completed
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-700 rounded-full transition-all duration-300"
                    style={{ width: `${student?.profileCompletionPercent ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <Link to="/student/profile">
                <Button className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs whitespace-nowrap">
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Complete Your Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Checklist */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-100/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Roster Identity</span>
            </div>
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                student?.phone ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {student?.phone ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-300 ml-1 mr-0.5" />
              )}
              <span>Personal Details</span>
            </div>
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                student?.fatherName ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {student?.fatherName ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-300 ml-1 mr-0.5" />
              )}
              <span>Family Details</span>
            </div>
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                student?.avatarUrl ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {student?.avatarUrl ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-300 ml-1 mr-0.5" />
              )}
              <span>Photograph</span>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Attendance & Academic Progress Cards (Actual Database Data)   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attendance Card */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Attendance
              </span>
              <Badge variant="low" className="bg-slate-100 text-slate-600 border-slate-200">
                Not yet available
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-400 tracking-tight">
              —
            </div>
            <p className="text-[11px] text-slate-500">
              No attendance records published for the current semester yet.
            </p>
            <div className="pt-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Threshold: 80% (Warning) | 75% (Critical)
            </p>
          </CardContent>
        </Card>

        {/* Academic Progress Card */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Academic Progress
              </span>
              <Badge variant="low" className="bg-slate-100 text-slate-600 border-slate-200">
                Not yet available
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-400 tracking-tight">
              — <span className="text-xs font-normal text-slate-400">CGPA</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Semester results will appear once published by the examination branch.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                {student?.academics?.cgpa ? 'Course Enrollment Active' : 'Status: Records Pending'}
              </span>
              <Link to="/student/journey" className="text-purple-700 hover:underline inline-flex items-center font-medium">
                View Journey
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Announcements From Administrator (Actual Database Data)       */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-purple-700" />
            <span>Faculty & Department Announcements</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}
          </span>
        </div>

        {loadingAnnouncements ? (
          <Card className="p-4 text-center text-xs text-slate-400">
            Loading announcements...
          </Card>
        ) : announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <Card key={ann.id} className="p-5 sm:p-6 border-purple-100/90 bg-white shadow-xs space-y-3.5">
                {/* Category & Date Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                      {ann.category}
                    </span>
                    {ann.informationSource && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Source: {ann.informationSource}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {ann.date}
                  </span>
                </div>

                {/* Announcement Title & Formatted Content */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {ann.title}
                  </h3>
                  <AnnouncementContent content={ann.message} />
                </div>

                {/* Publisher Attribution Footer */}
                <div className="pt-3 border-t border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">
                      Published by {ann.publishedByName}
                    </span>
                    <span className="text-slate-400">• Faculty Mentor</span>
                  </div>
                  {ann.informationSource ? (
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-medium">
                      Relayed announcement
                    </span>
                  ) : (
                    <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md font-medium">
                      Direct Mentor Update
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-xs text-slate-400 border-dashed">
            No active announcements have been published by your faculty mentor yet.
          </Card>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Quick Access Grid (Working Student Pages)                     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 text-center pt-2">
        <Link
          to="/student/journey"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex flex-col items-center gap-1.5"
        >
          <BookOpen className="h-5 w-5 text-purple-700" />
          <span className="text-xs font-semibold text-slate-800">My Journey</span>
          <span className="text-[10px] text-slate-400">Coursework & Skills</span>
        </Link>

        <Link
          to="/student/profile"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all flex flex-col items-center gap-1.5"
        >
          <UserCheck className="h-5 w-5 text-purple-700" />
          <span className="text-xs font-semibold text-slate-800">My Profile</span>
          <span className="text-[10px] text-slate-400">
            {student?.profileCompletionPercent ?? 0}% Complete
          </span>
        </Link>
      </div>
    </div>
  )
}
