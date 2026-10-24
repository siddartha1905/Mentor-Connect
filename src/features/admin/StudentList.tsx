import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  Compass,
  Sparkles,
  Download,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, MOCK_ATTENDANCE } from '@/data/mock'

export const StudentList: React.FC = () => {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('All')

  const filteredStudents = MOCK_STUDENTS.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
    if (statusFilter === 'All') return matchesSearch
    return matchesSearch && s.profileStatus === statusFilter
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-700" />
            Student Mentee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort of 38 second-year students in CSE-Data Science.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/mentor360">
            <Button variant="pastel-lavender" size="sm" className="text-xs font-bold">
              <Compass className="h-3.5 w-3.5 mr-1 text-purple-700" />
              Open Mentor 360° View
            </Button>
          </Link>
        </div>
      </div>

      <DemoNotice
        variant="inline"
        message="7 representative student records covering approved, pending, changes requested, backlogs, and attendance warnings."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll..."
            className="w-full h-9 pl-9 pr-4 text-xs rounded-xl border border-slate-200 outline-none focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none"
          >
            <option value="All">All Statuses ({MOCK_STUDENTS.length})</option>
            <option value="Approved">Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Changes Requested">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-2">Roll Number</th>
                  <th className="py-3 px-2">Section & Year</th>
                  <th className="py-3 px-2 text-center">CGPA</th>
                  <th className="py-3 px-2 text-center">Attendance</th>
                  <th className="py-3 px-2 text-center">Profile Status</th>
                  <th className="py-3 px-2 text-center">Priority</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const att = MOCK_ATTENDANCE[s.rollNumber] || MOCK_ATTENDANCE['23L31A5401']
                  return (
                    <tr key={s.rollNumber} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={s.avatarUrl} alt={s.fullName} fallback={s.fullName} size="sm" />
                          <div>
                            <span className="font-bold text-slate-900 block">{s.fullName}</span>
                            <span className="text-[10px] text-slate-400">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-purple-700">{s.rollNumber}</td>
                      <td className="py-3 px-2 text-slate-600">Sec {s.section} • Year {s.year}</td>
                      <td className="py-3 px-2 text-center font-bold text-indigo-700">{s.academics.cgpa}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-bold ${att.health === 'Critical' ? 'text-rose-600' : att.health === 'Warning' ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {att.officialPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={s.profileStatus === 'Approved' ? 'approved' : s.profileStatus === 'Pending Approval' ? 'pending' : 'changes'}>
                          {s.profileStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={s.followUpPriority === 'High' ? 'high' : s.followUpPriority === 'Medium' ? 'medium' : 'low'}>
                          {s.followUpPriority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/mentor360?roll=${s.rollNumber}`}
                          className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900"
                        >
                          <span>Mentor 360°</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
