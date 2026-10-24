import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  ArrowRight,
  Compass,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Dialog } from '@/components/ui/dialog'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, MOCK_ATTENDANCE } from '@/data/mock'
import { studentService } from '@/services/studentService'
import { importService, type ValidatedStudentRow, type ImportRowError, type ImportResult } from '@/services/importService'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentList: React.FC = () => {
  const { isConfigured } = useAuth()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('All')
  const [dbStudents, setDbStudents] = React.useState<any[]>([])

  // Bulk Import Modal State
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [parsedRows, setParsedRows] = React.useState<ValidatedStudentRow[]>([])
  const [parseErrors, setParseErrors] = React.useState<ImportRowError[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null)

  React.useEffect(() => {
    if (isConfigured) {
      studentService.getAllStudents().then((data) => {
        if (data && data.length > 0) {
          setDbStudents(data)
        }
      })
    }
  }, [isConfigured])

  // Combine mock students with real db students if available
  const allStudentProfiles = React.useMemo(() => {
    if (dbStudents.length === 0) return MOCK_STUDENTS

    // Map db students into StudentProfile shape
    return dbStudents.map((db) => {
      const matched = MOCK_STUDENTS.find(s => s.rollNumber.toLowerCase() === db.roll_number.toLowerCase())
      if (matched) {
        return {
          ...matched,
          fullName: db.name,
          email: db.email,
          profileStatus: db.status === 'Active' ? 'Approved' : db.status,
          avatarUrl: db.avatar_url || matched.avatarUrl
        }
      }
      return {
        ...MOCK_STUDENTS[0],
        fullName: db.name,
        rollNumber: db.roll_number,
        email: db.email,
        department: db.department || 'CSE-Data Science',
        year: db.year || 2,
        section: db.section || 'A',
        profileStatus: 'Approved',
        avatarUrl: db.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      }
    })
  }, [dbStudents])

  const filteredStudents = allStudentProfiles.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
    if (statusFilter === 'All') return matchesSearch
    return matchesSearch && s.profileStatus === statusFilter
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsParsing(true)
    setImportResult(null)

    try {
      const { validRows, errors } = await importService.parseCSV(file)
      setParsedRows(validRows)
      setParseErrors(errors)
    } finally {
      setIsParsing(false)
    }
  }

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return
    setIsSubmitting(true)

    try {
      const result = await importService.bulkImportStudents(parsedRows)
      setImportResult(result)
      // Refresh students
      studentService.getAllStudents().then((data) => {
        if (data && data.length > 0) setDbStudents(data)
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetImport = () => {
    setSelectedFile(null)
    setParsedRows([])
    setParseErrors([])
    setImportResult(null)
    setIsImportOpen(false)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-700" />
            Student Mentee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort of 35–40 second-year students in CSE-Data Science.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="text-xs font-bold border-purple-200 text-purple-800 hover:bg-purple-50"
          >
            <Upload className="h-3.5 w-3.5 mr-1 text-purple-700" />
            Bulk CSV Onboarding
          </Button>
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
        message={isConfigured ? "Connected to Supabase PostgreSQL. Displaying verified cohort records with CSV onboarding support." : "Development mode: Displaying representative cohort records covering approved, pending, and changes requested."}
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
            <option value="All">All Statuses ({allStudentProfiles.length})</option>
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

      {/* Bulk CSV Import Modal */}
      <Dialog
        isOpen={isImportOpen}
        onClose={resetImport}
        title="Bulk Student Onboarding via CSV"
        description="Upload a CSV roster of CSE-Data Science students to provision initial cohort profiles."
      >
        <div className="space-y-4 pt-2">
          {!importResult ? (
            <>
              <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center hover:bg-purple-50/50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
                  <FileSpreadsheet className="h-10 w-10 text-purple-600 mb-2" />
                  <span className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Select or drop CSV file'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Required headers: roll_number, name, email
                  </span>
                </label>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-2 text-xs text-purple-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating CSV structure...</span>
                </div>
              )}

              {parsedRows.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{parsedRows.length} valid student rows detected</span>
                  </div>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900 max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{parseErrors.length} issues identified:</span>
                  </div>
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <div key={i} className="text-[11px] pl-5 text-amber-700">
                      Row {err.row}: {err.message}
                    </div>
                  ))}
                  {parseErrors.length > 5 && (
                    <div className="text-[10px] pl-5 text-slate-500">
                      ...and {parseErrors.length - 5} more
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={resetImport}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={parsedRows.length === 0 || isSubmitting}
                  onClick={handleExecuteImport}
                  className="bg-purple-700 hover:bg-purple-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Provisioning Accounts...
                    </>
                  ) : (
                    `Import ${parsedRows.length} Students`
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Onboarding Complete</h4>
              <p className="text-xs text-slate-600">
                Successfully inserted <strong>{importResult.insertedCount}</strong> student profiles into Supabase.
              </p>
              {importResult.errors.length > 0 && (
                <div className="text-left text-xs bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <p className="font-semibold text-amber-800 mb-1">Skipped duplicates/errors:</p>
                  {importResult.errors.map((e, idx) => (
                    <p key={idx} className="text-[11px] text-amber-700">
                      {e.rollNumber ? `[${e.rollNumber}] ` : ''}{e.message}
                    </p>
                  ))}
                </div>
              )}
              <Button type="button" variant="primary" size="sm" onClick={resetImport} className="mt-2">
                Done
              </Button>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
