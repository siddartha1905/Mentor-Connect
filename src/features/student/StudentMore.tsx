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
import { useAuth } from '@/app/providers/AuthContext'

export const StudentMore: React.FC = () => {
  const navigate = useNavigate()
  const { studentProfile, isDemo, signOut, user, accountLinkingError } = useAuth()
  const student = studentProfile || (isDemo || !user ? MOCK_STUDENTS[0] : null)
  const isLinked = user ? Boolean(studentProfile && !accountLinkingError) : true

  const menuSections = [
    {
      title: 'Academic & Mentoring',
      items: [
        { label: 'My Student Profile', desc: 'Sections A through G details', icon: User, path: '/student/profile', badge: isLinked ? `${student?.profileCompletionPercent ?? 0}%` : undefined },
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
        { label: 'Privacy & Opt-in Settings', desc: 'Directory phone/email visibility', icon: Shield, path: '/student/profile' },
        { label: 'App Settings & Offline PWA', desc: 'Theme & cache status', icon: Settings, path: '/student/more' },
      ],
    },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const isProfileApproved = isLinked && student?.profileStatus === 'Approved'
  const isProfilePending = isLinked && student?.profileStatus === 'Pending Approval'
  const isProfileChanges = isLinked && student?.profileStatus === 'Changes Requested'

  return (
    <div className="space-y-5 pb-6">
      {/* Student Profile Card Header */}
      <Link to="/student/profile">
        <Card className="p-4 hover:border-indigo-300 transition-colors bg-gradient-to-r from-purple-50 via-white to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={isLinked ? (student?.avatarUrl || '') : ''}
                alt={student?.fullName || 'Student'}
                fallback={student?.fullName || user?.email || 'ST'}
                size="lg"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isLinked ? (student?.fullName || 'Enrolled Student') : (user?.email ? user.email.split('@')[0] : 'Enrolled Student')}
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  {isLinked ? `${student?.rollNumber || 'Roster Student'} • ${student?.department || 'CSE-Data Science'}` : 'Unlinked Student Account'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isLinked ? (
                    <>
                      {isProfileApproved && <Badge variant="approved">Profile Approved</Badge>}
                      {isProfilePending && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold">
                          Pending Approval
                        </Badge>
                      )}
                      {isProfileChanges && (
                        <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 font-bold">
                          Changes Requested
                        </Badge>
                      )}
                      {!isProfileApproved && !isProfilePending && !isProfileChanges && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-bold">
                          Profile Incomplete
                        </Badge>
                      )}
                      <span className="text-[11px] text-indigo-700 font-semibold">View / Complete Profile</span>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-400 font-bold">
                        Account Not Linked
                      </Badge>
                      <span className="text-[11px] text-amber-700 font-semibold">Linking Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </Card>
      </Link>

      {isDemo && (
        <DemoNotice
          variant="inline"
          message="Demonstration Environment: Additional student portal modules."
        />
      )}

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
        <span>Sign Out of Student Account</span>
      </button>

      <div className="text-center text-[11px] text-slate-400 pt-1">
        Mentor Connect Student Portal • Version 1.0.0
      </div>
    </div>
  )
}
