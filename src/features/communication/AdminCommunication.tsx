import * as React from 'react'
import {
  MessageSquare,
  Send,
  Users,
  Lock,
  Plus,
  Sparkles,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS, MOCK_CHAT_MESSAGES, MOCK_ANNOUNCEMENTS } from '@/data/mock'

export const AdminCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('chat')
  const [selectedStudentRoll, setSelectedStudentRoll] = React.useState('23L31A5401') // Aarav Sharma
  const [messages, setMessages] = React.useState(MOCK_CHAT_MESSAGES['23L31A5401'] || [])
  const [inputText, setInputText] = React.useState('')
  const [announcements, setAnnouncements] = React.useState(MOCK_ANNOUNCEMENTS)

  const tabs = [
    { id: 'chat', label: '1-on-1 Mentee Messages', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'announcements', label: 'Cohort Announcements Feed', icon: <Users className="h-4 w-4" /> },
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
      senderName: 'Dr. K. S. Rao (Faculty Mentor)',
      content: inputText,
      timestamp: 'Just now (Staged)',
      isPrivate: true,
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')
  }

  const currentStudent = MOCK_STUDENTS.find((s) => s.rollNumber === selectedStudentRoll) || MOCK_STUDENTS[0]

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-purple-700" />
          Communications Hub
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Private student dialogue and departmental broadcast announcements.
        </p>
      </div>

      <DemoNotice
        variant="inline"
        message="Confidential Communication Interface. Real-time Supabase web sockets will connect in Stage 2."
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {activeTab === 'chat' && (
        <div className="grid md:grid-cols-12 gap-4">
          {/* Student Picker List */}
          <Card className="md:col-span-4 p-3 space-y-2 h-[520px] overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Mentees (CSE-DS)
            </span>
            {MOCK_STUDENTS.map((s) => (
              <button
                key={s.rollNumber}
                type="button"
                onClick={() => handleSelectStudent(s.rollNumber)}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors ${
                  selectedStudentRoll === s.rollNumber
                    ? 'bg-purple-100 text-purple-950 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <p className="text-xs">{s.fullName}</p>
                  <p className="text-[10px] font-mono text-slate-400">{s.rollNumber}</p>
                </div>
                {selectedStudentRoll === s.rollNumber && (
                  <span className="h-2 w-2 rounded-full bg-purple-700" />
                )}
              </button>
            ))}
          </Card>

          {/* Chat Panel */}
          <Card className="md:col-span-8 flex flex-col h-[520px] border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{currentStudent.fullName}</h4>
                <p className="text-[10px] text-slate-500 font-mono">{currentStudent.rollNumber} • Sec {currentStudent.section}</p>
              </div>
              <Badge variant="good">Private Mentoring Channel</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
              {messages.length > 0 ? (
                messages.map((m) => {
                  const isMentor = m.senderRole === 'mentor'
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${
                        isMentor ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-xs ${
                          isMentor
                            ? 'bg-purple-700 text-white rounded-br-xs shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {m.senderName} • {m.timestamp}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No conversation history with this student yet. Send a note below.
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type private guidance message to ${currentStudent.fullName.split(' ')[0]}...`}
                className="flex-1 text-xs h-10 px-3.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
              />
              <Button type="submit" size="sm" variant="primary" className="h-10 px-4 bg-purple-700 hover:bg-purple-800">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Cohort Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="pastel-lavender" size="sm" className="text-xs font-bold">
              <Plus className="h-3.5 w-3.5 mr-1 text-purple-700" />
              Post New Announcement (Preview)
            </Button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <Card key={ann.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={ann.priority === 'Urgent' ? 'high' : 'low'}>
                    {ann.category} • {ann.priority}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Author: {ann.author}</span>
                  <span className="font-semibold text-purple-800">{ann.reactionsCount} Mentees Acknowledged</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
