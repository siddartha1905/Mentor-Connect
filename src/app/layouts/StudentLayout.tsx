import * as React from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Compass,
  Menu,
  Bell,
  LogOut,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Avatar } from '@/components/ui/avatar'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthContext'
import { announcementService, type AnnouncementRecord } from '@/services/announcementService'
import { AnnouncementContent } from '@/components/shared/AnnouncementContent'

export const StudentLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { studentProfile, user, accountLinkingError, signOut } = useAuth()
  const student = studentProfile
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [announcements, setAnnouncements] = React.useState<AnnouncementRecord[]>([])

  React.useEffect(() => {
    announcementService.getPublishedAnnouncements().then((data) => {
      setAnnouncements(data)
    })
  }, [])

  // Primary bottom navigation items (Mobile)
  const navItems = [
    { path: '/student', label: 'Home', icon: Home, exact: true },
    { path: '/student/journey', label: 'Journey', icon: Compass },
    { path: '/student/profile', label: 'Profile', icon: UserCheck },
    { path: '/student/more', label: 'More', icon: Menu },
  ]

  const isTabActive = (itemPath: string, exact?: boolean) => {
    if (exact) return location.pathname === itemPath || location.pathname === `${itemPath}/`
    return location.pathname.startsWith(itemPath)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login/student', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20 md:pb-6 select-none sm:select-text">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo navigates to authenticated /student home, preserving session */}
          <Link
            to="/student"
            className="hover:opacity-90 transition-opacity"
            title="Return to Student Home"
          >
            <Logo size="sm" />
          </Link>

          {/* Desktop Direct Navigation: Home & Profile */}
          <nav className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200">
            <Link
              to="/student"
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                location.pathname === '/student' || location.pathname === '/student/'
                  ? 'bg-purple-100 text-purple-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              Home
            </Link>
            <Link
              to="/student/profile"
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                location.pathname.startsWith('/student/profile')
                  ? 'bg-purple-100 text-purple-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              My Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="View announcements and notices"
          >
            <Bell className="h-5 w-5" />
            {announcements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
            )}
          </button>

          {/* Student Profile Avatar & Name Link */}
          <Link
            to="/student/profile"
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="View My Profile"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {student?.fullName || (user?.email ? user.email.split('@')[0] : 'Student')}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight font-mono mt-0.5">
                {student?.rollNumber || 'Enrolled Student'}
              </p>
            </div>
            <Avatar
              src={student?.avatarUrl || ''}
              alt={student?.fullName || 'Student'}
              fallback={student?.fullName || user?.email || 'ST'}
              size="sm"
            />
          </Link>

          {/* Explicit Separate Sign Out Action */}
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors ml-1"
            title="Sign out of student portal"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Account Linking Warning Banner if applicable */}
      {accountLinkingError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{accountLinkingError}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="self-end sm:self-auto px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-[11px] transition-colors"
          >
            Dismiss Alert
          </button>
        </div>
      )}

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
                  ? 'text-purple-700 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-colors',
                  active && 'bg-purple-50 text-purple-700'
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
        title="Cohort Announcements"
        description="Official updates published by your faculty mentor."
      >
        <div className="space-y-3 pt-1">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200/50">
                  <span className="font-bold text-slate-900">{ann.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{ann.date}</span>
                </div>
                <AnnouncementContent content={ann.message} />
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                  <span>Published by {ann.publishedByName}</span>
                  {ann.informationSource && (
                    <span className="text-purple-700 font-semibold">
                      Source: {ann.informationSource}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No active announcements have been published yet.
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
