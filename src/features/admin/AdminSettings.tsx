import * as React from 'react'
import {
  Settings,
  Calendar,
  Shield,
  Sliders,
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  UserCheck,
  Phone,
  Mail,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { useAuth } from '@/app/providers/AuthContext'

export const AdminSettings: React.FC = () => {
  const { isDemo } = useAuth()
  const [warningThreshold, setWarningThreshold] = React.useState(80)
  const [criticalThreshold, setCriticalThreshold] = React.useState(75)
  const [savedNotice, setSavedNotice] = React.useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 4000)
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-700" />
          Administration & Cohort Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Academic calendar configuration, attendance thresholds, and faculty mentor assignments.
        </p>
      </div>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Cohort settings configuration."
        />
      )}

      {savedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Cohort thresholds updated in local memory.</span>
        </div>
      )}

      {/* Verified Faculty Mentor Profile Card */}
      <Card className="border-purple-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <UserCheck className="h-4 w-4 text-purple-700" />
              Verified Faculty Mentor Assignment
            </CardTitle>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Official Identity Confirmed
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
            <span className="text-[10px] font-bold text-purple-900 uppercase">Faculty Mentor</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">J. Siddartha Varma</p>
            <p className="text-[11px] text-slate-500">Assistant Professor</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Department</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">CSE (Data Science)</p>
            <p className="text-[11px] text-slate-500">Vignan IIT</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Direct Contact Phone</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">
              <a href="tel:8885259838" className="hover:text-purple-700 hover:underline flex items-center gap-1">
                <Phone className="h-3 w-3 text-purple-700" />
                8885259838
              </a>
            </p>
            <p className="text-[11px] text-slate-400">Available on student portal</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Verified College Email</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">
              <a href="mailto:siddartha@vignaniit.edu.in" className="hover:text-purple-700 hover:underline flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 text-purple-700 shrink-0" />
                siddartha@vignaniit.edu.in
              </a>
            </p>
            <p className="text-[11px] text-slate-400">Official correspondence</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Attendance Thresholds */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-700" />
              Institutional Attendance Policy Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Warning Threshold (%)
              </label>
              <input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-amber-700 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Triggers cautionary counselling alert to mentee.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Critical Threshold (%)
              </label>
              <input
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-rose-700 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Requires official medical condonation / parent intimation.</p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Calendar Specs */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-700" />
              Active Academic Term Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Year</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">2026 – 2027</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current Term</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">II B.Tech I Semester (2-1)</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cohort Status</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">Verified Student Roster</p>
            </div>
          </CardContent>
        </Card>

        {/* Development Roadmap & Deadlines Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-purple-200 bg-purple-50/30 p-4 space-y-2">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-700" />
              Profile Deadlines & Overrides
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Global deadline set to November 3, 2026, 11:59:59 PM IST. Manage extensions and student overrides in the dedicated management view.
            </p>
            <a
              href="/admin/deadlines"
              className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center pt-1"
            >
              Open Profile Deadlines →
            </a>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50/30 p-4 space-y-2">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-700" />
              Development Roadmap Workspace
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Track completed milestones, deferred capabilities, intentional removals, and administrator ideas in the persistent roadmap console.
            </p>
            <a
              href="/admin/roadmap"
              className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center pt-1"
            >
              Open Roadmap Workspace →
            </a>
          </Card>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="sm" className="bg-purple-700 hover:bg-purple-800 text-xs">
            Save Threshold Configurations
          </Button>
        </div>
      </form>
    </div>
  )
}
