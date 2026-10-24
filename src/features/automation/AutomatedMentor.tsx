import * as React from 'react'
import {
  Sparkles,
  Clock,
  Calendar,
  Plus,
  Send,
  Power,
  PowerOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_SCHEDULES } from '@/data/mock'
import type { AutomatedScheduleRule } from '@/types'

export const AutomatedMentor: React.FC = () => {
  const [schedules, setSchedules] = React.useState<AutomatedScheduleRule[]>(MOCK_SCHEDULES)
  const [toggleNotice, setToggleNotice] = React.useState<string | null>(null)

  const toggleScheduleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, isActive: !s.isActive }
          setToggleNotice(
            `Rule "${s.title}" set to ${updated.isActive ? 'Active' : 'Disabled'} in preview mode.`
          )
          return updated
        }
        return s
      })
    )
    setTimeout(() => setToggleNotice(null), 4000)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-700" />
            Automated Mentor Scheduler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated cohort check-in triggers, morning wellness prompts, and commitment reminders.
          </p>
        </div>

        <Button variant="pastel-lavender" size="sm" className="text-xs font-bold">
          <Plus className="h-3.5 w-3.5 mr-1 text-purple-700" />
          Create Scheduled Rule (Preview)
        </Button>
      </div>

      {/* Default Check-in Schedule Box */}
      <div className="p-4 rounded-3xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock className="h-4 w-4 text-indigo-700" />
            Default Daily Attendance Check-in Configuration
          </span>
          <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
            10:30 AM IST
          </span>
        </div>
        <p className="text-xs text-indigo-800 leading-relaxed">
          Standard schedule runs Monday through Saturday (excluding configured institutional holidays). Students receive an automated morning pulse prompt to submit their campus attendance and lab concerns.
        </p>
      </div>

      <DemoNotice
        variant="inline"
        message="Non-operational preview. Background chron jobs, external messaging APIs and push notifications will connect in later stages."
      />

      {toggleNotice && (
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-purple-700 shrink-0" />
          <span>{toggleNotice}</span>
        </div>
      )}

      {/* Rules List */}
      <div className="grid gap-4">
        {schedules.map((rule) => (
          <Card key={rule.id} className="p-5 space-y-3 border-slate-200/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>
                  <Badge variant={rule.isActive ? 'good' : 'locked'}>
                    {rule.isActive ? 'Active Schedule' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <strong className="text-slate-700">{rule.category}</strong> • Target: {rule.targetGroup}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                  {rule.scheduleTime} • {rule.frequency}
                </span>
                <button
                  type="button"
                  onClick={() => toggleScheduleActive(rule.id)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                    rule.isActive
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={rule.isActive ? 'Disable Schedule' : 'Enable Schedule'}
                >
                  {rule.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message Template:</span>
              <p className="text-slate-700 italic">“{rule.templateSnippet}”</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
