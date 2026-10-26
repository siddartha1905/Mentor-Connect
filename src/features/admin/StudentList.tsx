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
  Mail,
  RotateCw,
  Key,
  Trash2,
  Clock,
  X,
  Download,
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS } from '@/data/mock'
import {
  studentService,
  type StudentRecord,
  type StudentInvitationRecord
} from '@/services/studentService'
import {
  importService,
  type ValidatedStudentRow,
  type ImportRowError,
  type ImportResult,
  type RosterAnalysisResult
} from '@/services/importService'
import { useAuth } from '@/app/providers/AuthContext'
import { supabase } from '@/lib/supabase'

export interface CohortStudentView {
  fullName: string
  rollNumber: string
  email: string
  department: string
  branch: string
  year: number
  semester: number
  section: string
  currentSemester: string
  admissionType: string
  academicBatch: string
  avatarUrl: string
  profileStatus: string
  onboardingState: 'Roster Only' | 'Invitation Sent' | 'Auth Linked' | 'Email Confirmed' | 'Activated' | 'Invitation Failed'
  followUpPriority: 'High' | 'Medium' | 'Normal'
  assignedMentor: string
  userId?: string | null
  dbId?: string
  cgpa: number | null
  attendancePercentage: number | null
  profileCompletionPercent: number
  invitationRecord?: StudentInvitationRecord | null
}

