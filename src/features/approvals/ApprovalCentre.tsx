import * as React from 'react'
import {
  CheckSquare,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Loader2,
  MessageSquare,
  ShieldCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { INITIAL_APPROVALS } from '@/data/mock'
import type { ApprovalItem } from '@/types'
import { approvalService, type SubmissionWithStudent } from '@/services/approvalService'
import { useAuth } from '@/app/providers/AuthContext'

export const ApprovalCentre: React.FC = () => {
  const { isConfigured, isDemo } = useAuth()
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(INITIAL_APPROVALS)
  const [dbSubmissions, setDbSubmissions] = React.useState<SubmissionWithStudent[]>([])
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [activeFilter, setActiveFilter] = React.useState<'All' | 'Pending' | 'Approved' | 'Changes Requested'>('All')
  const [loading, setLoading] = React.useState<boolean>(false)

  // Remarks modal
  const [reviewDialog, setReviewDialog] = React.useState<{
    isOpen: boolean
    submissionId: string
    action: 'approve' | 'request_corrections' | 'reject'
    studentName: string
    remarks: string
  }>({
    isOpen: false,
    submissionId: '',
    action: 'approve',
    studentName: '',
    remarks: ''
  })
  const [submittingAction, setSubmittingAction] = React.useState(false)

  const loadSubmissions = React.useCallback(async () => {
    if (!isConfigured || isDemo) return
    setLoading(true)
    try {
      const data = await approvalService.getAllSubmissions(activeFilter === 'Changes Requested' ? 'Corrections_Requested' : activeFilter)
      setDbSubmissions(data)
    } finally {
      setLoading(false)
    }
  }, [isConfigured, isDemo, activeFilter])

  React.useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const openReviewModal = (submissionId: string, action: 'approve' | 'request_corrections' | 'reject', studentName: string) => {
    setReviewDialog({
      isOpen: true,
      submissionId,
      action,
      studentName,
      remarks: action === 'approve' ? 'Verified against documentary records.' : ''
    })
  }

  const handleConfirmReview = async () => {
    const { submissionId, action, remarks } = reviewDialog
    setSubmittingAction(true)

    try {
      if (isConfigured && !isDemo) {
        const res = await approvalService.reviewSubmission(submissionId, action, remarks)
        if (res.success) {
          setStatusMessage(`Transaction Committed: Submission successfully marked as "${action}" in PostgreSQL.`)
          await loadSubmissions()
        } else {
          setStatusMessage(`RPC Error: ${(res.error as any)?.message || 'Failed to update submission'}`)
        }
      } else {
        // Fallback demo state update
        const mappedStatus = action === 'approve' ? 'Approved' : action === 'request_corrections' ? 'Changes Requested' : 'Rejected'
        setApprovals((prev) =>
          prev.map((item) => (item.id === submissionId ? { ...item, status: mappedStatus, adminComments: remarks } : item))
        )
        setStatusMessage(`Demo updated in browser memory for submission ${submissionId}`)
      }
    } finally {
      setSubmittingAction(false)
      setReviewDialog(prev => ({ ...prev, isOpen: false }))
      setTimeout(() => setStatusMessage(null), 6000)
    }
  }

  // Active items to display: strictly dbSubmissions (if configured) or mock
  const displayItems: ApprovalItem[] = React.useMemo(() => {
    if (isConfigured && !isDemo) {
      return dbSubmissions.map(sub => {
        const student = sub.student
        return {
          id: sub.id,
          studentName: student?.name || 'CSE-DS Student',
          studentRollNumber: student?.roll_number || '23L31A54XX',
          sectionName: sub.section.toUpperCase(),
          submissionDate: new Date(sub.created_at).toLocaleDateString(),
          status: (sub.status === 'Corrections_Requested' ? 'Changes Requested' : sub.status) as any,
          oldValues: sub.current_snapshot || { Status: 'Original records' },
          proposedValues: sub.proposed_changes || {},
          adminComments: sub.mentor_remarks || undefined
        }
      })
    }

    return approvals.filter((item) => {
      if (activeFilter === 'All') return true
      return item.status === activeFilter
    })
  }, [isConfigured, isDemo, dbSubmissions, approvals, activeFilter])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-700" />
            Institutional Approval Centre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrative review for institutional record updates and exception overrides.
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

      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">Direct Student Profile Management Active:</span> Self-reported student information (personal details, address, family, education, skills, and achievements) is now directly maintained by students under <em>"Student-Provided"</em> classification without generating approval tickets. This Approval Centre is dedicated to official institutional changes and historical audits.
        </div>
      </div>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demo mode only. Approval actions update component state in browser memory."
        />
      )}

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="h-4 w-4 text-purple-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8 gap-2 text-xs text-purple-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading verified submission queue from PostgreSQL...</span>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        {displayItems.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No submissions found under the "{activeFilter}" filter. When students submit updates from the onboarding workflow, they will appear here for faculty verification.
          </div>
        )}

        {displayItems.map((item) => (
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
                  Previously Approved Snapshot
                </span>
                <div className="space-y-1.5">
                  {Object.entries(item.oldValues).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">{key}:</span>
                      <span className="font-medium text-slate-800 text-right">{String(val)}</span>
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
                      <span className="font-bold text-purple-950 text-right">{String(val)}</span>
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
                onClick={() => openReviewModal(item.id, 'approve', item.studentName)}
                disabled={item.status === 'Approved'}
                className="text-xs"
              >
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                Approve Changes
              </Button>

              <Button
                variant="pastel-lavender"
                size="sm"
                onClick={() => openReviewModal(item.id, 'request_corrections', item.studentName)}
                disabled={item.status === 'Changes Requested'}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1 text-purple-700" />
                Request Corrections
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => openReviewModal(item.id, 'reject', item.studentName)}
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

      {/* Review Dialog */}
      <Dialog
        isOpen={reviewDialog.isOpen}
        onClose={() => setReviewDialog(prev => ({ ...prev, isOpen: false }))}
        title={
          reviewDialog.action === 'approve'
            ? `Approve Profile Submission — ${reviewDialog.studentName}`
            : reviewDialog.action === 'request_corrections'
            ? `Request Corrections — ${reviewDialog.studentName}`
            : `Reject Submission — ${reviewDialog.studentName}`
        }
        description="This action executes a single transactional RPC in Supabase PostgreSQL."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-purple-700" />
              <span>Mentor Remarks / Verification Note</span>
            </label>
            <textarea
              rows={3}
              value={reviewDialog.remarks}
              onChange={(e) => setReviewDialog(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Verified against submitted address proof certificate..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReviewDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={reviewDialog.action === 'approve' ? 'pastel-mint' : reviewDialog.action === 'reject' ? 'destructive' : 'primary'}
              size="sm"
              disabled={submittingAction}
              onClick={handleConfirmReview}
            >
              {submittingAction ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                `Confirm ${reviewDialog.action.replace('_', ' ')}`
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
