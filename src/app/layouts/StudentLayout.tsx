import * as React from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import {
  Home,
  Compass,
  CalendarCheck2,
  MessageSquare,
  Menu,
  Bell,
  Sparkles,
  ChevronLeft,
  X,
  ExternalLink,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Avatar } from '@/components/ui/avatar'
import { Dialog } from '@/components/ui/dialog'
import { MOCK_STUDENTS, MOCK_ANNOUNCEMENTS } from '@/data/mock'
import { cn } from '@/lib/utils'

export const StudentLayout: React.FC = () => {
  const location = useLocation()
  const student = MOCK_STUDENTS[0] // Aarav Sharma (23L31A5401)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)

  // Primary bottom navigation items (5 tabs)
  const navItems = [
    { path: '/student', label: 'Home', icon: Home, exact: true },
    { path: '/student/journey', label: 'Journey', icon: Compass },
    { path: '/student/check-in', label: 'Check-in', icon: CalendarCheck2 },
    { path: '/student/messages', label: 'Messages', icon: MessageSquare },
    { path: '/student/more', label: 'More', icon: Menu },
  ]

  const isTabActive = (itemPath: string, exact?: boolean) => {
    if (exact) return location.pathname === itemPath || location.pathname === `${itemPath}/`
    return location.pathname.startsWith(itemPath)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20 md:pb-6 select-none sm:select-text">
      {/* Top Mobile/Desktop Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <span className="hidden sm:inline-flex text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
            Student PWA App
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {/* Student Profile Avatar & Name Link */}
          <Link
            to="/student/profile"
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{student.fullName}</p>
              <p className="text-[10px] text-slate-500 leading-tight font-mono">{student.rollNumber}</p>
            </div>
            <Avatar
              src={student.avatarUrl}
              alt={student.fullName}
              fallback={student.fullName}
              size="sm"
            />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed 5 Tabs) */}
      <nav
        role="navigation"
        aria-label="Student Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isTabActive(item.path, item.exact)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 text-[11px] font-semibold gap-0.5 min-w-[56px]',
                active
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-colors',
                  active && 'bg-indigo-50 text-indigo-600'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
              </div>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Notifications Drawer Modal */}
      <Dialog
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Student Notifications"
        description="Official alerts and mentoring reminders for your cohort."
      >
        <div className="space-y-3 pt-1">
          {MOCK_ANNOUNCEMENTS.map((ann) => (
            <div
              key={ann.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{ann.title}</span>
                <span className="text-[10px] text-slate-400">{ann.date}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>By {ann.author}</span>
                <span className="font-semibold text-indigo-600">Priority: {ann.priority}</span>
              </div>
            </div>
          ))}

          <div className="pt-2 text-center">
            <span className="text-xs text-slate-400">
              Push notification permissions will be requested in a later stage.
            </span>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
