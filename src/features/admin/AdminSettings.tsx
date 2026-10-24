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
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'

export const AdminSettings: React.FC = () => {
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

      <DemoNotice
        variant="inline"
        message="Stage 1 Settings Console. Preferences are demonstrated in local memory."
      />

      {savedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Cohort thresholds updated in local memory.</span>
        </div>
      )}

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
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cohort Size</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">38 Engineering Students</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm" className="bg-purple-700 hover:bg-purple-800 text-xs">
            Save Threshold Configurations (Demo)
          </Button>
        </div>
      </form>
    </div>
  )
}
