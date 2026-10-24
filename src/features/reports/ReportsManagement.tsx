import * as React from 'react'
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Sparkles,
  ChevronRight,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Dialog } from '@/components/ui/dialog'

export const ReportsManagement: React.FC = () => {
  const [selectedReport, setSelectedReport] = React.useState<string | null>(null)

  const reportCards = [
    {
      id: 'rep-1',
      title: 'Monthly Departmental Counselling Report',
      period: 'October 2026',
      desc: 'Summary of 1-on-1 sessions conducted, primary academic concerns noted, and follow-up resolutions.',
      category: 'Institutional Submission',
      status: 'Ready for Review',
    },
    {
      id: 'rep-2',
      title: 'Student Attendance & Discrepancy Register',
      period: 'Semester 2-1 (Cumulative)',
      desc: 'Weekly official biometric attendance percentages with flagged warnings (<80%) and critical shortages (<75%).',
      category: 'Attendance Cell',
      status: 'Updated Weekly',
    },
    {
      id: 'rep-3',
      title: 'Academic Performance & Internal Marks Digest',
      period: 'Mid-1 Assessment (Sem 2-1)',
      desc: 'Subject-wise internal assessments breakdown across WT1–WT4 and Mid evaluations for 38 CSE-DS students.',
      category: 'Exam Cell',
      status: 'Staged',
    },
    {
      id: 'rep-4',
      title: 'Active Backlog & Supplementary Progress Register',
      period: 'October 2026',
      desc: 'Detailed log of students with pending backlogs, tutorial attendance, and planned clearing attempts.',
      category: 'Remedial Support',
      status: 'Active Tracking',
    },
    {
      id: 'rep-5',
      title: 'Mentoring Action Commitments & Outcomes Report',
      period: 'Ongoing Term',
      desc: 'Tracking of student commitments, mentor tasks, due dates and resolution statuses.',
      category: 'Mentorship',
      status: '38 Active Files',
    },
    {
      id: 'rep-6',
      title: 'Parent & Guardian Interaction Log',
      period: 'Semester 2-1',
      desc: 'Documentation of telephonic or in-person parent consultations, attendance shortage notices, and acknowledgments.',
      category: 'Welfare & Guardian',
      status: 'Confidential',
    },
    {
      id: 'rep-7',
      title: 'Cohort Technical Activities & Achievements Ledger',
      period: 'Academic Year 2026–2027',
      desc: 'Verified list of workshops attended, certifications earned, hackathons won, and sports participations.',
      category: 'Student Development',
      status: 'Accreditation Ready',
    },
    {
      id: 'rep-8',
      title: 'Individual Student Longitudinal Progress Summary',
      period: 'Semester 1-1 to 2-1',
      desc: 'Single-page comprehensive progress dossiers for institutional mentoring evaluation committee.',
      category: 'Comprehensive 360',
      status: 'On Demand',
    },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-700" />
            Institutional Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured administrative report cards for departmental review and institutional submission.
          </p>
        </div>
      </div>

      <DemoNotice
        variant="inline"
        message="Report Shell Architecture: Standard institutional templates will be supplied in later stages. PDF/Excel generation will connect in Stage 2."
      />

      {/* Reports Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {reportCards.map((rep) => (
          <Card key={rep.id} className="p-5 flex flex-col justify-between hover:border-purple-300 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 text-[10px]">
                  {rep.category}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{rep.period}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{rep.desc}</p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Badge variant="good">{rep.status}</Badge>
              <button
                type="button"
                onClick={() => setSelectedReport(rep.title)}
                className="font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
              >
                <span>Preview Format</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={selectedReport || 'Report Preview'}
        description="Format placeholder for institutional submission."
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-2">
            <span className="font-bold text-slate-900 block">Report Header Spec:</span>
            <p>Vignan Institute of Information Technology (Autonomous)</p>
            <p>Department: Computer Science & Engineering (Data Science)</p>
            <p>Class: II B.Tech I Semester • Faculty Mentor: Dr. K. S. Rao</p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
            Backend integration will be available in a later stage. Official institutional layout guidelines will be imported in Stage 2.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                alert('Backend integration will be available in a later stage.')
              }}
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Preview (Pending Integration)
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
