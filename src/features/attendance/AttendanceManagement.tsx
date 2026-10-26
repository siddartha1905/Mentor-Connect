import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Upload,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, MOCK_ATTENDANCE } from '@/data/mock'

export const AttendanceManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [uploadNotice, setUploadNotice] = React.useState(false)

  const studentList = MOCK_STUDENTS.map((s) => ({
    student: s,
    attendance: MOCK_ATTENDANCE[s.rollNumber] || MOCK_ATTENDANCE['23L31A5401'],
  })).filter(
    ({ student }) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUploadClick = () => {
    setUploadNotice(true)
    setTimeout(() => setUploadNotice(false), 5000)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-purple-700" />
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official biometric attendance tracking reconciled with daily student check-ins.
          </p>
        </div>

        {/* Weekly Upload Action Button */}
        <div className="relative">
          <Button
            variant="pastel-lavender"
            size="sm"
            onClick={handleUploadClick}
            className="text-xs font-bold"
          >
            <Upload className="h-3.5 w-3.5 mr-1 text-purple-700" />
            Upload Weekly Register (Excel/CSV)
          </Button>
        </div>
      </div>

      {uploadNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Weekly attendance register import is processed through administrative review.</span>
        </div>
      )}

      {/* Threshold Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/60 border-emerald-200">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Good Standing (&gt;80%)</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-950">32</div>
            <p className="text-[11px] text-emerald-700 mt-1">Full exam eligibility</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/60 border-amber-200">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Warning Zone (75–80%)</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-950">4</div>
            <p className="text-[11px] text-amber-700 mt-1">Advisory notice sent</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/60 border-rose-200">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Critical Shortage (&lt;75%)</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-950">2</div>
            <p className="text-[11px] text-rose-700 mt-1">Medical condonation required</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/60 border-purple-200">
          <CardHeader className="pb-1">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Discrepancy Flags</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-950">3</div>
            <p className="text-[11px] text-purple-700 mt-1">Self vs register mismatches</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-600 border border-slate-200">
        <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
        <span>Official attendance records determine exam eligibility. Student check-ins serve mentoring and welfare follow-up.</span>
      </div>

      {/* Cohort Attendance Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">CSE-DS Mentee Attendance Roster</CardTitle>
            <p className="text-xs text-slate-500">Weekly reconciliation status for all 38 mentees</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name or roll..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-purple-400"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-2">Roll Number</th>
                  <th className="py-2.5 px-2 text-center">Attended / Total</th>
                  <th className="py-2.5 px-3 text-center">Official %</th>
                  <th className="py-2.5 px-2 text-center">Health Status</th>
                  <th className="py-2.5 px-2 text-center">Discrepancies</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentList.map(({ student: s, attendance: a }) => (
                  <tr key={s.rollNumber} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={s.avatarUrl} alt={s.fullName} fallback={s.fullName} size="xs" />
                        <span className="font-semibold text-slate-900">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-medium text-purple-700">{s.rollNumber}</td>
                    <td className="py-2.5 px-2 text-center text-slate-500">{a.classesAttended}/{a.totalClassesHeld}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{a.officialPercentage}%</td>
                    <td className="py-2.5 px-2 text-center">
                      <Badge variant={a.health === 'Good' ? 'good' : a.health === 'Warning' ? 'warning' : 'critical'}>
                        {a.health}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {a.discrepancyCount > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {a.discrepancyCount} Flag
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/mentor360?roll=${s.rollNumber}`}
                        className="text-purple-700 font-bold hover:underline"
                      >
                        View 360°
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
