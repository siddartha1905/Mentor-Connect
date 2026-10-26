import * as React from 'react'
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  AlertTriangle,
  Lightbulb,
  Edit2,
  Trash2,
  ChevronRight,
  Sparkles,
  Shield,
  ArrowRight,
  Tag,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  roadmapService,
  type RoadmapItem,
  type RoadmapCategory,
  type RoadmapPriority,
} from '@/services/roadmapService'

const CATEGORY_CONFIG: Record<
  RoadmapCategory,
  { label: string; badgeVariant: 'approved' | 'pending' | 'critical' | 'low' | 'high'; bg: string; border: string; text: string }
> = {
  completed: {
    label: 'Completed & Verified',
    badgeVariant: 'approved',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
  },
  in_progress: {
    label: 'In Progress',
    badgeVariant: 'low',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-950',
  },
  pending: {
    label: 'Pending Improvements',
    badgeVariant: 'pending',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
  },
  deferred: {
    label: 'Deferred / Future',
    badgeVariant: 'pending',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    text: 'text-amber-950',
  },
  removed: {
    label: 'Removed Features',
    badgeVariant: 'critical',
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    text: 'text-rose-950',
  },
  idea: {
    label: 'Notes & Ideas',
    badgeVariant: 'low',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-900',
  },
}

