import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Shield } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [isForgotOpen, setIsForgotOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState('')
  const [forgotSent, setForgotSent] = React.useState(false)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setValidationError('Please enter your faculty/admin credentials.')
      return
    }
    setValidationError(
      'Live Supabase Auth is scheduled for Stage 2. Please click "Explore Admin Demo" below to launch the faculty dashboard preview immediately.'
    )
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSent(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-block">
          <Link to="/">
            <Logo size="lg" showTagline />
          </Link>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-semibold">
          <Shield className="h-3.5 w-3.5 text-purple-700" />
          <span>Faculty & Administrator Workspace</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Mentor Portal Sign In
        </h2>
        <p className="text-xs text-slate-500">
          Faculty management console for CSE-DS second-year mentorship
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 sm:px-10 space-y-6">
          {/* Direct Development Preview CTA */}
          <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
              <Sparkles className="h-4 w-4 text-purple-700" />
              <span>Development Preview Mode</span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              Experience the desktop-optimized faculty dashboard, Mentor 360°, attendance discrepancy tracker, and approval centre:
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/admin')}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs py-2.5 shadow-md shadow-purple-200"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Explore Admin Demo
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or Visual Sign In Flow
              </span>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {validationError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                {validationError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Faculty Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. mentor.cseds@viit.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setValidationError(null)
                  }}
                  className="w-full h-10 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs text-purple-700 hover:text-purple-900 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setValidationError(null)
                  }}
                  className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="outline" className="w-full mt-2">
              Sign In (Visual Mock)
            </Button>
          </form>

          <div className="pt-2">
            <DemoNotice
              variant="inline"
              message="Stage 1 frontend preview. In Stage 2, Supabase Auth will enforce role-based access for faculty mentors."
            />
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            <span>Student mentee? </span>
            <Link to="/login/student" className="text-purple-700 font-semibold hover:underline">
              Switch to Student Login
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Visual Dialog */}
      <Dialog
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false)
          setForgotSent(false)
        }}
        title="Faculty Password Recovery"
        description="Visual preview of administrative password recovery."
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Recovery Dispatch Queued</h4>
            <p className="text-xs text-slate-600">
              In production, an institutional password reset token will be issued to <strong>{forgotEmail}</strong>.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setIsForgotOpen(false)
                setForgotSent(false)
              }}
              className="mt-2"
            >
              Close Preview
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <Input
              label="Institutional Email"
              placeholder="e.g. mentor.cseds@viit.ac.in"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
