import * as React from 'react'
import {
  MessageSquare,
  Send,
  Lock,
  Users,
  ShieldCheck,
  ThumbsUp,
  MessageCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_CHAT_MESSAGES } from '@/data/mock'
import { useAuth } from '@/app/providers/AuthContext'
import { announcementService, type AnnouncementRecord } from '@/services/announcementService'
import { AnnouncementContent } from '@/components/shared/AnnouncementContent'

export const StudentMessages: React.FC = () => {
  const { studentProfile, isDemo } = useAuth()
  const [activeTab, setActiveTab] = React.useState('chat')
  const initialMessages = isDemo ? (MOCK_CHAT_MESSAGES['23L31A5401'] || []) : []
  const [messages, setMessages] = React.useState(initialMessages)
  const [inputText, setInputText] = React.useState('')
  const [announcements, setAnnouncements] = React.useState<AnnouncementRecord[]>([])

  React.useEffect(() => {
    announcementService.getPublishedAnnouncements().then(setAnnouncements)
  }, [])

  const tabs = [
    { id: 'chat', label: 'Mentor Private Chat', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'feed', label: 'Cohort Feed', icon: <Users className="h-4 w-4" /> },
  ]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMessage = {
      id: `local-${Date.now()}`,
      senderRole: 'student' as const,
      senderName: studentProfile?.fullName || 'Student',
      content: inputText,
      timestamp: 'Just now (Staged locally)',
      isPrivate: true,
    }
    setMessages((prev) => [...prev, newMessage])
    setInputText('')
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Back to Home Navigation */}
      <div>
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-purple-700" />
          Communications
        </h1>
        <p className="text-xs text-slate-500">
          Direct private dialogue with faculty mentor and department cohort announcements.
        </p>
      </div>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Cohort communications preview."
        />
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* TAB 1: STUDENT-MENTOR PRIVATE CHAT */}
      {activeTab === 'chat' && (
        <Card className="flex flex-col h-[520px] border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                JS
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  J. Siddhartha Varma (Faculty Mentor)
                </h4>
                <p className="text-[10px] text-slate-500">
                  CSE-Data Science Mentoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              <Lock className="h-3 w-3" />
              <span>Confidential Channel</span>
            </div>
          </div>

          {/* Chat Message Scroll */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Messages Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Start a private conversation with your mentor. Your messages are confidential.
                </p>
              </div>
            ) : messages.map((msg) => {
              const isMe = msg.senderRole === 'student'
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium">
                    {msg.senderName} • {msg.timestamp}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Student-to-student DM notice */}
          <div className="px-4 py-1.5 bg-slate-100 border-t border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Student-to-student direct messaging is disabled by institutional policy.</span>
            <span className="font-semibold text-slate-600">Faculty Monitored</span>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a confidential question for your mentor..."
              className="flex-1 text-xs h-10 px-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
            />
            <Button type="submit" size="sm" variant="primary" className="h-10 px-4">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: COHORT ANNOUNCEMENT FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Announcements Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Department notices and cohort announcements will appear here once published by your faculty mentor.
              </p>
            </div>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} className="p-5 border-purple-100 bg-white shadow-xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                      {ann.category}
                    </span>
                    {ann.informationSource && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Source: {ann.informationSource}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">{ann.date}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {ann.title}
                  </h3>
                  <AnnouncementContent content={ann.message} />
                </div>

                <div className="pt-3 border-t border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">
                      Published by {ann.publishedByName}
                    </span>
                    <span className="text-slate-400">• Faculty Mentor</span>
                  </div>
                  {ann.informationSource ? (
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-medium">
                      Relayed announcement
                    </span>
                  ) : (
                    <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md font-medium">
                      Direct Mentor Update
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
