import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  LogIn,
  UserCheck,
  Compass,
  ShieldCheck,
  Download,
  Moon,
  Sun,
  Clock,
  Sparkles,
  Share2,
  PlusSquare,
  X,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import {
  MOTIVATIONAL_THOUGHTS,
  getCurrentThoughtIndex,
  type ThoughtItem,
} from './thoughtsData'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function formatIST(date: Date): string {
  try {
    const dayDate = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date)

    const time = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)

    return `${dayDate} • ${time} IST`
  } catch {
    return date.toLocaleTimeString()
  }
}

const CURRENT_YEAR = new Date().getFullYear()

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  // --- IST Date & Time (Updated live) ---
  const [istTime, setIstTime] = React.useState<string>(() => formatIST(new Date()))

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(formatIST(new Date()))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // --- Rotating Thought for Today (Every 10 minutes) ---
  const [thoughtIndex, setThoughtIndex] = React.useState<number>(() =>
    getCurrentThoughtIndex(MOTIVATIONAL_THOUGHTS.length)
  )
  const [isFading, setIsFading] = React.useState<boolean>(false)

  const currentThought: ThoughtItem =
    MOTIVATIONAL_THOUGHTS[thoughtIndex] ?? MOTIVATIONAL_THOUGHTS[0]

  React.useEffect(() => {
    // Check every 10 seconds for 10-minute clock boundary rollover
    const timer = setInterval(() => {
      const nextIdx = getCurrentThoughtIndex(MOTIVATIONAL_THOUGHTS.length)
      if (nextIdx !== thoughtIndex) {
        setIsFading(true)
        setTimeout(() => {
          setThoughtIndex(nextIdx)
          setIsFading(false)
        }, 350)
      }
    }, 10000)
    return () => clearInterval(timer)
  }, [thoughtIndex])

  const handleNextThought = () => {
    setIsFading(true)
    setTimeout(() => {
      setThoughtIndex((prev) => (prev + 1) % MOTIVATIONAL_THOUGHTS.length)
      setIsFading(false)
    }, 250)
  }

  // --- PWA Installation Handling ---
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallModal, setShowInstallModal] = React.useState<boolean>(false)

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null)
          return
        }
      } catch {
        setShowInstallModal(true)
        return
      }
    }
    setShowInstallModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-purple-200 selection:text-purple-900 transition-colors duration-300">
      {/* ------------------------------------------------------------- */}
      {/* HEADER SECTION                                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 shadow-xs transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <Logo size="md" showTagline />
            </div>

            {/* Right: Controls & Logins */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* IST Date & Time Display (Desktop) */}
              <div
                className="hidden xl:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-purple-50/70 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-purple-100 dark:border-slate-700 select-none"
                title="Current Indian Standard Time (IST)"
              >
                <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span>{istTime}</span>
              </div>

              {/* Install App Control */}
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-colors shadow-2xs"
                title="Install Mentor Connect PWA"
              >
                <Download className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>

              {/* Light / Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 text-slate-700" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-400" />
                )}
              </button>

              {/* Navigation Logins: Clean, single instance across all screens */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/login/student">
                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9 shadow-xs"
                  >
                    <span className="sr-only">Student Sign In</span>
                    <span>Student Login</span>
                  </Button>
                </Link>

                <Link to="/login/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-200 dark:border-slate-700 text-purple-950 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                  >
                    <span className="sr-only">Admin Sign In</span>
                    <span>Faculty Login</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT                                                  */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col">
        {/* HERO SECTION WITH ABSTRACT SOFT-LAVENDER WAVES */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-purple-100/70 dark:border-slate-800/80">
          {/* Lightweight Abstract Vector Wave Background */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
            <svg
              className="absolute w-full h-full object-cover opacity-70 dark:opacity-20 transition-opacity duration-300"
              viewBox="0 0 1440 640"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="softLavenderWaveA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FAF5FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="softLavenderWaveB" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#F3E8FF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M0,140 C320,280, 480,60, 800,160 C1120,260, 1280,110, 1440,180 L1440,0 L0,0 Z"
                fill="url(#softLavenderWaveA)"
              />
              <path
                d="M0,260 C260,110, 540,320, 880,190 C1200,70, 1340,270, 1440,220 L1440,0 L0,0 Z"
                fill="url(#softLavenderWaveB)"
              />
            </svg>

            {/* Ambient soft glow orb */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-purple-200/40 dark:bg-purple-900/15 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            {/* Tagline / Subtitle Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/80 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 text-xs font-semibold border border-purple-200 dark:border-purple-800/80 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Dedicated Faculty Mentoring Space</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              A place to share. A path to grow.
            </h1>

            {/* Short Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Mentor Connect is a dedicated space for students and their faculty mentor to stay connected, share progress, discuss challenges, and work towards personal and academic growth.
            </p>

            {/* --------------------------------------------------------- */}
            {/* A THOUGHT FOR TODAY (Rotating every 10 minutes)          */}
            {/* --------------------------------------------------------- */}
            <div className="pt-8 max-w-xl mx-auto">
              <div className="relative p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-100 dark:border-slate-800 shadow-sm text-left transition-all duration-300">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      A Thought for Today
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                      {currentThought.theme}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextThought}
                      className="text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 p-1 rounded-md hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                      title="Next thought"
                      aria-label="Next thought"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div
                  className={`transition-opacity duration-500 ${
                    isFading ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
                    "{currentThought.text}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* SECOND SECTION: A Simple Way to Stay Connected                */}
        {/* ------------------------------------------------------------- */}
        <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/60 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                A Simple Way to Stay Connected
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                A focused collaboration between students and their faculty mentor throughout the semester.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {/* Step 1: Sign In */}
              <div className="group relative p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-purple-100/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all duration-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    <LogIn className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-purple-400 dark:text-purple-600">
                    01
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sign In
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Access your personal mentoring space.
                </p>
              </div>

              {/* Step 2: Share Your Progress */}
              <div className="group relative p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-purple-100/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all duration-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-purple-400 dark:text-purple-600">
                    02
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Share Your Progress
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Maintain your profile, skills, goals and achievements.
                </p>
              </div>

              {/* Step 3: Grow With Guidance */}
              <div className="group relative p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-purple-100/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all duration-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    <Compass className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-purple-400 dark:text-purple-600">
                    03
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Grow With Guidance
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Help your faculty mentor understand your progress and support your development.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* PRIVACY INFORMATION SECTION                                   */}
        {/* ------------------------------------------------------------- */}
        <section className="py-12 bg-slate-50 dark:bg-slate-950 border-t border-purple-100/60 dark:border-slate-800/80 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Your Information, Handled with Care
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Student profiles are managed through authenticated access and role-based permissions. Personal student information is not publicly displayed.
            </p>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER AND CREATOR ATTRIBUTION                                */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-600 dark:text-slate-400 text-xs">
                Faculty Mentoring Portal
              </span>
            </div>

            <div className="flex items-center gap-6 text-slate-600 dark:text-slate-300">
              <Link
                to="/login/student"
                className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                Student Portal
              </Link>
              <Link
                to="/login/admin"
                className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                Faculty Portal
              </Link>
            </div>
          </div>

          <div className="text-center space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Created and maintained by J. Siddhartha Varma
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assistant Professor, CSE (Data Science)
              <span className="sr-only">CSE-Data Science Mentee Group</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-md mx-auto italic leading-normal">
              An independent faculty mentoring initiative for invited students. Not an officially endorsed institutional portal.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2">
              © {CURRENT_YEAR} Mentor Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* INSTALL APP MODAL (Accessible on click)                       */}
      {/* ------------------------------------------------------------- */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-purple-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span>Install Mentor Connect</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Add Mentor Connect to your home screen or desktop for fast, one-tap access:
            </p>

            <div className="space-y-3 text-xs">
              {/* iPhone / iPad */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-slate-800/60 border border-purple-100/80 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>iPhone & iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1">
                  <li>Tap the <strong>Share</strong> button in Safari's bottom toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>

              {/* Android / Chrome */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <PlusSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Android & Desktop (Chrome / Edge)</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1">
                  <li>Tap the browser menu (<strong>⋮</strong> or <strong>⋯</strong> in the top corner).</li>
                  <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <span>Origin: {typeof window !== 'undefined' ? window.location.origin : 'Localhost'}</span>
              <Button
                size="sm"
                onClick={() => setShowInstallModal(false)}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-4"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
