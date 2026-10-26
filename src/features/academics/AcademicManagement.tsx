import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Lock,
  Unlock,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { useAuth } from '@/app/providers/AuthContext'
import { MOCK_STUDENTS } from '@/data/mock'

export const AcademicManagement: React.FC = () => {
  const { isDemo } = useAuth()
  const [isLocked, setIsLocked] = React.useState(false)
  const [lockNotice, setLockNotice] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')

  const togglePortalLock = () => {
    setIsLocked(!isLocked)
    setLockNotice(
      !isLocked
        ? 'Internal assessment marks portal locked for Mid-1 evaluations. Subject faculty cannot edit without administrative unlocking.'
        : 'Marks portal unlocked. Faculty mark submissions permitted.'
    )
    setTimeout(() => setLockNotice(null), 5000)
  }

  const sampleSubjects = [
    { code: 'CS2101', name: 'Discrete Mathematical Structures', credits: 4, faculty: 'Prof. V. Sharma', avgMid1: '24.2/30' },
    { code: 'DS2102', name: 'Data Structures & Algorithms', credits: 4, faculty: 'Dr. M. Chaitanya', avgMid1: '25.6/30' },
    { code: 'DS2103', name: 'Python for Data Science & EDA', credits: 3, faculty: 'Dr. K. S. Rao', avgMid1: '26.8/30' },
    { code: 'CS2104', name: 'Computer Org. & Architecture', credits: 3, faculty: 'Prof. T. Murali', avgMid1: '21.5/30' },
    { code: 'DS2105', name: 'Database Management Systems', credits: 4, faculty: 'Dr. S. Lavanya', avgMid1: '24.9/30' },
    { code: 'DS2106L', name: 'DSA & Python Practice Lab', credits: 2, faculty: 'Dr. K. S. Rao', avgMid1: '28.1/30' },
  ]

  const filteredStudents = MOCK_STUDENTS.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-purple-700" />
            Academic Management & Internal Marks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Semester 2-1 coursework monitoring, assessment deadlines and backlog registries.
          </p>
        </div>

        {/* Lock/Unlock Toggle */}
        <Button
          variant={isLocked ? 'destructive' : 'pastel-lavender'}
          size="sm"
          onClick={togglePortalLock}
          className="text-xs font-bold"
        >
          {isLocked ? (
            <>
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Portal Locked (Click to Unlock)
            </>
          ) : (
            <>
              <Unlock className="h-3.5 w-3.5 mr-1.5 text-purple-700" />
              Marks Portal Unlocked (Click to Lock)
            </>
          )}
        </Button>
      </div>

      {lockNotice && (
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="h-4 w-4 text-purple-700 shrink-0" />
          <span>{lockNotice}</span>
        </div>
      )}

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Semester 2-1 curriculum preview."
        />
      )}

      {/* Cohort Subject Overview */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Enrolled Subjects — Semester 2-1 (CSE-DS)</CardTitle>
            <Badge variant="low">6 Common Course Modules</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sampleSubjects.map((sub) => (
              <div
                key={sub.code}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 text-[10px]">
                    {sub.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{sub.credits} Credits</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{sub.name}</h4>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60">
                  <span>Faculty: {sub.faculty}</span>
                  <span className="font-semibold text-indigo-700">Avg Mid-1: {sub.avgMid1}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Academic Standing Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Mentee Academic Ledger (Sem 1-1 to 2-1)</CardTitle>
            <p className="text-xs text-slate-500">Cumulative GPA standings and backlog tracking</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student or roll..."
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
                  <th className="py-2.5 px-2 text-center">Sem 1-1 SGPA</th>
                  <th className="py-2.5 px-2 text-center">Sem 1-2 SGPA</th>
                  <th className="py-2.5 px-2 text-center font-bold">CGPA</th>
                  <th className="py-2.5 px-2 text-center">Active Backlogs</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.rollNumber} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={s.avatarUrl} alt={s.fullName} fallback={s.fullName} size="xs" />
                        <span className="font-semibold text-slate-900">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-medium text-purple-700">{s.rollNumber}</td>
                    <td className="py-2.5 px-2 text-center text-slate-500">{s.academics.sem1_1.sgpa}</td>
                    <td className="py-2.5 px-2 text-center text-slate-500">{s.academics.sem1_2.sgpa}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-indigo-700">{s.academics.cgpa}</td>
                    <td className="py-2.5 px-2 text-center">
                      {s.academics.totalBacklogs > 0 ? (
                        <Badge variant="critical">{s.academics.totalBacklogs} Backlog</Badge>
                      ) : (
                        <span className="text-emerald-700 font-semibold">0 (Clear)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/admin/mentor360?roll=${s.rollNumber}`}
                        className="text-purple-700 font-bold hover:underline"
                      >
                        Inspect
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
