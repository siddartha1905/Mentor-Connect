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
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_CHAT_MESSAGES, MOCK_ANNOUNCEMENTS } from '@/data/mock'

export const StudentMessages: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('chat')
  const initialMessages = MOCK_CHAT_MESSAGES['23L31A5401'] || []
  const [messages, setMessages] = React.useState(initialMessages)
  const [inputText, setInputText] = React.useState('')
  const [feedPosts, setFeedPosts] = React.useState(MOCK_ANNOUNCEMENTS)

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
      senderName: 'Aarav Sharma',
      content: inputText,
      timestamp: 'Just now (Staged locally)',
      isPrivate: true,
    }
    setMessages((prev) => [...prev, newMessage])
    setInputText('')
  }

  const handleReaction = (id: string) => {
    setFeedPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, reactionsCount: post.reactionsCount + 1 } : post
      )
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          Communications
        </h1>
        <p className="text-xs text-slate-500">
          Direct private dialogue with faculty mentor and department cohort announcements.
        </p>
      </div>

      <DemoNotice
        variant="inline"
        message="Stage 1 Interface Shell. Real-time message websockets and Supabase storage will be connected in Stage 2."
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* TAB 1: STUDENT-MENTOR PRIVATE CHAT */}
      {activeTab === 'chat' && (
        <Card className="flex flex-col h-[520px] border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                KR
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Dr. K. S. Rao</h4>
                <p className="text-[10px] text-slate-500">Faculty Mentor (CSE-DS)</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              <Lock className="h-3 w-3" />
              <span>Confidential Channel</span>
            </div>
          </div>

          {/* Chat Message Scroll */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {messages.map((msg) => {
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
          {feedPosts.map((post) => (
            <Card key={post.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={post.priority === 'Urgent' ? 'high' : 'low'}>
                    {post.category} • {post.priority}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{post.date}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{post.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{post.content}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Posted by {post.author}</span>
                <button
                  type="button"
                  onClick={() => handleReaction(post.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-semibold text-[11px]"
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{post.reactionsCount} Acknowledged</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
