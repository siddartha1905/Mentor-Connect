import * as React from 'react'
import {
  CalendarCheck2,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, MOCK_ATTENDANCE } from '@/data/mock'

export const StudentCheckIn: React.FC = () => {
  const student = MOCK_STUDENTS[0] // Aarav Sharma
  const attendance = MOCK_ATTENDANCE[student.rollNumber]

  // Form states
  const [presenceStatus, setPresenceStatus] = React.useState<'Present' | 'Absent' | 'Late'>('Present')
  const [reflectionText, setReflectionText] = React.useState('')
  const [difficultyText, setDifficultyText] = React.useState('')
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarCheck2 className="h-6 w-6 text-indigo-600" />
          Daily & Weekly Check-in
        </h1>
        <p className="text-xs text-slate-500">
          Regular morning check-in and weekly reflection for your mentor.
        </p>
      </div>

      {/* Intended Schedule Box */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-600" />
            Standard Check-in Window
          </span>
          <span className="bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full font-mono text-[11px]">
            10:30 AM IST
          </span>
        </div>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Open Monday through Saturday (excluding configured institutional holidays). Submissions help identify commute and coursework challenges early.
        </p>
      </div>

      <DemoNotice
        variant="inline"
        message="Non-operational preview. Stage 1 captures typed inputs in local memory without backend persistence."
      />

      {/* Check-in Form */}
      {submitted ? (
        <Card className="border-emerald-200 bg-emerald-50/40 text-center py-8 px-4 space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-emerald-900 text-lg">Check-in Recorded (Demo Mode)</CardTitle>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Your attendance status (<strong>{presenceStatus}</strong>) and notes have been staged in memory. In Stage 2, this will persist to Supabase PostgreSQL.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false)
              setReflectionText('')
              setDifficultyText('')
            }}
            className="mt-2"
          >
            Submit Another Demo Entry
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Today’s Morning Pulse
              </CardTitle>
              <Badge variant="pending">Today: 25 Oct 2026</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Presence Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  1. Are you present on campus today?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Present', 'Absent', 'Late'] as const).map((status) => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setPresenceStatus(status)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        presenceStatus === status
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  2. Academic & Lab Progress Reflection
                </label>
                <textarea
                  rows={3}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Share a quick line on what topics you covered today or any doubts in DBMS / DSA lab..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Any support needed */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  3. Any personal or transport difficulty to report? (Optional)
                </label>
                <input
                  type="text"
                  value={difficultyText}
                  onChange={(e) => setDifficultyText(e.target.value)}
                  placeholder="e.g. Bus Route 14 traffic delay, fever leave slip to submit..."
                  className="w-full text-xs h-10 rounded-xl border border-slate-200 px-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full text-xs font-semibold">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit Daily Check-in (Mock)
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Check-in History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Past 5 Check-ins (Sample Data)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {attendance.studentReportedCheckIns.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs"
            >
              <div>
                <span className="font-bold text-slate-800">{item.date}</span>
                {item.note && <p className="text-[11px] text-slate-500 italic mt-0.5">{item.note}</p>}
              </div>
              <Badge variant={item.status === 'Present' ? 'good' : item.status === 'Late' ? 'warning' : 'rejected'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
