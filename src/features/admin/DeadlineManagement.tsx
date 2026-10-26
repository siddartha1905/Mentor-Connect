import * as React from 'react'
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Trash2,
  RefreshCw,
  Sliders,
  CalendarClock,
  ArrowRight,
  Lock,
  Unlock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useAuth } from '@/app/providers/AuthContext'
import { studentService, type StudentRecord } from '@/services/studentService'
import {
  deadlineService,
  type DeadlineSettings,
  type StudentOverrideItem,
} from '@/services/deadlineService'

export const DeadlineManagement: React.FC = () => {
  const { isConfigured, isDemo } = useAuth()

  const [settings, setSettings] = React.useState<DeadlineSettings | null>(null)
  const [overrides, setOverrides] = React.useState<StudentOverrideItem[]>([])
  const [students, setStudents] = React.useState<StudentRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [savingGlobal, setSavingGlobal] = React.useState(false)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  // Global Deadline Edit State
  const [dateInput, setDateInput] = React.useState('2026-11-03')
  const [timeInput, setTimeInput] = React.useState('23:59:59')
  const [isEnabledState, setIsEnabledState] = React.useState(true)

  // Individual Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false)
  const [selectedStudentId, setSelectedStudentId] = React.useState('')
  const [selectedSection, setSelectedSection] = React.useState('all')
  const [overrideDateInput, setOverrideDateInput] = React.useState('2026-11-10')
  const [overrideTimeInput, setOverrideTimeInput] = React.useState('23:59:59')
  const [overrideReason, setOverrideReason] = React.useState('')
  const [grantingOverride, setGrantingOverride] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [currentSettings, currentOverrides, allStudents] = await Promise.all([
        deadlineService.getDeadlineSettings(),
        deadlineService.getAllOverrides(),
        studentService.getAllStudents(),
      ])

      setSettings(currentSettings)
      setOverrides(currentOverrides)
      setStudents(allStudents || [])
      setIsEnabledState(currentSettings.is_enabled)

      // Initialize inputs from current deadline
      if (currentSettings.deadline) {
        const parts = currentSettings.deadline.split('T')
        if (parts[0]) setDateInput(parts[0])
        if (parts[1]) {
          const timePart = parts[1].split('+')[0]
          setTimeInput(timePart || '23:59:59')
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveGlobalDeadline = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGlobal(true)
    try {
      const isoString = `${dateInput}T${timeInput}+05:30`
      const { data, error } = await deadlineService.updateDeadlineSettings(
        isoString,
        isEnabledState
      )

      if (data) {
        setSettings(data)
        setFeedback('Global deadline successfully updated and enforced in Supabase.')
      } else {
        setFeedback('Failed to update deadline: ' + (error?.message || 'Unknown error'))
      }
      setTimeout(() => setFeedback(null), 4000)
    } finally {
      setSavingGlobal(false)
    }
  }

  const handleQuickExtend = (days: number) => {
    const base = new Date(`${dateInput}T${timeInput}+05:30`)
    base.setDate(base.getDate() + days)
    const yyyy = base.getFullYear()
    const mm = String(base.getMonth() + 1).padStart(2, '0')
    const dd = String(base.getDate()).padStart(2, '0')
    setDateInput(`${yyyy}-${mm}-${dd}`)
  }

  const handleResetToNov3 = () => {
    setDateInput('2026-11-03')
    setTimeInput('23:59:59')
    setIsEnabledState(true)
  }

  const handleGrantOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return

    setGrantingOverride(true)
    try {
      const student = students.find((s) => s.id === selectedStudentId)
      const allowedUntilISO = `${overrideDateInput}T${overrideTimeInput}+05:30`

      const { data, error } = await deadlineService.grantOverride({
        studentId: selectedStudentId,
        rollNumber: student?.roll_number || 'Unknown',
        studentName: student?.name || 'Unknown Student',
        section: selectedSection,
        allowedUntilISO,
        reason: overrideReason.trim() || 'Faculty authorized individual deadline extension',
      })

      if (data) {
        setOverrides((prev) => [data, ...prev])
        setIsOverrideModalOpen(false)
        setSelectedStudentId('')
        setOverrideReason('')
        setFeedback(`Individual extension granted for ${student?.name} (${student?.roll_number}).`)
      } else {
        setFeedback('Failed to grant override: ' + (error?.message || 'Unknown error'))
      }
      setTimeout(() => setFeedback(null), 4000)
    } finally {
      setGrantingOverride(false)
    }
  }

  const handleRevokeOverride = async (overrideId: string) => {
    if (!confirm('Are you sure you want to revoke this student extension? Profile editing will lock immediately.')) {
      return
    }
    await deadlineService.revokeOverride(overrideId)
    setOverrides((prev) => prev.filter((o) => o.id !== overrideId))
    setFeedback('Extension revoked successfully.')
    setTimeout(() => setFeedback(null), 3000)
  }

  const isExpired = settings ? new Date() > new Date(settings.deadline) : false
  const isEnabled = settings ? settings.is_enabled : isEnabledState
  const editingMode: 'open' | 'locked_manual' | 'locked_expired' = !isEnabled
    ? 'locked_manual'
    : isExpired
    ? 'locked_expired'
    : 'open'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-purple-700" />
            Profile Editing Deadline & Override Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage global onboarding deadlines, extend submission dates for all students, and grant individual overrides.
          </p>
        </div>

        <Button
          onClick={() => setIsOverrideModalOpen(true)}
          size="sm"
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Grant Student Extension
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Global Status Banner Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  Enforced by PostgreSQL Trigger
                </span>
                <Badge
                  variant={editingMode === 'open' ? 'approved' : 'critical'}
                  className={
                    editingMode === 'open'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : editingMode === 'locked_manual'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }
                >
                  {editingMode === 'open'
                    ? 'Editing Status: OPEN (Deadline-Based)'
                    : editingMode === 'locked_manual'
                    ? 'Editing Status: LOCKED (Closed by Administrator)'
                    : 'Editing Status: LOCKED (Deadline Expired)'}
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {settings?.formatted_ist || 'Tuesday, November 3, 2026 at 11:59:59 PM IST'}
              </h2>
              <p className="text-xs text-slate-600">
                Timezone: <strong className="text-slate-800">Asia/Kolkata (IST UTC+05:30)</strong> • Key:{' '}
                <code className="text-purple-700 font-mono text-[11px]">
                  system_settings.profile_edit_deadline
                </code>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {editingMode === 'open' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                  <Unlock className="h-4 w-4 text-emerald-600" />
                  <span>Students can edit Sections B–G</span>
                </div>
              ) : editingMode === 'locked_manual' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                  <Lock className="h-4 w-4 text-rose-600" />
                  <span>Manually locked by admin</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span>Expired (Individual overrides active)</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Global Settings Control & Quick Extension Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Global Deadline Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-700" />
                Change or Extend Global Deadline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSaveGlobalDeadline} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deadline Date (IST) *
                    </label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      required
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deadline Time (IST) *
                    </label>
                    <input
                      type="text"
                      placeholder="23:59:59"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      required
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Controlled Toggle */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Enable Student Profile Editing
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When turned off, student profile editing is immediately locked regardless of deadline date.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabledState}
                      onChange={(e) => setIsEnabledState(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700" />
                  </label>
                </div>

                {/* 3 Explicit States Explanation Reference */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2 text-xs">
                  <span className="font-bold text-purple-950 block">Database Enforcement Modes:</span>
                  <div className="space-y-1.5 text-[11px] text-slate-700">
                    <p>
                      <strong className="text-slate-900">• Editing Open:</strong> When toggle is ON and the current time is before the deadline, students can edit Sections B–G.
                    </p>
                    <p>
                      <strong className="text-slate-900">• Editing Locked:</strong> When toggle is OFF, profile modifications are rejected immediately by PostgreSQL triggers, regardless of date.
                    </p>
                    <p>
                      <strong className="text-slate-900">• Deadline-Based Editing:</strong> When toggle is ON, the trigger verifies <code className="font-mono text-purple-800">now() &lt;= deadline</code>. Once expired, editing automatically locks unless an individual extension exists.
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Quick Extension Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickExtend(7)}
                      className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      +7 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickExtend(14)}
                      className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      +14 Days
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToNov3}
                      className="text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Reset to Nov 3 Standard
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={savingGlobal}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5"
                  >
                    {savingGlobal ? 'Enforcing in Supabase...' : 'Enforce Global Deadline'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Security & Enforcement Details */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-indigo-100 bg-indigo-50/20">
            <CardHeader className="pb-3 border-b border-indigo-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950">
                <ShieldCheck className="h-4 w-4 text-indigo-700" />
                Backend Security & Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="space-y-1">
                <p className="font-bold text-slate-800">1. PostgreSQL Trigger Enforcement</p>
                <p className="text-[11px] leading-relaxed">
                  Deadline checks run on <code className="font-mono text-indigo-800">BEFORE UPDATE / INSERT / DELETE</code> across all student profile tables in Supabase.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-800">2. Administrator Exemption</p>
                <p className="text-[11px] leading-relaxed">
                  Faculty mentors with the <code className="font-mono text-indigo-800">admin</code> role can always edit or update student profiles, even after the deadline has expired.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-800">3. Granular Section Extensions</p>
                <p className="text-[11px] leading-relaxed">
                  Individual overrides can unlock all sections or target specific tables (such as allowing photograph re-uploads or family detail corrections).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Overrides Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-700" />
              <span>Active & Historical Student Overrides ({overrides.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Individual extensions granted to specific students past the global deadline.
            </p>
          </div>
        </div>

        {overrides.length === 0 ? (
          <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Clock className="h-8 w-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Individual Extensions Active</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All students are currently governed by the global November 3 deadline. Use "Grant Student Extension" above to authorize individual mentees.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {overrides.map((ovr) => {
              const ovrExpired = new Date() > new Date(ovr.allowedUntil)
              return (
                <Card
                  key={ovr.id}
                  className={`p-4 bg-white border ${
                    ovrExpired ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-purple-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{ovr.studentName}</span>
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                          {ovr.rollNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          Section: {ovr.section.toUpperCase()}
                        </Badge>
                        <Badge variant={ovrExpired ? 'critical' : 'approved'}>
                          {ovrExpired ? 'EXPIRED' : 'ACTIVE EXTENSION'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600">
                        Reason: <span className="font-medium text-slate-800">{ovr.reason}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Allowed Until: <strong className="text-purple-950 font-semibold">{ovr.allowedUntil}</strong>
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeOverride(ovr.id)}
                      className="text-xs text-rose-600 hover:bg-rose-50 h-8 self-end sm:self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Revoke Extension
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Grant Override Dialog Modal */}
      <Dialog
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        maxWidth="lg"
        title="Grant Individual Student Extension"
        description="Authorize a specific mentee to edit profile sections past the global deadline."
      >
        <form onSubmit={handleGrantOverride} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Mentee *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
            >
              <option value="">-- Choose student from verified roster --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll_number} — {s.name} ({s.department || 'CSE-DS'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Section *
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
              >
                <option value="all">All Sections (B through G)</option>
                <option value="personal">Section B: Personal Details</option>
                <option value="family">Section C: Family Details</option>
                <option value="education">Section D: Education & Ranks</option>
                <option value="skills">Section F: Skills & Aspirations</option>
                <option value="achievements">Section G: Achievements</option>
                <option value="photo">Profile Photograph (Avatar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Extension Valid Until (Date) *
              </label>
              <input
                type="date"
                value={overrideDateInput}
                onChange={(e) => setOverrideDateInput(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Extension Valid Until (Time IST) *
            </label>
            <input
              type="text"
              value={overrideTimeInput}
              onChange={(e) => setOverrideTimeInput(e.target.value)}
              required
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Administrative Extension *
            </label>
            <input
              type="text"
              placeholder="e.g. Medical leave, delayed diploma mark sheet, official correction"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              required
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={grantingOverride}
              className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs px-4"
            >
              {grantingOverride ? 'Granting...' : 'Grant Extension'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
