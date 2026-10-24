import * as React from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, ArrowLeft, Shield, EyeOff, CheckCircle, Mail, Phone, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MOCK_STUDENTS } from '@/data/mock'
import { studentService } from '@/services/studentService'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentDirectory: React.FC = () => {
  const { isConfigured } = useAuth()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [dbDirectory, setDbDirectory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (isConfigured) {
      setLoading(true)
      studentService.getStudentDirectory()
        .then((data) => {
          if (data && data.length > 0) setDbDirectory(data)
        })
        .finally(() => setLoading(false))
    }
  }, [isConfigured])

  // Combine real directory records or fall back to mock
  const studentsToDisplay = React.useMemo(() => {
    if (dbDirectory.length > 0) {
      return dbDirectory.map(item => ({
        fullName: item.name,
        rollNumber: item.roll_number,
        department: item.department,
        section: item.section,
        avatarUrl: item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        email: item.email,
        phone: item.phone,
        isPhoneShared: item.phone !== 'Confidential',
        isEmailShared: item.email !== 'Confidential'
      }))
    }

    return MOCK_STUDENTS.map(s => ({
      fullName: s.fullName,
      rollNumber: s.rollNumber,
      department: s.department,
      section: s.section,
      avatarUrl: s.avatarUrl,
      email: s.rollNumber === '23L31A5401' ? s.email : 'Confidential',
      phone: s.rollNumber === '23L31A5401' ? s.phone : 'Confidential',
      isPhoneShared: s.rollNumber === '23L31A5401',
      isEmailShared: s.rollNumber === '23L31A5401'
    }))
  }, [dbDirectory])

  const filteredStudents = studentsToDisplay.filter(
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
          {studentsToDisplay.length} CSE-DS Mentees Listed
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
            Name and roll number are visible. Personal phone numbers and emails remain hidden unless explicitly opted in by the student.
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

      {loading && (
        <div className="flex items-center justify-center p-6 gap-2 text-xs text-indigo-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading student directory view...</span>
        </div>
      )}

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
                
                {/* Contact items if opted in */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {s.isEmailShared ? (
                    <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                      <Mail className="h-2.5 w-2.5 text-indigo-600" /> {s.email}
                    </span>
                  ) : null}
                  {s.isPhoneShared ? (
                    <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                      <Phone className="h-2.5 w-2.5 text-emerald-600" /> {s.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right shrink-0">
              {s.isPhoneShared || s.isEmailShared ? (
                <Badge variant="approved" className="text-[10px]">
                  <CheckCircle className="h-2.5 w-2.5 mr-1 text-emerald-600" />
                  Opted In
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  <EyeOff className="h-2.5 w-2.5 mr-1 text-slate-400" />
                  Masked
                </Badge>
              )}
              <span className="text-[10px] text-slate-400">
                {s.isPhoneShared && s.isEmailShared ? 'All Shared' : s.isEmailShared ? 'Email Shared' : s.isPhoneShared ? 'Phone Shared' : 'Confidential'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
