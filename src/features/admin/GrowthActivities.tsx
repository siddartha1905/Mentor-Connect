import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS } from '@/data/mock'

export const GrowthActivities: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-700" />
          Growth, Skills & Activities Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Student certifications, hackathon entries, technical workshops, and extracurricular milestones.
        </p>
      </div>

      <DemoNotice
        variant="inline"
        message="Stage 1 Interface Shell. In Stage 2, student achievements will integrate with accreditation reports."
      />

      {/* Cohort Highlights */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_STUDENTS.map((s) => (
          <Card key={s.rollNumber} className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{s.fullName}</h4>
                <p className="text-[10px] font-mono text-purple-700">{s.rollNumber}</p>
              </div>
              <Badge variant="low">Sec {s.section}</Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Skills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.desiredTechnicalSkills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-medium border border-purple-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Certifications</span>
                {s.certifications.length > 0 ? (
                  <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                    {s.certifications[0]}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">None logged</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <Link
                to={`/admin/mentor360?roll=${s.rollNumber}`}
                className="text-xs font-bold text-purple-700 hover:underline"
              >
                Inspect Portfolio →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
