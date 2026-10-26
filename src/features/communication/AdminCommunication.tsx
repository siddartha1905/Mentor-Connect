import * as React from 'react'
import {
  MessageSquare,
  Send,
  Users,
  Plus,
  Archive,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Bold,
  Italic,
  List,
  ListOrdered,
  Eye,
  FileSignature,
  PhoneCall,
  PenLine,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { AnnouncementContent } from '@/components/shared/AnnouncementContent'
import { useAuth } from '@/app/providers/AuthContext'
import { MOCK_STUDENTS, MOCK_CHAT_MESSAGES } from '@/data/mock'
import {
  announcementService,
  type AnnouncementRecord,
  type AnnouncementCategory,
  type AnnouncementStatus,
} from '@/services/announcementService'

export const AdminCommunication: React.FC = () => {
  const { isDemo, user } = useAuth()
  const [activeTab, setActiveTab] = React.useState('announcements') // Default to announcements for easy management
  const [selectedStudentRoll, setSelectedStudentRoll] = React.useState('23L31A5401')
  const [messages, setMessages] = React.useState(MOCK_CHAT_MESSAGES['23L31A5401'] || [])
  const [inputText, setInputText] = React.useState('')

  // Real announcements list
  const [announcements, setAnnouncements] = React.useState<AnnouncementRecord[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = React.useState(true)

  // Announcement dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editorTab, setEditorTab] = React.useState<'write' | 'preview'>('write')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formTitle, setFormTitle] = React.useState('')
  const [formMessage, setFormMessage] = React.useState('')
  const [formCategory, setFormCategory] = React.useState<AnnouncementCategory>('Mentor Update')
  const [formSource, setFormSource] = React.useState('')
  const [formDate, setFormDate] = React.useState(new Date().toISOString().split('T')[0])
  const [formStatus, setFormStatus] = React.useState<AnnouncementStatus>('published')
  const [savingAnnouncement, setSavingAnnouncement] = React.useState(false)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = textarea.value

    const selectedText = currentVal.substring(start, end)
    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultPlaceholder}${suffix}`

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end)
    setFormMessage(newVal)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultPlaceholder.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleInsertSignature = () => {
    const sig = `\n\nWarm regards,\nJ. Siddhartha Varma\nFaculty Mentor, Department of CSE (Data Science)\nEmail: mentor@domain.edu`
    const textarea = textareaRef.current
    if (!textarea) {
      setFormMessage((prev) => (prev.trim() ? prev.trim() + sig : sig.trim()))
      return
    }
    const currentVal = textarea.value
    const newVal = currentVal.trim() ? currentVal.trim() + sig : sig.trim()
    setFormMessage(newVal)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newVal.length, newVal.length)
    }, 0)
  }

  const handleInsertContact = () => {
    const contact = `\n\nFaculty Contact: mentor@domain.edu | Office: Room 304, DS Dept`
    const textarea = textareaRef.current
    if (!textarea) {
      setFormMessage((prev) => (prev.trim() ? prev.trim() + contact : contact.trim()))
      return
    }
    const currentVal = textarea.value
    const newVal = currentVal.trim() ? currentVal.trim() + contact : contact.trim()
    setFormMessage(newVal)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newVal.length, newVal.length)
    }, 0)
  }

  const loadAnnouncements = React.useCallback(async () => {
    setLoadingAnnouncements(true)
    try {
      const data = await announcementService.getAllAnnouncements()
      setAnnouncements(data)
    } finally {
      setLoadingAnnouncements(false)
    }
  }, [])

  React.useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  const tabs = [
    { id: 'announcements', label: 'Announcement Management', icon: <Users className="h-4 w-4" /> },
    { id: 'chat', label: '1-on-1 Mentee Messages', icon: <MessageSquare className="h-4 w-4" /> },
  ]

  const handleSelectStudent = (roll: string) => {
    setSelectedStudentRoll(roll)
    setMessages(MOCK_CHAT_MESSAGES[roll] || [])
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg = {
      id: `local-adm-${Date.now()}`,
      senderRole: 'mentor' as const,
      senderName: 'J. Siddhartha Varma (Faculty Mentor)',
      content: inputText,
      timestamp: 'Just now (Staged)',
      isPrivate: true,
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormTitle('')
    setFormMessage('')
    setFormCategory('Mentor Update')
    setFormSource('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormStatus('published')
    setEditorTab('write')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (ann: AnnouncementRecord) => {
    setEditingId(ann.id)
    setFormTitle(ann.title)
    setFormMessage(ann.message)
    setFormCategory(ann.category)
    setFormSource(ann.informationSource || '')
    setFormDate(ann.date)
    setFormStatus(ann.status)
    setEditorTab('write')
    setIsDialogOpen(true)
  }

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formMessage.trim()) return

    setSavingAnnouncement(true)
    try {
      if (editingId) {
        await announcementService.updateAnnouncement(editingId, {
          title: formTitle,
          message: formMessage,
          category: formCategory,
          informationSource: formSource.trim() || null,
          date: formDate,
          status: formStatus,
        })
        setFeedback('Announcement updated successfully.')
      } else {
        await announcementService.createAnnouncement({
          title: formTitle,
          message: formMessage,
          category: formCategory,
          informationSource: formSource.trim() || null,
          publishedByName: user?.email ? 'J. Siddhartha Varma' : 'J. Siddhartha Varma',
          date: formDate,
          status: formStatus,
        })
        setFeedback('New announcement published successfully.')
      }
      setIsDialogOpen(false)
      await loadAnnouncements()
      setTimeout(() => setFeedback(null), 3000)
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleToggleArchive = async (ann: AnnouncementRecord) => {
    const nextStatus: AnnouncementStatus = ann.status === 'archived' ? 'published' : 'archived'
    await announcementService.updateAnnouncement(ann.id, { status: nextStatus })
    setFeedback(`Announcement ${nextStatus === 'archived' ? 'archived' : 'published'}.`)
    await loadAnnouncements()
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    await announcementService.deleteAnnouncement(id)
    setFeedback('Announcement deleted.')
    await loadAnnouncements()
    setTimeout(() => setFeedback(null), 3000)
  }

  const currentStudent = MOCK_STUDENTS.find((s) => s.rollNumber === selectedStudentRoll) || MOCK_STUDENTS[0]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-purple-700" />
            Announcement & Communications Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, publish and archive cohort announcements for students.
          </p>
        </div>

        {activeTab === 'announcements' && (
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Post New Announcement
          </Button>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Cohort communications preview."
        />
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* TAB 1: ANNOUNCEMENT MANAGEMENT */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {loadingAnnouncements ? (
            <Card className="p-8 text-center text-xs text-slate-400">
              Loading announcements...
            </Card>
          ) : announcements.length === 0 ? (
            <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Megaphone className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Announcements Created</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Post New Announcement" above to publish your first cohort update.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <Card
                  key={ann.id}
                  className={`p-5 space-y-3 bg-white border ${
                    ann.status === 'archived'
                      ? 'border-slate-200 opacity-60 bg-slate-50/50'
                      : 'border-purple-100 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                        {ann.category}
                      </span>
                      {ann.informationSource && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Source: {ann.informationSource}
                        </span>
                      )}
                      <Badge
                        variant={
                          ann.status === 'published'
                            ? 'approved'
                            : ann.status === 'draft'
                            ? 'pending'
                            : 'low'
                        }
                      >
                        {ann.status.toUpperCase()}
                      </Badge>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {ann.title}
                    </h3>
                    <AnnouncementContent content={ann.message} />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">
                        Publisher: {ann.publishedByName}
                      </span>
                      <span className="text-slate-400">• Faculty Mentor</span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(ann)}
                        className="text-xs text-purple-700 hover:bg-purple-50 h-7 px-2"
                        title="Edit announcement"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleArchive(ann)}
                        className="text-xs text-slate-600 hover:bg-slate-50 h-7 px-2"
                        title={ann.status === 'archived' ? 'Publish' : 'Archive'}
                      >
                        <Archive className="h-3.5 w-3.5 mr-1" />
                        {ann.status === 'archived' ? 'Unarchive' : 'Archive'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-xs text-rose-600 hover:bg-rose-50 h-7 px-2"
                        title="Delete announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 1-ON-1 MENTEE MESSAGES */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mentees Sidebar */}
          <Card className="p-3 md:col-span-1 h-[560px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-2">
              CSE-DS Mentees
            </h3>
            <div className="space-y-1 flex-1 overflow-y-auto">
              {MOCK_STUDENTS.map((st) => (
                <div
                  key={st.rollNumber}
                  onClick={() => handleSelectStudent(st.rollNumber)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    selectedStudentRoll === st.rollNumber
                      ? 'bg-purple-100 text-purple-950 font-bold border border-purple-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p>{st.fullName}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{st.rollNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="md:col-span-2 h-[560px] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{currentStudent.fullName}</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Roll: {currentStudent.rollNumber} • Assigned Mentee
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderRole === 'mentor' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.senderRole === 'mentor'
                        ? 'bg-purple-700 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="font-semibold text-[10px] opacity-80 mb-0.5">{msg.senderName}</p>
                    <p>{msg.content}</p>
                    <span className="text-[9px] opacity-70 block text-right mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Send private guidance to ${currentStudent.fullName}...`}
                className="flex-1 text-xs h-10 px-3.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
              />
              <Button type="submit" size="sm" className="h-10 px-4 bg-purple-700 hover:bg-purple-800 text-white">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* CREATE / EDIT ANNOUNCEMENT DIALOG */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="2xl"
        title={editingId ? 'Edit Announcement' : 'Post New Announcement'}
        description="Broadcast official announcements and guidance to your student cohort with rich text formatting."
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4 pt-1">
          {/* Write vs Preview Toggle Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEditorTab('write')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  editorTab === 'write'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Write</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  editorTab === 'preview'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Student Preview</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
              {editorTab === 'write'
                ? 'Markdown formatting supported'
                : 'Exact Student Portal preview'}
            </span>
          </div>

          {/* TAB 1: WRITE MODE */}
          {editorTab === 'write' ? (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Semester Lab Schedule & Guidelines"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AnnouncementCategory)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
                  >
                    <option value="Mentor Update">Mentor Update</option>
                    <option value="Department Information">Department Information</option>
                    <option value="College Information">College Information</option>
                    <option value="Important Notice">Important Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Information Source (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HOD Office, Principal, Examination Cell"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Leave blank if this is a direct faculty mentor notice.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AnnouncementStatus)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none bg-white font-medium"
                  >
                    <option value="published">Published (Visible on student portal)</option>
                    <option value="draft">Draft (Saved, hidden from students)</option>
                    <option value="archived">Archived (Stored in archive)</option>
                  </select>
                </div>
              </div>

              {/* Message Content with Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Message Content & Details *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Use blank lines between paragraphs
                  </span>
                </div>

                {/* Rich Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-t-xl border-b-0 text-slate-700">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'bold text')}
                    className="p-1.5 hover:text-purple-700 hover:bg-white rounded-md transition-colors"
                    title="Bold (**text**)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'italic text')}
                    className="p-1.5 hover:text-purple-700 hover:bg-white rounded-md transition-colors"
                    title="Italic (*text*)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>

                  <span className="h-4 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => insertFormatting('\n- ', '', 'Bullet point item')}
                    className="flex items-center gap-1 px-2 py-1 hover:text-purple-700 hover:bg-white rounded-md transition-colors text-[11px] font-medium"
                    title="Bullet List (- item)"
                  >
                    <List className="h-3.5 w-3.5 text-purple-700" />
                    <span>Bullet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n1. ', '', 'Numbered list item')}
                    className="flex items-center gap-1 px-2 py-1 hover:text-purple-700 hover:bg-white rounded-md transition-colors text-[11px] font-medium"
                    title="Numbered List (1. item)"
                  >
                    <ListOrdered className="h-3.5 w-3.5 text-purple-700" />
                    <span>Numbered</span>
                  </button>

                  <span className="h-4 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={handleInsertSignature}
                    className="flex items-center gap-1 px-2 py-1 hover:text-purple-700 hover:bg-white rounded-md transition-colors text-[11px] font-medium text-purple-800"
                    title="Insert Faculty Signature block"
                  >
                    <FileSignature className="h-3.5 w-3.5 text-purple-600" />
                    <span>+ Signature</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertContact}
                    className="flex items-center gap-1 px-2 py-1 hover:text-purple-700 hover:bg-white rounded-md transition-colors text-[11px] font-medium text-purple-800"
                    title="Insert Contact Info block"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-purple-600" />
                    <span>+ Contact Info</span>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={8}
                  placeholder={`Write announcement details for your mentee cohort...

- Preserves paragraph breaks and line spacing
- Use bullet points (- or •) and numbered lists (1.)
- Signatures and contact numbers appear on separate lines`}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  required
                  className="w-full p-3.5 text-xs sm:text-sm rounded-b-xl border border-slate-200 focus:border-purple-600 outline-none leading-relaxed font-sans resize-y min-h-[160px]"
                />

                <p className="text-[10px] text-slate-400 mt-1">
                  Tip: Press Enter twice for separate paragraphs. Faculty signatures, emails and office locations are preserved on their own separate lines.
                </p>
              </div>
            </div>
          ) : (
            /* TAB 2: LIVE STUDENT PREVIEW MODE */
            <div className="space-y-4">
              <div className="p-4 sm:p-6 rounded-2xl border border-purple-200 bg-white shadow-xs space-y-3.5">
                {/* Header Badge & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                      {formCategory}
                    </span>
                    {formSource.trim() && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Source: {formSource.trim()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {formDate}
                  </span>
                </div>

                {/* Announcement Title */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {formTitle.trim() || 'Untitled Announcement'}
                </h3>

                {/* Formatted Content */}
                <AnnouncementContent
                  content={
                    formMessage.trim() ||
                    '_No message content entered yet. Switch back to "Write" mode to type your announcement._'
                  }
                />

                {/* Footer Attribution */}
                <div className="pt-3 border-t border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">
                      Published by J. Siddhartha Varma
                    </span>
                    <span className="text-slate-400">• Faculty Mentor</span>
                  </div>
                  {formSource.trim() ? (
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-medium">
                      Relayed announcement
                    </span>
                  ) : (
                    <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md font-medium">
                      Direct Mentor Update
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/70 rounded-xl text-purple-900 text-xs flex items-center justify-between">
                <span>
                  Target Status:{' '}
                  <strong className="uppercase font-bold tracking-wider">{formStatus}</strong>{' '}
                  ({formStatus === 'published' ? 'Visible immediately to students' : 'Hidden from students'})
                </span>
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  className="text-purple-700 underline font-semibold hover:text-purple-900"
                >
                  Return to Editor
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditorTab(editorTab === 'write' ? 'preview' : 'write')}
              className="text-xs text-slate-700 border-slate-200"
            >
              {editorTab === 'write' ? (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1 text-purple-700" />
                  Preview
                </>
              ) : (
                <>
                  <PenLine className="h-3.5 w-3.5 mr-1 text-purple-700" />
                  Edit Content
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingAnnouncement}
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs px-4"
              >
                {savingAnnouncement
                  ? 'Saving...'
                  : editingId
                  ? 'Save Changes'
                  : 'Publish Announcement'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