export const DevelopmentRoadmap: React.FC = () => {
  const [items, setItems] = React.useState<RoadmapItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dbStatus, setDbStatus] = React.useState<{
    connected: boolean
    tableExists: boolean
    isSecuredByRls?: boolean
    error?: string
  }>({
    connected: false,
    tableExists: false,
  })
  const [activeCategory, setActiveCategory] = React.useState<RoadmapCategory | 'all'>('all')
  const [moduleFilter, setModuleFilter] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null)

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formTitle, setFormTitle] = React.useState('')
  const [formDesc, setFormDesc] = React.useState('')
  const [formModule, setFormModule] = React.useState<RoadmapItem['moduleLocation']>('Student Portal')
  const [formCategory, setFormCategory] = React.useState<RoadmapCategory>('pending')
  const [formPriority, setFormPriority] = React.useState<RoadmapPriority>('medium')
  const [formReason, setFormReason] = React.useState('')
  const [formNotes, setFormNotes] = React.useState('')
  const [formTags, setFormTags] = React.useState('')
  const [savingItem, setSavingItem] = React.useState(false)

  // Backup Import Modal State
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [importJsonText, setImportJsonText] = React.useState('')
  const [importingBackup, setImportingBackup] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const [res, status] = await Promise.all([
        roadmapService.getAllItems(),
        roadmapService.checkDatabaseStatus(),
      ])
      setItems(res.items)
      setDbStatus(status)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleExportBackup = () => {
    try {
      const jsonStr = roadmapService.exportLocalBackup()
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mentor_connect_roadmap_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setFeedback('Development roadmap backup exported successfully.')
      setTimeout(() => setFeedback(null), 4000)
    } catch {
      setFeedbackError('Failed to generate export file.')
    }
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const content = ev.target?.result as string
      if (!content) return
      setImportingBackup(true)
      try {
        const res = await roadmapService.importLocalBackup(content)
        if (res.success) {
          setFeedback(`Backup imported: ${res.importedCount} new roadmap entries loaded.`)
          await loadItems()
          setIsImportOpen(false)
          setImportJsonText('')
        } else {
          setFeedbackError(res.error || 'Failed to import backup.')
        }
      } finally {
        setImportingBackup(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setTimeout(() => {
          setFeedback(null)
          setFeedbackError(null)
        }, 5000)
      }
    }
    reader.readAsText(file)
  }

  const handleTextImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importJsonText.trim()) return
    setImportingBackup(true)
    try {
      const res = await roadmapService.importLocalBackup(importJsonText.trim())
      if (res.success) {
        setFeedback(`Backup imported: ${res.importedCount} new entries loaded.`)
        await loadItems()
        setIsImportOpen(false)
        setImportJsonText('')
      } else {
        setFeedbackError(res.error || 'Failed to parse JSON backup.')
      }
    } finally {
      setImportingBackup(false)
      setTimeout(() => {
        setFeedback(null)
        setFeedbackError(null)
      }, 5000)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormTitle('')
    setFormDesc('')
    setFormModule('Student Portal')
    setFormCategory('pending')
    setFormPriority('medium')
    setFormReason('')
    setFormNotes('')
    setFormTags('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: RoadmapItem) => {
    setEditingId(item.id)
    setFormTitle(item.title)
    setFormDesc(item.description)
    setFormModule(item.moduleLocation)
    setFormCategory(item.category)
    setFormPriority(item.priority)
    setFormReason(item.reasonRemovedOrDeferred || '')
    setFormNotes(item.notes || '')
    setFormTags(item.tags?.join(', ') || '')
    setIsModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDesc.trim()) return

    setSavingItem(true)
    setFeedback(null)
    setFeedbackError(null)
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)

      if (editingId) {
        const result = await roadmapService.updateItem(editingId, {
          title: formTitle.trim(),
          description: formDesc.trim(),
          moduleLocation: formModule,
          category: formCategory,
          priority: formPriority,
          reasonRemovedOrDeferred: formReason.trim() || undefined,
          notes: formNotes.trim() || undefined,
          tags: tagsArray,
        })
        if (result.data) {
          setItems((prev) => prev.map((it) => (it.id === editingId ? result.data! : it)))
          if (result.persistedToSupabase) {
            setFeedback('Roadmap entry updated in Supabase database.')
          } else {
            setFeedbackError(
              result.error ||
                'Saved to local storage only. Pending Supabase migration 20261025140000.'
            )
          }
        }
      } else {
        const result = await roadmapService.addItem({
          title: formTitle.trim(),
          description: formDesc.trim(),
          moduleLocation: formModule,
          category: formCategory,
          priority: formPriority,
          reasonRemovedOrDeferred: formReason.trim() || undefined,
          notes: formNotes.trim() || undefined,
          tags: tagsArray,
        })
        if (result.data) {
          setItems((prev) => [result.data!, ...prev])
          if (result.persistedToSupabase) {
            setFeedback('New roadmap entry recorded in Supabase database.')
          } else {
            setFeedbackError(
              result.error ||
                'Saved to local storage only. Pending Supabase migration 20261025140000.'
            )
          }
        }
      }

      setIsModalOpen(false)
      setTimeout(() => {
        setFeedback(null)
        setFeedbackError(null)
      }, 5000)
    } finally {
      setSavingItem(false)
    }
  }

  const handleQuickCategoryChange = async (id: string, newCategory: RoadmapCategory) => {
    setFeedback(null)
    setFeedbackError(null)
    const result = await roadmapService.updateItem(id, { category: newCategory })
    if (result.data) {
      setItems((prev) => prev.map((it) => (it.id === id ? result.data! : it)))
      if (result.persistedToSupabase) {
        setFeedback(`Moved to ${CATEGORY_CONFIG[newCategory].label} in Supabase.`)
      } else {
        setFeedbackError(
          `Moved to ${CATEGORY_CONFIG[newCategory].label} (local storage only, migration 20261025140000 pending).`
        )
      }
      setTimeout(() => {
        setFeedback(null)
        setFeedbackError(null)
      }, 5000)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap entry?')) return
    const result = await roadmapService.deleteItem(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (result.persistedToSupabase) {
      setFeedback('Roadmap entry deleted from Supabase database.')
    } else {
      setFeedbackError('Roadmap entry removed from local storage (migration pending).')
    }
    setTimeout(() => {
      setFeedback(null)
      setFeedbackError(null)
    }, 4000)
  }

  // Filtered Items
  const filteredItems = React.useMemo(() => {
    return items.filter((it) => {
      if (activeCategory !== 'all' && it.category !== activeCategory) return false
      if (moduleFilter !== 'all' && it.moduleLocation !== moduleFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = it.title.toLowerCase().includes(q)
        const matchDesc = it.description.toLowerCase().includes(q)
        const matchNotes = it.notes?.toLowerCase().includes(q)
        const matchReason = it.reasonRemovedOrDeferred?.toLowerCase().includes(q)
        const matchTags = it.tags?.some((t) => t.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchNotes && !matchReason && !matchTags) return false
      }
      return true
    })
  }, [items, activeCategory, moduleFilter, searchQuery])

  // Counts by category
  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: items.length }
    items.forEach((it) => {
      map[it.category] = (map[it.category] || 0) + 1
    })
    return map
  }, [items])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
              Administrator Console
            </span>
            {dbStatus.tableExists ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Source of Truth: Supabase
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                SQL Migration 20261025140000 Pending Review
              </span>
            )}
            {dbStatus.isSecuredByRls && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3 text-indigo-600" />
                RLS Protected
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-700" />
            Development Roadmap & Feature History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured tracking of completed capabilities, deferred modules, intentional removals, and future improvements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={handleExportBackup}
            size="sm"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
            title="Download full roadmap backup to JSON file"
          >
            <Download className="h-4 w-4 mr-1.5 text-slate-500" />
            Export Backup
          </Button>

          <Button
            onClick={() => setIsImportOpen(true)}
            size="sm"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
            title="Import roadmap entries from JSON file"
          >
            <Upload className="h-4 w-4 mr-1.5 text-slate-500" />
            Import Backup
          </Button>

          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Feature / Note
          </Button>
        </div>
      </div>

      {/* Migration Pending Notice Banner */}
      {!dbStatus.tableExists && (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Database Migration Pending Execution</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Table <code className="font-mono bg-amber-100/80 px-1 py-0.2 rounded text-amber-900">public.development_roadmap</code> has not been executed in the remote Supabase database yet. The initial feature dataset and any edits you perform are retained in local memory until <code className="font-mono bg-amber-100/80 px-1 py-0.2 rounded text-amber-900">20261025140000_profile_deadline_management_and_roadmap.sql</code> is reviewed and executed.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* Filter and Category Navigation */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Features & History</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'all' ? 'bg-purple-900 text-purple-100' : 'bg-slate-100 text-slate-600'}`}>
              {counts.all || 0}
            </span>
          </button>

          {(Object.keys(CATEGORY_CONFIG) as RoadmapCategory[]).map((cat) => {
            const conf = CATEGORY_CONFIG[cat]
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{conf.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-purple-900 text-purple-100' : 'bg-slate-100 text-slate-600'}`}>
                  {counts[cat] || 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Module Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search features, modules, notes, reasons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-200 bg-white focus:border-purple-600 outline-none shadow-2xs"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:border-purple-600 outline-none font-medium shadow-2xs"
            >
              <option value="all">All Modules</option>
              <option value="Student Portal">Student Portal</option>
              <option value="Admin Portal">Admin Portal</option>
              <option value="Landing Page">Landing Page</option>
              <option value="Database & Security">Database & Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roadmap Items List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-xs text-slate-400">Loading roadmap workspace...</Card>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Layers className="h-8 w-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Matching Roadmap Entries</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or category filter above, or click "Add Feature / Note" to create a new entry.
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const catConf = CATEGORY_CONFIG[item.category]
            return (
              <Card
                key={item.id}
                className={`p-5 bg-white border border-slate-200/90 shadow-2xs hover:border-purple-200 transition-all space-y-3.5`}
              >
                {/* Header Row: Badges & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catConf.bg} ${catConf.border} ${catConf.text}`}
                    >
                      {catConf.label}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      Module: {item.moduleLocation}
                    </span>

                    <Badge
                      variant={
                        item.priority === 'high'
                          ? 'high'
                          : item.priority === 'medium'
                          ? 'pending'
                          : 'low'
                      }
                      className="text-[10px]"
                    >
                      {item.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>

                  {/* Actions & Quick Category Switcher */}
                  <div className="flex items-center gap-2">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        handleQuickCategoryChange(item.id, e.target.value as RoadmapCategory)
                      }
                      className="h-7 px-2 text-[11px] rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none hover:bg-white"
                      title="Quickly change feature status"
                    >
                      <option value="completed">Completed & Verified</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending">Pending Improvements</option>
                      <option value="deferred">Deferred / Future</option>
                      <option value="removed">Removed Features</option>
                      <option value="idea">Notes & Ideas</option>
                    </select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-7 px-2 text-purple-700 hover:bg-purple-50 text-xs"
                      title="Edit entry"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-7 px-2 text-rose-600 hover:bg-rose-50 text-xs"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Reason Removed or Deferred Box */}
                {item.reasonRemovedOrDeferred && (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-0.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-amber-900 block">
                      Rationale for Removal / Deferral
                    </span>
                    <p className="leading-relaxed">{item.reasonRemovedOrDeferred}</p>
                  </div>
                )}

                {/* Notes & Tags Footer */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
                  <div className="space-y-0.5">
                    {item.notes && (
                      <p className="text-[11px] text-slate-600">
                        <strong className="text-slate-800">Faculty Notes:</strong> {item.notes}
                      </p>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 self-start sm:self-auto">
                      {item.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Add / Edit Roadmap Item Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="xl"
        title={editingId ? 'Edit Roadmap Feature' : 'Add Feature / Note'}
        description="Record and organize planned capabilities, deferred modules, or completed enhancements."
      >
        <form onSubmit={handleSaveItem} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feature Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Biometric Attendance CSV Sync"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Module Location *
              </label>
              <select
                value={formModule}
                onChange={(e) => setFormModule(e.target.value as any)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
              >
                <option value="Student Portal">Student Portal</option>
                <option value="Admin Portal">Admin Portal</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Database & Security">Database & Security</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roadmap Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as RoadmapCategory)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
              >
                <option value="completed">Completed & Verified</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending Improvements</option>
                <option value="deferred">Deferred / Future</option>
                <option value="removed">Removed Features</option>
                <option value="idea">Notes & Ideas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority *
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as RoadmapPriority)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of what the feature does or why it is needed..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              required
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason Removed or Deferred (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Hidden until real student onboarding; awaiting exam branch grades"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Notes / Technical Details (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Preserved in src/features/student/StudentCheckIn.tsx"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. hidden-from-nav, verified, exam-branch"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingItem}
              className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs px-4"
            >
              {savingItem ? 'Saving...' : editingId ? 'Update Feature' : 'Add to Roadmap'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Backup Import Dialog */}
      <Dialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Roadmap Entries from Backup"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Restore previously exported roadmap entries from a JSON backup. Missing items will be safely added without overwriting or duplicating existing records.
          </p>

          <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:bg-purple-50/40 hover:border-purple-300 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
              id="roadmap-file-input"
            />
            <label
              htmlFor="roadmap-file-input"
              className="cursor-pointer flex flex-col items-center gap-1.5"
            >
              <Upload className="h-6 w-6 text-purple-700" />
              <span className="text-xs font-bold text-purple-900">Choose Backup JSON File</span>
              <span className="text-[10px] text-slate-500">mentor_connect_roadmap_backup_*.json</span>
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or Paste JSON Content
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleTextImportSubmit} className="space-y-3">
            <textarea
              rows={4}
              placeholder='Paste JSON array of items or full export payload here...'
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsImportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={importingBackup || !importJsonText.trim()}
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs px-4"
              >
                {importingBackup ? 'Importing...' : 'Parse & Import'}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
