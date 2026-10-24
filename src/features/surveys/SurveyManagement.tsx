import * as React from 'react'
import {
  ClipboardList,
  Plus,
  Sparkles,
  BarChart,
  Users,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Dialog } from '@/components/ui/dialog'
import { MOCK_SURVEYS } from '@/data/mock'

export const SurveyManagement: React.FC = () => {
  const [surveys] = React.useState(MOCK_SURVEYS)
  const [builderOpen, setBuilderOpen] = React.useState(false)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-700" />
            Forms & Surveys Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer departmental check-ins, elective polling and laboratory feedback.
          </p>
        </div>

        <Button
          variant="pastel-lavender"
          size="sm"
          onClick={() => setBuilderOpen(true)}
          className="text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5 mr-1 text-purple-700" />
          Create New Form (Builder Preview)
        </Button>
      </div>

      <DemoNotice
        variant="inline"
        message="Interface Shell. In Stage 2, form responses will compile into exportable datasets (Excel, CSV, PDF) without third-party form dependencies."
      />

      <div className="grid gap-4">
        {surveys.map((srv) => (
          <Card key={srv.id} className="p-5 border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{srv.title}</h3>
                  <Badge variant={srv.status === 'Active' ? 'good' : 'locked'}>
                    {srv.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target: <strong className="text-slate-700">{srv.targetCohort}</strong> • Deadline: {srv.deadline}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  {srv.responseCount}/{srv.totalEligible} Responded (
                  {Math.round((srv.responseCount / srv.totalEligible) * 100)}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>{srv.questionsCount} Configured Survey Questions</span>
              <button
                type="button"
                className="text-purple-700 font-semibold hover:underline"
                onClick={() => setBuilderOpen(true)}
              >
                Inspect Questions & Responses
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Form Builder Modal Preview */}
      <Dialog
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Custom Form Builder Preview"
        description="Configure titles, typed and multiple-choice questions, and target student cohorts."
        maxWidth="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Form Title</label>
            <input
              type="text"
              defaultValue="Semester 2-1 Mid-Term Mentoring Check-in"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Cohort</label>
            <select className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none bg-white">
              <option>All 38 CSE-DS 2nd Year Mentees</option>
              <option>Section A Mentees Only</option>
              <option>Section B Mentees Only</option>
              <option>Students with Attendance Warning Only</option>
            </select>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
            <span className="font-bold text-purple-950 block">Question 1 (Multiple Choice Preview):</span>
            <p className="text-purple-800">“How satisfied are you with the DBMS Lab practical timings?”</p>
            <div className="space-y-1 pl-2 text-slate-600">
              <div>○ Very Satisfied</div>
              <div>○ Adequate</div>
              <div>○ Need Additional Lab Practice Sessions</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setBuilderOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setBuilderOpen(false)}>
              Save Form Draft (Preview)
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
