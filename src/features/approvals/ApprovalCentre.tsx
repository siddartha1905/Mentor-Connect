import * as React from 'react'
import {
  CheckSquare,
  Check,
  X,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  History,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { INITIAL_APPROVALS } from '@/data/mock'
import type { ApprovalItem } from '@/types'

export const ApprovalCentre: React.FC = () => {
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(INITIAL_APPROVALS)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [activeFilter, setActiveFilter] = React.useState<'All' | 'Pending' | 'Approved' | 'Changes Requested'>('All')

  const handleUpdateStatus = (
    id: string,
    newStatus: 'Approved' | 'Changes Requested' | 'Rejected'
  ) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
    setStatusMessage(
      `Demo Staged: Submission ${id} marked as "${newStatus}" in local memory. Backend database write will be enabled in Stage 2.`
    )
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const filteredApprovals = approvals.filter((item) => {
    if (activeFilter === 'All') return true
    return item.status === activeFilter
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-700" />
            Profile Approval Centre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Section-wise verification for student personal, address, and academic updates.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          {(['All', 'Pending', 'Approved', 'Changes Requested'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeFilter === filter
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <DemoNotice
        variant="inline"
        message="Demo mode only. Approval actions update component state in browser memory without database persistence."
      />

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="h-4 w-4 text-purple-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.map((item) => (
          <Card key={item.id} className="p-5 border-slate-200/90 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{item.studentName}</span>
                  <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {item.studentRollNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Section Modified: <strong className="text-slate-800">{item.sectionName}</strong> • Submitted {item.submissionDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    item.status === 'Approved'
                      ? 'approved'
                      : item.status === 'Pending'
                      ? 'pending'
                      : item.status === 'Changes Requested'
                      ? 'changes'
                      : 'rejected'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            </div>

            {/* Side-by-Side Diff Comparison */}
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              {/* Old Values */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
                  Previously Approved Values
                </span>
                <div className="space-y-1.5">
                  {Object.entries(item.oldValues).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">{key}:</span>
                      <span className="font-medium text-slate-800 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Values */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <span className="font-bold text-purple-900 uppercase text-[10px] tracking-wider block">
                  Proposed New Values (Pending Verification)
                </span>
                <div className="space-y-1.5">
                  {Object.entries(item.proposedValues).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-purple-200/60 pb-1">
                      <span className="text-purple-700 font-semibold">{key}:</span>
                      <span className="font-bold text-purple-950 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin Comments */}
            {item.adminComments && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900">
                <span className="font-bold">Faculty Review Note: </span>
                <span>{item.adminComments}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
              <Button
                variant="pastel-mint"
                size="sm"
                onClick={() => handleUpdateStatus(item.id, 'Approved')}
                disabled={item.status === 'Approved'}
                className="text-xs"
              >
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Approve (Demo)
              </Button>

              <Button
                variant="pastel-lavender"
                size="sm"
                onClick={() => handleUpdateStatus(item.id, 'Changes Requested')}
                disabled={item.status === 'Changes Requested'}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1 text-purple-700" />
                Request Corrections
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUpdateStatus(item.id, 'Rejected')}
                disabled={item.status === 'Rejected'}
                className="text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
