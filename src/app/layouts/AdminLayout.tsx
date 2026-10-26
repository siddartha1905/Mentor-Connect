import * as React from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  TrendingUp,
  ClipboardList,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Compass,
  ArrowRight,
  Shield,
  LogOut,
  CalendarClock,
  Layers,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { MOCK_STUDENTS, MOCK_ANNOUNCEMENTS } from '@/data/mock'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthContext'
import { studentService, type StudentRecord } from '@/services/studentService'

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isConfigured, isDemo } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchFocused, setSearchFocused] = React.useState(false)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [realStudents, setRealStudents] = React.useState<StudentRecord[]>([])

  React.useEffect(() => {
    let isMounted = true
    if (isConfigured && !isDemo) {
      studentService
        .getAllStudents()
        .then((data) => {
          if (isMounted) setRealStudents(data || [])
        })
        .catch(() => {})
    }
    return () => {
      isMounted = false
    }
  }, [isConfigured, isDemo])

  const studentCount = isConfigured && !isDemo ? realStudents.length : 1

  // Prioritized Administrator Navigation Routes
  const navLinks = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Student Management', path: '/admin/students', icon: Users, badge: `${studentCount}` },
    { label: 'Mentor 360° View', path: '/admin/mentor360', icon: Compass, badge: 'Core' },
    { label: 'Communications', path: '/admin/communication', icon: MessageSquare },
    { label: 'Profile Deadlines', path: '/admin/deadlines', icon: CalendarClock, badge: 'Nov 3' },
    { label: 'Development Roadmap', path: '/admin/roadmap', icon: Layers },
    { label: 'Administration', path: '/admin/settings', icon: Settings },
  ]

  // Real or Demo Student Search Filter (by name, roll number, or email)
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    if (isConfigured && !isDemo) {
      return realStudents
        .filter(
          (s) =>
            s.roll_number.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            (s.email && s.email.toLowerCase().includes(q))
        )
        .map((s) => ({
          rollNumber: s.roll_number,
          fullName: s.name,
          department: s.department || 'CSE-Data Science',
          email: s.email,
          avatarUrl: s.avatar_url || '',
        }))
    }
    return MOCK_STUDENTS.filter(
      (s) =>
        s.rollNumber.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    ).map((s) => ({
      rollNumber: s.rollNumber,
      fullName: s.fullName,
      department: s.department,
      email: s.email,
      avatarUrl: s.avatarUrl,
    }))
  }, [searchQuery, isConfigured, isDemo, realStudents])

  const handleSelectStudent = (rollNumber: string) => {
    setSearchQuery('')
    setSearchFocused(false)
    navigate(`/admin/mentor360?roll=${rollNumber}`)
  }

  const isLinkActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path || location.pathname === `${path}/`
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SOFT PASTEL SIDEBAR (Lavender / Powder Blue with Dark Typography - NEVER dark navy/black!) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#F5F3FF] border-r border-[#EDE9FE] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-4 border-b border-[#EDE9FE] flex items-center justify-between bg-white/50 backdrop-blur-xs">
          <Link to="/admin" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-purple-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Faculty Mentor Badge Banner */}
        <div className="p-3 mx-3 my-2.5 rounded-2xl bg-white/80 border border-purple-200/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs shrink-0">
              SV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">J. Siddartha Varma</p>
              <p className="text-[10px] text-purple-700 font-semibold truncate">Assistant Professor, CSE-DS</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-purple-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>{isConfigured && !isDemo ? `${realStudents.length} Roster Students` : 'Verified Student Roster'}</span>
            <span className="font-semibold text-emerald-700">Sem 2-1 Active</span>
          </div>
        </div>

        {/* Sidebar Navigation Menu Links */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navLinks.map((item) => {
            const Icon = item.icon
            const active = isLinkActive(item.path, item.exact)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                  active
                    ? 'bg-purple-200/90 text-purple-950 font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-purple-100/70 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-purple-800' : 'text-slate-500'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold',
                      active
                        ? 'bg-purple-300 text-purple-950'
                        : 'bg-white text-purple-800 border border-purple-200'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#EDE9FE] bg-white/40 text-xs space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-purple-100 text-xs font-medium transition-colors"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            <span>Exit to Public Portal</span>
          </Link>
          <div className="text-[10px] text-slate-400 px-3">
            Mentor Connect • Faculty Portal
          </div>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Top Toolbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Roll Number Search with Autocomplete Dropdown */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Global roll-number search (e.g. 5401, Bhavya)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full h-9 pl-9 pr-4 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all shadow-xs placeholder:text-slate-400"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

              {/* Instant Search Results Dropdown */}
              {searchFocused && searchQuery.trim() && (
                <div className="absolute top-11 inset-x-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1 max-h-72 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Matches in {isConfigured && !isDemo ? 'Verified Student Roster' : 'CSE-DS Cohort'} ({searchResults.length})
                  </div>
                  {searchResults.length > 0 ? (
                    searchResults.map((s) => (
                      <button
                        key={s.rollNumber}
                        type="button"
                        onClick={() => handleSelectStudent(s.rollNumber)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-purple-50 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={s.avatarUrl || undefined} alt={s.fullName} fallback={s.fullName} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{s.fullName}</p>
                            <p className="text-[10px] font-mono text-purple-700 font-semibold">
                              {s.rollNumber}{s.email ? ` • ${s.email}` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Open 360°
                        </Badge>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No matching students found by name, roll number, or email.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action: Open Mentor 360 */}
            <Link to="/admin/mentor360" className="hidden sm:inline-flex">
              <button
                type="button"
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-200 transition-colors flex items-center gap-1.5"
              >
                <Compass className="h-3.5 w-3.5 text-purple-700" />
                <span>Mentor 360°</span>
              </button>
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="View admin notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-1">
              <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs border border-purple-200 shadow-xs">
                SV
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900">J. Siddartha Varma</p>
                <p className="text-[10px] text-slate-500">Assistant Professor, CSE-DS</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Admin Notification Modal */}
      <Dialog
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Administrative Status & Onboarding Alerts"
        description="Current cohort onboarding status and administrative settings for CSE-DS."
      >
        <div className="space-y-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
            <span className="font-bold text-purple-900">Profile Editing Deadline:</span>
            <p className="text-purple-800">
              Active deadline is set for Tuesday, November 3, 2026 at 11:59:59 PM IST. Governed by PostgreSQL trigger.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
            <span className="font-bold text-indigo-900">Verified Student Roster:</span>
            <p className="text-indigo-800">
              {isConfigured && !isDemo
                ? `${realStudents.length} real students loaded from Supabase public.students.`
                : 'Verified roster initialized for onboarding and account activation.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900">Development Roadmap:</span>
            <p className="text-slate-700">
              Deferred and future features are categorized in the dedicated Development Roadmap workspace.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
