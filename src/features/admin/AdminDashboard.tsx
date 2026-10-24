import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  Clock,
  CheckSquare,
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, INITIAL_APPROVALS, MOCK_ANNOUNCEMENTS } from '@/data/mock'

export const AdminDashboard: React.FC = () => {
  // Meaningful Chart Data for Attendance Health Distribution
  const attendanceData = [
    { name: 'Good (>80%)', count: 32, fill: '#10B981' },
    { name: 'Warning (75-80%)', count: 4, fill: '#F59E0B' },
    { name: 'Critical (<75%)', count: 2, fill: '#EF4444' },
  ]

  // Academic CGPA Cohort Distribution
  const academicData = [
    { range: '9.0 - 10.0', students: 6 },
    { range: '8.0 - 8.9', students: 18 },
    { range: '7.0 - 7.9', students: 11 },
    { range: '< 7.0', students: 3 },
  ]

  // Students requiring follow-up
  const followUpStudents = MOCK_STUDENTS.filter(
    (s) => s.followUpPriority === 'High' || s.followUpPriority === 'Medium'
  )

  return (
    <div className="space-y-6 pb-8">
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
            Mentoring cohort of 38 adult engineering students (Ages 18–20) • Vignan Institute of Information Technology
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/admin/mentor360">
            <Button variant="primary" size="sm" className="bg-purple-700 hover:bg-purple-800 shadow-md shadow-purple-200">
              <Compass className="h-4 w-4 mr-1.5" />
              Open Mentor 360°
            </Button>
          </Link>
          <Link to="/admin/approvals">
            <Button variant="outline" size="sm" className="bg-white">
              Approvals Queue (2)
            </Button>
          </Link>
        </div>
      </div>

      <DemoNotice
        variant="inline"
        message="Stage 1 Frontend Architecture. Metrics represent structured fictional cohort data for CSE-DS second-year."
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Mentees</span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900">38</div>
            <p className="text-xs text-slate-500">2nd Year (Sections A & B)</p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Approvals</span>
              <Badge variant="pending">Action Required</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-amber-900">2</div>
            <p className="text-xs text-amber-700">Profile diffs staged in queue</p>
          </CardContent>
        </Card>

        {/* Attendance Alerts */}
        <Card className="bg-rose-50/50 border-rose-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Attendance Alerts</span>
              <Badge variant="critical">2 Alerted</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-rose-900">2</div>
            <p className="text-xs text-rose-700">1 Warning (&lt;80%), 1 Critical (&lt;75%)</p>
          </CardContent>
        </Card>

        {/* Follow-up Required */}
        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Priority Follow-ups</span>
              <Badge variant="low">3 Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-purple-950">3</div>
            <p className="text-xs text-purple-800">Pending student commitments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Charts & Urgent Action Items */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Attendance Distribution Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Attendance Health Distribution</CardTitle>
                  <p className="text-xs text-slate-500">Official weekly upload status for CSE-DS</p>
                </div>
                <Badge variant="low">80% Warning / 75% Critical</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-600 border-t border-slate-100">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Good (32)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Warning (4)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Critical (2)</span>
              </div>
            </CardContent>
          </Card>

          {/* Academic Performance Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Cohort CGPA Spread (Sem 1-1 to 2-1)</CardTitle>
              <p className="text-xs text-slate-500">Cumulative academic standings across 38 mentees</p>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={academicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="students" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Follow-up Queue & Approvals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Urgent Follow-up List */}
          <Card className="border-rose-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Mentees Requiring Immediate Attention
                </CardTitle>
                <Badge variant="high">Priority</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {followUpStudents.map((s) => (
                <div
                  key={s.rollNumber}
                  className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={s.avatarUrl} alt={s.fullName} fallback={s.fullName} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{s.fullName}</h4>
                        <span className="text-[10px] font-mono text-indigo-600">{s.rollNumber}</span>
                      </div>
                    </div>
                    <Badge variant={s.followUpPriority === 'High' ? 'high' : 'medium'}>
                      {s.followUpPriority} Priority
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {s.rollNumber === '23L31A5404'
                      ? 'Attendance 71.8% (Critical) following fever leave. Medical condonation slip requires HOD signature.'
                      : s.rollNumber === '23L31A5403'
                      ? 'Sem 1-2 Applied Physics backlog. 2 study commitments due this week.'
                      : 'Lab viva confidence guidance scheduled for upcoming session.'}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">Next Follow-up: {s.nextMentoringDate}</span>
                    <Link
                      to={`/admin/mentor360?roll=${s.rollNumber}`}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center"
                    >
                      Open 360° <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Approvals Quick Card */}
          <Card className="border-amber-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-amber-600" />
                  Approval Queue
                </CardTitle>
                <Link to="/admin/approvals" className="text-xs text-amber-800 font-semibold hover:underline">
                  View All (2)
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {INITIAL_APPROVALS.slice(0, 2).map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{app.studentName}</span>
                    <Badge variant="pending">{app.status}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Section: {app.sectionName}</p>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Submitted {app.submissionDate}</span>
                    <Link to="/admin/approvals" className="text-purple-700 font-semibold hover:underline">
                      Review Changes
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
