import * as React from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, ExternalLink, Link2, Plus, Sparkles, Folder } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentDocuments: React.FC = () => {
  const { isDemo } = useAuth()
  const [docLinks] = React.useState(isDemo ? [
    {
      title: 'Class 10 & Intermediate Marks Memos (Certified Copy)',
      category: 'Academic Records',
      updatedAt: '12 Oct 2026',
      service: 'Google Drive Link',
      status: 'Verified',
    },
    {
      title: 'DeepLearning.AI Certificate of Completion',
      category: 'Certifications',
      updatedAt: '18 Oct 2026',
      service: 'Coursera Verification Link',
      status: 'Verified',
    },
    {
      title: 'Semester 2-1 Course Notes & Practical Code Repo',
      category: 'Coursework',
      updatedAt: '22 Oct 2026',
      service: 'External Repository Link',
      status: 'Staged',
    },
  ] : [])

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <Badge variant="approved">Read-Only Mode</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          My Documents & External Links
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Google-style external link repository for verified academic certificates and records.
        </p>
      </div>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Document and external resource links repository."
        />
      )}

      {/* Add New Link Card */}
      <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/30 p-4 text-center">
        <div className="max-w-xs mx-auto space-y-2">
          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Link2 className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">Attach Verified Document Link</h4>
          <p className="text-[11px] text-slate-500">
            Link view-only Google Drive, OneDrive, or GitHub repository URLs for mentor review.
          </p>
          <Button size="sm" variant="outline" className="text-xs bg-white">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add External Document Link (Mock)
          </Button>
        </div>
      </Card>

      {/* Document Link List */}
      <div className="space-y-2.5">
        {docLinks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 space-y-1">
            <p className="font-semibold text-slate-600">No Document Links Attached Yet</p>
            <p>You can attach certified external links for certificate review or project code.</p>
          </div>
        ) : (
          docLinks.map((doc, idx) => (
            <Card key={idx} className="p-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 mt-0.5">
                  <Folder className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                  <p className="text-[11px] text-slate-500">{doc.category} • {doc.service}</p>
                  <span className="text-[10px] text-slate-400">Added on {doc.updatedAt}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge variant="good">{doc.status}</Badge>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline pt-1"
                >
                  <span>Open Link</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
