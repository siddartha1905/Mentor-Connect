import * as React from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, ArrowLeft, Shield, EyeOff, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS } from '@/data/mock'

export const StudentDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('')

  const filteredStudents = MOCK_STUDENTS.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <Link
          to="/student/more"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to More</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          {MOCK_STUDENTS.length} CSE-DS Mentees Listed
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          CSE-DS Mentee Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Peer directory for 2nd year Data Science cohort. Contact details are masked by default.
        </p>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
        <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Privacy Safeguard Notice:</span>
          <p className="text-blue-800/90 text-[11px] mt-0.5 leading-relaxed">
            Name and college roll number are visible by default. Personal phone numbers and emails remain hidden unless explicitly opted in by the student.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by student name or roll number (e.g. 5401, Bhavya)..."
          className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-xs"
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
      </div>

      {/* Student List */}
      <div className="space-y-2.5">
        {filteredStudents.map((s) => (
          <Card key={s.rollNumber} className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={s.avatarUrl} alt={s.fullName} fallback={s.fullName} size="md" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">{s.fullName}</h4>
                <p className="text-[11px] font-mono text-indigo-600 font-semibold">{s.rollNumber}</p>
                <p className="text-[10px] text-slate-400">Section {s.section} • {s.department}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <Badge variant="outline" className="text-[10px]">
                <EyeOff className="h-2.5 w-2.5 mr-1 text-slate-400" />
                Contact Masked
              </Badge>
              <span className="text-[10px] text-slate-400">Opt-in Required</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
