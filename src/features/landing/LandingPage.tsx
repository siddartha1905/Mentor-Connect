import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronRight,
  User,
  ShieldAlert,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { QuoteCard } from '@/components/shared/QuoteCard'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Button } from '@/components/ui/button'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" showTagline />

          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link to="/login/student">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Student Sign In
              </Button>
            </Link>
            <Link to="/login/admin">
              <Button variant="ghost" size="sm" className="text-slate-600">
                Admin Sign In
              </Button>
            </Link>
            <Link to="/student">
              <Button variant="primary" size="sm">
                Student Demo
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Abstract Tech Canvas */}
      <section className="relative overflow-hidden bg-radial from-[#111C36] via-[#1E1B4B] to-[#0A0F1D] text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Abstract SVG / CSS Graphic Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1000 700">
            <defs>
              <linearGradient id="blobGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="blobGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M150,200 Q400,50 650,220 T950,260 L950,700 L0,700 Z" fill="url(#blobGrad1)" />
            <circle cx="850" cy="180" r="220" fill="url(#blobGrad2)" />
            <circle cx="120" cy="150" r="140" fill="#4338CA" fillOpacity="0.25" filter="blur(40px)" />
            <path d="M-50,450 C200,350 450,550 750,400 T1100,480" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.4" />
          </svg>
          <div className="absolute inset-0 tech-grid-pattern opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>CSE-Data Science Mentorship Initiative</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Your journey. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-teal-300">
                  Your growth.
                </span>{' '}
                <br />
                Your future.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                A personal space to connect with your mentor, strengthen your skills, overcome academic challenges, and make steady, measurable progress toward your engineering goals.
              </p>

              {/* Demo Quick Entry Cards */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link to="/student" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
                  >
                    <User className="h-4 w-4" />
                    <span>View Student Demo</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>

                <Link to="/admin" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>View Admin Demo</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Development Preview Indicator */}
              <div className="pt-2">
                <DemoNotice
                  variant="banner"
                  className="bg-white/10 text-slate-200 border-white/15 backdrop-blur-md"
                  message="Stage 1 Frontend Foundation. Fictional demo records for CSE-DS 2nd year. No backend authentication required."
                />
              </div>
            </div>

            {/* Right Column: Daily Quote & Live Portal Preview Card */}
            <div className="lg:col-span-5 space-y-4">
              <QuoteCard variant="navy" />

              {/* Quick Workflow Pill */}
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    Mentoring Cycle
                  </span>
                  <span className="text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                    Sem 2-1 Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Background Review</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Weekly Dialogue</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-300" />
                    <span>Action Commitments</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" />
                    <span>Progress Tracking</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-slate-300">
                    Designed for 35–40 CSE-DS Students at Vignan IIT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1: About Mentor Connect */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Personalized Mentorship
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              A purposeful space designed around your engineering ambitions
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Mentor Connect bridges the gap between daily academic challenges and long-term career readiness through structured 1-on-1 dialogue and transparent progress tracking.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-purple-200/80 text-purple-800 flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900">Academic Stewardship</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Track internal test scores (WT1–WT4, Mid assessments), identify subject-level doubts early, and formulate concrete backlog resolution schedules.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-blue-200/80 text-blue-800 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900">Personal & Welfare Guidance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Address travel strain, hostel life, exam stress, and health issues in strict confidentiality with your faculty mentor.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900">Career & Skill Evolution</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Align your technical roadmap with Data Science competencies: machine learning projects, certifications, hackathons, and higher studies prep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: How It Works — The Core Workflow */}
      <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              The Mentoring Cycle
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              A systematic 7-step loop ensuring no mentee falls through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            {[
              { step: '01', title: 'Search Student', desc: 'Instant roll-number lookup' },
              { step: '02', title: 'Understand Context', desc: 'Family, residence & background' },
              { step: '03', title: 'Review History', desc: 'Prior discussions & notes' },
              { step: '04', title: 'Conduct Mentoring', desc: '1-on-1 focused dialogue' },
              { step: '05', title: 'Record Commitments', desc: 'Due dates & task owners' },
              { step: '06', title: 'Follow Up', desc: 'Scheduled calendar check-ins' },
              { step: '07', title: 'Evaluate Progress', desc: 'Counselling reports' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-between hover:border-indigo-300 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">
                  {item.step}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-snug mb-1">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Daily Check-in & Privacy Assurance */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Daily Check-in Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                <span>Daily Attendance Check-in Schedule</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                10:30 AM IST Morning Pulse
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mondays through Saturdays (excluding institutional holidays), mentees submit a quick morning self-check regarding lecture readiness, commute conditions, and immediate questions.
              </p>
              <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-indigo-900">Sample Check-in Prompt:</span>
                <p className="italic text-slate-500">
                  “Are you present in college today? Do you need mentor support on upcoming WT-2 marks or DSA practicals?”
                </p>
              </div>
            </div>

            {/* Privacy Notice Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold">
                <Lock className="h-3.5 w-3.5" />
                <span>Confidentiality Safeguards</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Protected Mentoring Boundaries
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mentor Connect enforces strict visual and architectural boundaries between mentor-only confidential counselling notes and student-visible suggestions. Student-to-student private chat is disabled by default.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Mentor Confidential</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-medium">Student Visible Advice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Professional Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <Logo size="sm" inverted />
              <p className="text-slate-400 text-xs leading-relaxed">
                Personal mentoring, counselling and progress tracking platform for second-year CSE-Data Science students.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block">
                Quick Navigation
              </span>
              <ul className="space-y-1.5">
                <li><Link to="/login/student" className="hover:text-white transition-colors">Student Login</Link></li>
                <li><Link to="/login/admin" className="hover:text-white transition-colors">Admin Login</Link></li>
                <li><Link to="/student" className="hover:text-white transition-colors">Student Mobile PWA Demo</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Admin Dashboard Demo</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block">
                Core Modules
              </span>
              <ul className="space-y-1.5">
                <li><Link to="/admin/mentor360" className="hover:text-white transition-colors">Mentor 360° View</Link></li>
                <li><Link to="/admin/attendance" className="hover:text-white transition-colors">Attendance Tracking</Link></li>
                <li><Link to="/admin/approvals" className="hover:text-white transition-colors">Approval Centre</Link></li>
                <li><Link to="/admin/automation" className="hover:text-white transition-colors">Automated Mentor Shell</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px] block">
                Disclaimer Notice
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed flex items-start gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Mentor Connect is an independent faculty mentoring initiative. It is not an officially endorsed institutional ERP system. Stage 1 preview data is entirely fictional.
                </span>
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} Mentor Connect — CSE-DS Mentoring Initiative. All rights reserved.</p>
            <p>Stage 1 Release: Architecture & UI/UX Foundation</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
