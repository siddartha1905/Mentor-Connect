import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  Bell,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { MOCK_STUDENTS } from '@/data/mock'

export const StudentMore: React.FC = () => {
  const navigate = useNavigate()
  const student = MOCK_STUDENTS[0] // Aarav Sharma

  const menuSections = [
    {
      title: 'Academic & Mentoring',
      items: [
        { label: 'My Student Profile', desc: 'Sections A through G details', icon: User, path: '/student/profile', badge: '100%' },
        { label: 'Mentoring Calendar', desc: 'Booked 1-on-1 slots & office hours', icon: Calendar, path: '/student/calendar' },
        { label: 'Department Directory', desc: 'CSE-DS cohort roll list', icon: Users, path: '/student/directory' },
        { label: 'Forms & Surveys', desc: 'Course feedback & elective choices', icon: ClipboardList, path: '/student/surveys', badge: '1 Active' },
      ],
    },
    {
      title: 'Documents & Records',
      items: [
        { label: 'My Documents', desc: 'External Google Drive links & certificates', icon: FileText, path: '/student/documents' },
        { label: 'Notifications Hub', desc: 'Departmental announcements & alerts', icon: Bell, path: '/student/messages' },
      ],
    },
    {
      title: 'Preferences & System',
      items: [
        { label: 'Privacy & Opt-in Settings', desc: 'Directory phone/email visibility', icon: Shield, path: '/student/more' },
        { label: 'App Settings & Offline PWA', desc: 'Theme & cache status', icon: Settings, path: '/student/more' },
      ],
    },
  ]

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Student Profile Card Header */}
      <Link to="/student/profile">
        <Card className="p-4 hover:border-indigo-300 transition-colors bg-gradient-to-r from-purple-50 via-white to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={student.avatarUrl}
                alt={student.fullName}
                fallback={student.fullName}
                size="lg"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">{student.fullName}</h3>
                <p className="text-xs font-mono text-slate-500">{student.rollNumber} • {student.department}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="approved">Approved</Badge>
                  <span className="text-[11px] text-indigo-700 font-semibold">View / Edit Profile</span>
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </Card>
      </Link>

      <DemoNotice
        variant="inline"
        message="Stage 1 Navigation Shell. Submodules feature interactive interfaces with fictional records."
      />

      {/* Menu Categories */}
      {menuSections.map((sec, idx) => (
        <div key={idx} className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            {sec.title}
          </h4>
          <Card className="p-1 divide-y divide-slate-100">
            {sec.items.map((item, itemIdx) => {
              const Icon = item.icon
              return (
                <Link
                  key={itemIdx}
                  to={item.path}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && <Badge variant="low">{item.badge}</Badge>}
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              )
            })}
          </Card>
        </div>
      ))}

      {/* Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors shadow-xs"
      >
        <LogOut className="h-4 w-4" />
        <span>Return to Landing Page (Demo Exit)</span>
      </button>

      <div className="text-center text-[11px] text-slate-400 pt-1">
        Mentor Connect PWA • Build 1.0.0 (Stage 1 Architecture)
      </div>
    </div>
  )
}