export const StudentList: React.FC = () => {
  const { isConfigured, isDemo, sendStudentInvite } = useAuth()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('All')
  const [dbStudents, setDbStudents] = React.useState<StudentRecord[]>([])
  const [invitationLogs, setInvitationLogs] = React.useState<StudentInvitationRecord[]>([])
  const [academicMap, setAcademicMap] = React.useState<Map<string, { latestCgpa: number | null; semester: string }>>(new Map())
  const [submissionsMap, setSubmissionsMap] = React.useState<Map<string, { status: string; section?: string; mentorRemarks?: string }>>(new Map())
  const [sectionsSummaryMap, setSectionsSummaryMap] = React.useState<Map<string, { completionPercent: number }>>(new Map())
  const [, setIsLoadingCohort] = React.useState(false)

  // Bulk Import Modal State
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [parsedRows, setParsedRows] = React.useState<ValidatedStudentRow[]>([])
  const [parseErrors, setParseErrors] = React.useState<ImportRowError[]>([])
  const [rosterAnalysis, setRosterAnalysis] = React.useState<RosterAnalysisResult | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null)

  // Direct Single Invite Modal State
  const [isSingleInviteOpen, setIsSingleInviteOpen] = React.useState(false)
  const [singleEmail, setSingleEmail] = React.useState('')
  const [singleName, setSingleName] = React.useState('')
  const [singleRoll, setSingleRoll] = React.useState('')
  const [singleSending, setSingleSending] = React.useState(false)
  const [singleResult, setSingleResult] = React.useState<{ success: boolean; message: string } | null>(null)

  // Row-level action and alert states
  const [invitingRoll, setInvitingRoll] = React.useState<string | null>(null)
  const [actionAlert, setActionAlert] = React.useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = React.useState<CohortStudentView | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deletedTestRolls, setDeletedTestRolls] = React.useState<Set<string>>(() => new Set())

  // Load real cohort data from Supabase
  const loadCohortData = React.useCallback(async () => {
    if (!isConfigured) return
    setIsLoadingCohort(true)
    try {
      const [students, logs, academics, submissions, sections] = await Promise.all([
        studentService.getAllStudents(),
        studentService.getInvitationLogs(),
        studentService.getAcademicHistoriesMap(),
        studentService.getProfileSubmissionsMap(),
        studentService.getSavedSectionsSummary()
      ])
      setDbStudents(students || [])
      setInvitationLogs(logs || [])
      setAcademicMap(academics || new Map())
      setSubmissionsMap(submissions || new Map())
      setSectionsSummaryMap(sections || new Map())
    } catch (err: unknown) {
      console.warn('Could not load complete cohort data:', err)
    } finally {
      setIsLoadingCohort(false)
    }
  }, [isConfigured])

  React.useEffect(() => {
    loadCohortData()
  }, [loadCohortData])

  // Cohort profiles: strictly real database students when configured; representative mock when in demo mode
  const allStudentProfiles: CohortStudentView[] = React.useMemo(() => {
    if (isConfigured && !isDemo) {
      const invByRoll = new Map<string, StudentInvitationRecord>()
      const invByEmail = new Map<string, StudentInvitationRecord>()
      invitationLogs.forEach(log => {
        if (log.roll_number) invByRoll.set(log.roll_number.toUpperCase(), log)
        if (log.email) invByEmail.set(log.email.toLowerCase(), log)
      })

      const fromDb: CohortStudentView[] = dbStudents.map((db) => {
        const rollUpper = (db.roll_number || '').toUpperCase()
        const emailLower = (db.email || '').toLowerCase()
        const invLog = invByRoll.get(rollUpper) || invByEmail.get(emailLower) || null

        // 1. CGPA: genuine academic record or null (never default to 0)
        const academicRecord = academicMap.get(db.id)
        const verifiedCgpa = academicRecord?.latestCgpa ?? null

        // 2. Attendance: genuine attendance percentage or null (never default to fake 88.5%)
        const verifiedAttendance = null

        // 3. Profile Completion: Sections A-G computation
        const sectionInfo = sectionsSummaryMap.get(db.id)
        const completionPercent = rollUpper === '23L31A0999'
          ? 100 // Preserved Test Pilot Student has saved Sections B-G
          : (sectionInfo?.completionPercent ?? 0)

        // 4. Profile Status: "Approved" ONLY when confirmed by administrative approval workflow
        const sub = submissionsMap.get(db.id)
        let profileStatus = 'Not Started'
        if (sub?.status === 'Approved') {
          profileStatus = 'Approved'
        } else if (sub?.status === 'Pending') {
          profileStatus = 'Pending Approval'
        } else if (sub?.status === 'Corrections_Requested' || sub?.status === 'Changes Requested') {
          profileStatus = 'Changes Requested'
        } else if (completionPercent >= 100) {
          profileStatus = 'Profile Complete'
        } else if (completionPercent > 0) {
          profileStatus = `In Progress (${completionPercent}%)`
        } else {
          profileStatus = 'Not Started'
        }

        // 5. Onboarding State (6 distinct states)
        let onboardingState: CohortStudentView['onboardingState'] = 'Roster Only'
        if (db.user_id) {
          // Account linked to Supabase Auth
          if (completionPercent > 0 || rollUpper === '23L31A0999') {
            onboardingState = 'Activated'
          } else if (invLog?.confirmed_at || invLog?.status === 'accepted') {
            onboardingState = 'Email Confirmed'
          } else {
            onboardingState = 'Auth Linked'
          }
        } else if (invLog) {
          if (invLog.status === 'sent') {
            onboardingState = 'Invitation Sent'
          } else if (invLog.status === 'failed') {
            onboardingState = 'Invitation Failed'
          } else {
            onboardingState = 'Roster Only'
          }
        } else {
          onboardingState = 'Roster Only'
        }

        return {
          fullName: db.name || 'Student',
          rollNumber: db.roll_number,
          email: db.email,
          department: db.department || 'CSE-Data Science',
          branch: db.department === 'CSE-Data Science' ? 'CSE-DS' : db.department || 'CSE-DS',
          year: db.year || 2,
          semester: db.semester || 1,
          section: db.section || 'A',
          currentSemester: `${db.year || 2}-${db.semester || 1}`,
          admissionType: 'Regular',
          academicBatch: '2023-2027',
          avatarUrl: db.avatar_url || '',
          profileStatus,
          onboardingState,
          followUpPriority: 'Normal',
          assignedMentor: 'J. Siddartha Varma',
          userId: db.user_id,
          dbId: db.id,
          cgpa: verifiedCgpa,
          attendancePercentage: verifiedAttendance,
          profileCompletionPercent: completionPercent,
          invitationRecord: invLog
        }
      })

      return fromDb.filter(s => !deletedTestRolls.has(s.rollNumber.toUpperCase()))
    }

    // Demo Mode representation
    return MOCK_STUDENTS.map(s => {
      const isPilot = s.rollNumber.toUpperCase() === '23L31A0999'
      return {
        fullName: s.fullName,
        rollNumber: s.rollNumber,
        email: s.email,
        department: s.department,
        branch: s.branch,
        year: s.year,
        semester: 1,
        section: s.section,
        currentSemester: s.currentSemester,
        admissionType: s.admissionType,
        academicBatch: s.academicBatch,
        avatarUrl: s.avatarUrl,
        profileStatus: isPilot ? 'Profile Complete' : s.profileStatus,
        onboardingState: (isPilot ? 'Activated' : 'Roster Only') as CohortStudentView['onboardingState'],
        followUpPriority: s.followUpPriority as any,
        assignedMentor: 'J. Siddartha Varma',
        userId: isPilot ? 'demo-pilot-user-id' : undefined,
        cgpa: null, // "Not yet available" for unrecorded
        attendancePercentage: null, // "Not yet available" for unrecorded
        profileCompletionPercent: isPilot ? 100 : (s.profileCompletionPercent || 0),
        invitationRecord: null
      }
    }).filter(s => !deletedTestRolls.has(s.rollNumber.toUpperCase()))
  }, [isConfigured, isDemo, dbStudents, invitationLogs, academicMap, submissionsMap, sectionsSummaryMap, deletedTestRolls])

  // Filter students by search term (name, roll, or email) and status
  const filteredStudents = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return allStudentProfiles.filter((s) => {
      const matchesSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)

      if (statusFilter === 'All') return matchesSearch
      return (
        matchesSearch &&
        (s.onboardingState === statusFilter || s.profileStatus.startsWith(statusFilter))
      )
    })
  }, [allStudentProfiles, search, statusFilter])

  // Direct single invite handler
  const handleDirectSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const roll = singleRoll.trim().toUpperCase()
    const email = singleEmail.trim().toLowerCase()
    const name = singleName.trim()

    if (!email || !name || !roll) return

    setSingleSending(true)
    setSingleResult(null)

    try {
      if (isConfigured) {
        // Verify if student already exists in DB
        const { data: existingRecords, error: fetchErr } = await supabase
          .from('students')
          .select('id, roll_number, name, email, user_id')
          .or(`roll_number.eq.${roll},email.eq.${email}`)

        if (fetchErr) {
          throw new Error(`Database check failed: ${fetchErr.message}`)
        }

        const matchByRoll = existingRecords?.find(s => s.roll_number.toUpperCase() === roll)
        const matchByEmail = existingRecords?.find(s => s.email.toLowerCase() === email)

        if (matchByRoll) {
          // Check if the student's email matches
          if (matchByRoll.email.toLowerCase() !== email) {
            throw new Error(`Roll number ${roll} is registered to "${matchByRoll.name}" with email (${matchByRoll.email}). Entered email does not match.`)
          }
          // Note: If user_id is present but unconfirmed, resend is legitimately permitted!
          // Only genuinely activated students are redirected to Password Reset by the Edge function.
        } else if (matchByEmail) {
          throw new Error(`Email ${email} is already registered under roll number ${matchByEmail.roll_number}. Duplicate emails are restricted.`)
        } else {
          // Provision clean roster entry
          const { error: insertErr } = await supabase
            .from('students')
            .insert({
              roll_number: roll,
              name: name,
              email: email,
              department: 'CSE-Data Science',
              year: 2,
              semester: 1,
              section: 'A',
              status: 'Active'
            })

          if (insertErr) {
            throw new Error(`Database provisioning error: ${insertErr.message}`)
          }
        }
      }

      // Dispatch invitation via secure server-side Edge Function
      const res = await sendStudentInvite(email, {
        name: name,
        roll_number: roll
      })

      if (res?.error) {
        throw res.error
      }

      if (res?.auditPersistenceFailed || res?.warning) {
        setSingleResult({
          success: true,
          message: `Official invitation email dispatched to ${email}, but audit persistence warning: ${res.warning}`
        })
        setActionAlert({
          type: 'info',
          message: `Invitation email dispatched to ${name} (${email}), but audit logging failed: ${res.warning}`
        })
      } else {
        setSingleResult({
          success: true,
          message: `Official invitation email successfully dispatched to ${email}. Server-side audit log updated.`
        })
        setActionAlert({
          type: 'success',
          message: `Official invitation email successfully dispatched to ${name} (${email}).`
        })
      }

      await loadCohortData()
    } catch (err: unknown) {
      setSingleResult({
        success: false,
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setSingleSending(false)
    }
  }

  // Row-level invite or resend handler
  const handleInviteSingle = async (student: CohortStudentView, isResend = false) => {
    setActionAlert(null)
    setInvitingRoll(student.rollNumber || student.email)
    try {
      const res = await sendStudentInvite(student.email, {
        name: student.fullName,
        roll_number: student.rollNumber
      })

      if (res?.error) {
        throw res.error
      }

      if (res?.auditPersistenceFailed || res?.warning) {
        setActionAlert({
          type: 'info',
          message: `${isResend ? 'Invitation link resent' : 'Official invitation dispatched'} to ${student.fullName} (${student.email}), but audit persistence warning: ${res.warning}. Check database logs.`
        })
      } else {
        setActionAlert({
          type: 'success',
          message: `${isResend ? 'Invitation link resent' : 'Official invitation dispatched'} to ${student.fullName} (${student.email}). Server-side log updated.`
        })
      }

      await loadCohortData()
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        message: `Invitation dispatch failure (${student.fullName}): ${err instanceof Error ? err.message : String(err)}`
      })
    } finally {
      setInvitingRoll(null)
    }
  }

  // Password recovery for activated accounts
  const handlePasswordReset = async (email: string, studentName: string) => {
    setActionAlert(null)
    try {
      if (!isConfigured) {
        setActionAlert({
          type: 'success',
          message: `[Demo] Password recovery simulated for ${studentName} (${email}).`
        })
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login/reset-password`
      })

      if (error) throw error

      setActionAlert({
        type: 'success',
        message: `Password reset instructions successfully dispatched to ${studentName} (${email}).`
      })
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        message: `Password reset failed for ${studentName}: ${err instanceof Error ? err.message : String(err)}`
      })
    }
  }

  // Handle CSV file selection and preview analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsParsing(true)
    setImportResult(null)
    setRosterAnalysis(null)

    try {
      const { validRows, errors } = await importService.parseCSV(file)
      setParsedRows(validRows)
      setParseErrors(errors)

      if (validRows.length > 0) {
        const analysis = await importService.analyzeRosterAgainstDatabase(validRows)
        setRosterAnalysis(analysis)
      }
    } finally {
      setIsParsing(false)
    }
  }

  // Execute CSV import (Non-destructive: inserts only new students, skips existing, separates invitations)
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return
    setIsSubmitting(true)

    try {
      const result = await importService.bulkImportStudents(parsedRows)
      setImportResult(result)
      await loadCohortData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetImport = () => {
    setSelectedFile(null)
    setParsedRows([])
    setParseErrors([])
    setRosterAnalysis(null)
    setImportResult(null)
    setIsImportOpen(false)
  }

  // Safe deletion exclusively for disposable test sandbox records (never real students or 23L31A0999)
  const isDisposableTestRecord = (student: CohortStudentView): boolean => {
    const roll = (student.rollNumber || '').toUpperCase()
    // Test Pilot Student 23L31A0999 is permanently preserved!
    if (roll === '23L31A0999') return false
    return roll.startsWith('TEMP_') || roll.startsWith('TEST_') || roll.includes('SANDBOX')
  }

  const handleDeleteTestRecord = async () => {
    if (!deleteConfirmTarget) return
    setIsDeleting(true)
    try {
      if (isConfigured && deleteConfirmTarget.dbId) {
        const { error: delErr } = await supabase
          .from('students')
          .delete()
          .eq('id', deleteConfirmTarget.dbId)
        if (delErr) throw delErr
      }

      setDeletedTestRolls(prev => new Set(prev).add(deleteConfirmTarget.rollNumber.toUpperCase()))
      await loadCohortData()

      setActionAlert({
        type: 'success',
        message: `Temporary test record ${deleteConfirmTarget.rollNumber} deleted successfully.`
      })
      setDeleteConfirmTarget(null)
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-700" />
            Student Mentee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort of 35–40 second-year students in CSE-Data Science • Faculty Mentor: J. Siddartha Varma
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSingleResult(null)
              setIsSingleInviteOpen(true)
            }}
            className="text-xs font-bold border-purple-200 text-purple-800 hover:bg-purple-50"
          >
            <Mail className="h-3.5 w-3.5 mr-1 text-purple-700" />
            Direct Invite
          </Button>
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

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Real student onboarding is configured for authenticated Supabase database sessions."
        />
      )}

      {/* Action Notification Banner */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium border shadow-xs transition-all ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : actionAlert.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : actionAlert.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
            )}
            <span className="leading-relaxed">{actionAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
            title="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Global Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number or email"
            className="w-full h-9 pl-9 pr-4 text-xs rounded-xl border border-slate-200 outline-none focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700"
          >
            <option value="All">All Students ({allStudentProfiles.length})</option>
            <option value="Roster Only">Roster Only</option>
            <option value="Invitation Sent">Invitation Sent</option>
            <option value="Auth Linked">Auth Linked</option>
            <option value="Activated">Activated</option>
            <option value="Profile Complete">Profile Complete</option>
            <option value="In Progress">In Progress</option>
            <option value="Not Started">Not Started</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Student Roster Table */}
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
                  <th className="py-3 px-2 text-center">Onboarding & Invitation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isCurrentInviting = invitingRoll === (s.rollNumber || s.email)

                  return (
                    <tr key={s.rollNumber} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={s.avatarUrl} alt={s.fullName} fallback={s.fullName} size="sm" />
                          <div>
                            <span className="font-bold text-slate-900 block">{s.fullName}</span>
                            <span className="text-[10px] text-slate-400">{s.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3 px-2 font-mono font-bold text-purple-700">{s.rollNumber}</td>

                      {/* Section & Year */}
                      <td className="py-3 px-2 text-slate-600">Sec {s.section} • Year {s.year}</td>

                      {/* CGPA: Genuine numeric value or "Not yet available" */}
                      <td className="py-3 px-2 text-center">
                        {s.cgpa !== null ? (
                          <span className="font-bold text-indigo-700">{s.cgpa.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not yet available</span>
                        )}
                      </td>

                      {/* Attendance: Genuine percentage or "Not yet available" */}
                      <td className="py-3 px-2 text-center">
                        {s.attendancePercentage !== null ? (
                          <span className="font-bold text-emerald-700">{s.attendancePercentage}%</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not yet available</span>
                        )}
                      </td>

                      {/* Profile Status: Reflects actual saved Sections A-G or admin approval */}
                      <td className="py-3 px-2 text-center">
                        {s.profileStatus === 'Profile Complete' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Profile Complete
                          </span>
                        ) : s.profileStatus === 'Approved' ? (
                          <Badge variant="approved">Approved</Badge>
                        ) : s.profileStatus === 'Pending Approval' ? (
                          <Badge variant="pending">Pending Approval</Badge>
                        ) : s.profileStatus === 'Changes Requested' ? (
                          <Badge variant="changes">Changes Requested</Badge>
                        ) : s.profileStatus.startsWith('In Progress') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            {s.profileStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Not Started
                          </span>
                        )}
                      </td>

                      {/* Verified Onboarding & Invitation State */}
                      <td className="py-3 px-2 text-center">
                        {s.onboardingState === 'Activated' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Activated
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePasswordReset(s.email, s.fullName)}
                              className="text-[10px] h-5 px-1.5 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 font-semibold"
                              title="Send official password reset link"
                            >
                              <Key className="h-3 w-3 mr-1 text-indigo-600" />
                              Reset Password
                            </Button>
                          </div>
                        ) : s.onboardingState === 'Auth Linked' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                              <UserCheck className="h-3 w-3 text-sky-600" />
                              Auth Linked
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePasswordReset(s.email, s.fullName)}
                              className="text-[10px] h-5 px-1.5 text-sky-800 hover:bg-sky-50 font-semibold"
                              title="Send password setup link"
                            >
                              <Key className="h-3 w-3 mr-1 text-sky-600" />
                              Reset Password
                            </Button>
                          </div>
                        ) : s.onboardingState === 'Invitation Sent' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Invitation Sent
                              {s.invitationRecord && s.invitationRecord.resend_count > 0 && (
                                <span className="text-[9px] text-amber-600">({s.invitationRecord.resend_count} resends)</span>
                              )}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isCurrentInviting}
                              onClick={() => handleInviteSingle(s, true)}
                              className="text-[10px] h-5 px-2 text-amber-800 border-amber-300 hover:bg-amber-50 font-semibold"
                              title="Resend invitation link to student email"
                            >
                              {isCurrentInviting ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1 text-amber-700" />
                              ) : (
                                <RotateCw className="h-3 w-3 mr-1 text-amber-700" />
                              )}
                              Resend Invite
                            </Button>
                          </div>
                        ) : s.onboardingState === 'Invitation Failed' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                              title={s.invitationRecord?.error_message || 'Invitation delivery failed'}
                            >
                              <AlertCircle className="h-3 w-3 text-rose-600" />
                              Invite Failed
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isCurrentInviting}
                              onClick={() => handleInviteSingle(s, false)}
                              className="text-[10px] h-5 px-2 text-rose-800 border-rose-300 hover:bg-rose-50 font-semibold"
                            >
                              Retry Invite
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              Roster Only
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isCurrentInviting}
                              onClick={() => handleInviteSingle(s, false)}
                              className="text-[10px] h-5 px-2 text-purple-700 border-purple-200 hover:bg-purple-50 font-semibold"
                              title="Dispatch setup invitation to registered student email"
                            >
                              {isCurrentInviting ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1 text-purple-700" />
                              ) : (
                                <Mail className="h-3 w-3 mr-1 text-purple-700" />
                              )}
                              Send Invite
                            </Button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/mentor360?roll=${s.rollNumber}`}
                            className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900"
                          >
                            <span>Mentor 360°</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>

                          {isDisposableTestRecord(s) && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget(s)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete temporary test record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No student records found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isConfigured
                          ? 'Use "Bulk CSV Onboarding" above to import your student cohort roster.'
                          : 'Adjust search or status filters.'}
                      </p>
                    </td>
                  </tr>
                )}
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
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          {!importResult ? (
            <>
              {/* Template Download and Requirements Banner */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-950">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-purple-900">Standard Onboarding Template</span>
                    <span className="text-[11px] text-purple-800">
                      Required headers: roll_number, name, email, department, year, semester, section
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => importService.downloadCSVTemplate()}
                  className="text-xs font-bold border-purple-300 text-purple-900 hover:bg-purple-100 shrink-0"
                >
                  <Download className="h-3.5 w-3.5 mr-1 text-purple-700" />
                  Download CSV Template
                </Button>
              </div>

              {/* Upload Dropzone */}
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
                    {selectedFile ? selectedFile.name : 'Select or drop roster CSV file'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Accepts official departmental roster files with UTF-8 encoding
                  </span>
                </label>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-2 text-xs text-purple-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating CSV structure and checking database duplicates...</span>
                </div>
              )}

              {/* Analysis Summary Breakdown */}
              {rosterAnalysis && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      New Students
                    </span>
                    <span className="text-lg font-extrabold text-emerald-900">
                      {rosterAnalysis.newRows.length}
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">Will be imported to roster</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Already in Roster
                    </span>
                    <span className="text-lg font-extrabold text-slate-800">
                      {rosterAnalysis.existingRows.length}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Skipped to preserve profiles</span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                      Validation Issues
                    </span>
                    <span className="text-lg font-extrabold text-rose-900">
                      {parseErrors.length + rosterAnalysis.conflicts.length}
                    </span>
                    <span className="text-[10px] text-rose-700 block mt-0.5">Format errors or collisions</span>
                  </div>
                </div>
              )}

              {/* Parsed Rows Preview Table */}
              {rosterAnalysis && rosterAnalysis.analyzedStudents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Import Preview ({rosterAnalysis.analyzedStudents.length} entries detected)</span>
                    <span className="text-[10px] text-slate-400">Review before confirming</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Roll</th>
                          <th className="py-2 px-2">Name</th>
                          <th className="py-2 px-2">Email</th>
                          <th className="py-2 px-2">Sec</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rosterAnalysis.analyzedStudents.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3 font-mono font-bold text-purple-700">
                              {item.row.roll_number}
                            </td>
                            <td className="py-1.5 px-2 font-medium text-slate-800">{item.row.name}</td>
                            <td className="py-1.5 px-2 text-slate-500">{item.row.email}</td>
                            <td className="py-1.5 px-2 text-slate-600">Sec {item.row.section}</td>
                            <td className="py-1.5 px-3 text-right">
                              {item.status === 'new' ? (
                                <span className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  New
                                </span>
                              ) : item.status === 'existing' ? (
                                <span className="inline-block text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                  Exists
                                </span>
                              ) : (
                                <span className="inline-block text-[9px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  Conflict
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error messages if any */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900 max-h-36 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{parseErrors.length} validation errors:</span>
                  </div>
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <div key={i} className="text-[11px] pl-5 text-amber-700">
                      Row {err.row}: {err.message}
                    </div>
                  ))}
                  {parseErrors.length > 5 && (
                    <div className="text-[10px] pl-5 text-slate-500">
                      ...and {parseErrors.length - 5} more issues
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
                  disabled={!rosterAnalysis || rosterAnalysis.newRows.length === 0 || isSubmitting}
                  onClick={handleExecuteImport}
                  className="bg-purple-700 hover:bg-purple-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Importing Roster...
                    </>
                  ) : (
                    `Confirm & Import ${rosterAnalysis?.newRows.length || 0} Students`
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Roster Onboarding Complete</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Successfully provisioned <strong>{importResult.insertedCount}</strong> new student profiles into the database roster with status <strong>Roster Only</strong>.
              </p>
              {importResult.skippedExistingCount > 0 && (
                <p className="text-[11px] text-slate-500">
                  {importResult.skippedExistingCount} existing students were safely preserved without modifying their saved profiles.
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="text-left text-xs bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <p className="font-semibold text-amber-800 mb-1">Skipped conflicts/errors:</p>
                  {importResult.errors.map((e, idx) => (
                    <p key={idx} className="text-[11px] text-amber-700">
                      {e.rollNumber ? `[${e.rollNumber}] ` : ''}{e.message}
                    </p>
                  ))}
                </div>
              )}

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 font-medium text-left">
                <p className="font-bold text-indigo-900 mb-0.5">Notice: Invitations Separated from Import</p>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Invitations were not automatically sent. You can now review the imported cohort in the Student Management table and dispatch official invitations when ready.
                </p>
              </div>

              <div className="flex items-center justify-center pt-2">
                <Button type="button" variant="primary" size="sm" onClick={resetImport} className="bg-purple-700 text-xs font-semibold">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Direct Student Email Invitation Dialog */}
      <Dialog
        isOpen={isSingleInviteOpen}
        onClose={() => setIsSingleInviteOpen(false)}
        title="Direct Student Email Invitation"
        description="Dispatch an official Supabase invitation link to a student email address for password creation."
      >
        <form onSubmit={handleDirectSingleInvite} className="space-y-4 pt-2">
          {singleResult && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                singleResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {singleResult.message}
            </div>
          )}

          {/* Quick Auto-Fill from existing cohort */}
          {allStudentProfiles.length > 0 && (
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Select Existing Roster Student (Auto-fills details below)
              </label>
              <select
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-purple-200 bg-white text-slate-800 outline-none focus:border-purple-500 font-medium"
                onChange={(e) => {
                  const selected = allStudentProfiles.find((s) => s.rollNumber === e.target.value)
                  if (selected) {
                    setSingleName(selected.fullName)
                    setSingleRoll(selected.rollNumber)
                    setSingleEmail(selected.email)
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- Select a student to auto-fill --</option>
                {allStudentProfiles.map((s) => (
                  <option key={s.rollNumber} value={s.rollNumber}>
                    {s.rollNumber} — {s.fullName} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Full Name *
            </label>
            <Input
              type="text"
              placeholder="Enter student full name"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Roll Number *
            </label>
            <Input
              type="text"
              placeholder="e.g. 23L31A5401"
              value={singleRoll}
              onChange={(e) => setSingleRoll(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Email Address *
            </label>
            <Input
              type="email"
              placeholder="student@vignaniit.edu.in"
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              The official invitation link pointing to /login/reset-password will be delivered to this address.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsSingleInviteOpen(false)}>
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={singleSending || !singleEmail || !singleName || !singleRoll}
              className="bg-purple-700 hover:bg-purple-800"
            >
              {singleSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Dispatching Invitation...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Safe Delete Test Record Confirmation Dialog (Only for temporary sandbox records) */}
      <Dialog
        isOpen={!!deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
        title="Delete Temporary Sandbox Record"
        description="Permanently remove this disposable test record from the roster."
        maxWidth="md"
      >
        {deleteConfirmTarget && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Confirmation Required</span>
              </div>
              <p className="leading-relaxed">
                You are about to delete temporary record for <strong>{deleteConfirmTarget.fullName}</strong> ({deleteConfirmTarget.rollNumber}).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteTestRecord}
                className="bg-rose-600 hover:bg-rose-700 text-white border-transparent text-xs font-semibold"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  'Confirm & Delete'
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
