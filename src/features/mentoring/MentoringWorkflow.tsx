import * as React from 'react'
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Eye,
  Plus,
  Send,
  UserCheck,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, MOCK_SESSIONS } from '@/data/mock'
import type { SessionOutcome } from '@/types'

export const MentoringWorkflow: React.FC = () => {
  const [selectedStudentRoll, setSelectedStudentRoll] = React.useState('23L31A5403') // Chirag Varma
  const [stage, setStage] = React.useState<'before' | 'during' | 'after'>('before')
  const [sessionOutcome, setSessionOutcome] = React.useState<SessionOutcome>('Follow-up Required')
  const [savedNotice, setSavedNotice] = React.useState(false)

  const student = MOCK_STUDENTS.find((s) => s.rollNumber === selectedStudentRoll) || MOCK_STUDENTS[0]
  const session = MOCK_SESSIONS.find((sess) => sess.studentRollNumber === student.rollNumber) || MOCK_SESSIONS[0]

  const workflowTabs = [
    { id: 'before', label: '1. Before Session (Prep & History)' },
    { id: 'during', label: '2. During Session (Marking & Notes)' },
    { id: 'after', label: '3. After Session (Commitments & Outcome)' },
  ]

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 5000)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-purple-700" />
            Mentoring & Counselling Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct weekly 1-on-1 dialogue, record commitments, and track student outcomes.
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Student:</label>
          <select
            value={selectedStudentRoll}
            onChange={(e) => setSelectedStudentRoll(e.target.value)}
            className="h-9 px-3 rounded-xl border border-purple-200 bg-white text-xs font-bold text-purple-950 outline-none"
          >
            {MOCK_STUDENTS.map((s) => (
              <option key={s.rollNumber} value={s.rollNumber}>
                {s.fullName} ({s.rollNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      <DemoNotice
        variant="inline"
        message="Structured Counselling Cycle: Stage 1 demonstrates the Before, During, and After session workflow."
      />

      {savedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Session staged in memory. In Stage 2, counselling sessions will record to Supabase database.</span>
        </div>
      )}

      {/* Workflow Tabs */}
      <Tabs tabs={workflowTabs} activeTab={stage} onChange={(id) => setStage(id as any)} variant="pills" />

      {/* PHASE 1: BEFORE SESSION */}
      {stage === 'before' && (
        <div className="space-y-4">
          <Card className="border-purple-200 bg-purple-50/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Session Briefing for {student.fullName}</CardTitle>
                <Badge variant="pending">Review Phase</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Previous Session Summary:</span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {session.beforeSession.previousDiscussionSummary}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Pending Commitments from Prior Session:</span>
                <ul className="space-y-1">
                  {session.beforeSession.pendingCommitments.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <span className="font-bold text-purple-900 uppercase text-[10px]">Suggested Inquires for This Session:</span>
                <ul className="space-y-1">
                  {session.beforeSession.suggestedQuestions.map((q, i) => (
                    <li key={i} className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-950 font-medium">
                      “{q}”
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setStage('during')}
                className="w-full text-xs bg-purple-700 hover:bg-purple-800"
              >
                Proceed to Conduct Mentoring Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PHASE 2: DURING SESSION */}
      {stage === 'during' && (
        <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">During Session Recording: {student.fullName}</CardTitle>
                <Badge variant="approved">Session Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Academic Progress & Coursework Difficulties Discussed:
                </label>
                <textarea
                  rows={2}
                  defaultValue={session.duringSession.academicConcerns}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Personal, Commute or Health Concerns:
                </label>
                <textarea
                  rows={2}
                  defaultValue={session.duringSession.personalSupportConcerns}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5 uppercase text-[10px]">
                    <Lock className="h-3.5 w-3.5 text-rose-600" />
                    Confidential Mentor Notes (Private)
                  </span>
                  <textarea
                    rows={3}
                    defaultValue={session.duringSession.confidentialMentorNotes}
                    className="w-full p-2.5 rounded-xl border border-rose-200 bg-white outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5 uppercase text-[10px]">
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    Student-Visible Guidance & Tasks
                  </span>
                  <textarea
                    rows={3}
                    defaultValue={session.duringSession.studentVisibleSuggestions}
                    className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStage('after')}
                className="w-full text-xs bg-purple-700 hover:bg-purple-800"
              >
                Proceed to Action Commitments
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* PHASE 3: AFTER SESSION */}
      {stage === 'after' && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">After Session: Commitments & Resolution</CardTitle>
              <Badge variant="good">Wrap-up Phase</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                Session Outcome Decision:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['No Action', 'Follow-up Required', 'Resolved', 'Referred'] as const).map((outcome) => (
                  <button
                    type="button"
                    key={outcome}
                    onClick={() => setSessionOutcome(outcome)}
                    className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                      sessionOutcome === outcome
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold uppercase text-[10px] text-slate-400">Assigned Action Items:</span>
              <ul className="space-y-1.5">
                {session.afterSession.commitments.map((com) => (
                  <li key={com.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                    <span className="font-semibold text-slate-800">{com.task}</span>
                    <span className="text-[10px] text-slate-400">Due {com.dueDate} • Owner: {com.owner}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStage('during')}>
                Back to Session Notes
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSession}
                className="bg-purple-700 hover:bg-purple-800"
              >
                Save & Conclude Session (Demo)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
