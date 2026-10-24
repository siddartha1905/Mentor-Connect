import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'

export const StudentLogin: React.FC = () => {
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
      setValidationError('Please enter your student email and password.')
      return
    }
    // Inform user of Stage 1 state
    setValidationError(
      'Live Supabase Auth is scheduled for Stage 2. Please click "Explore Student Demo" below to preview the student portal immediately.'
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
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Student Portal Login
        </h2>
        <p className="text-xs text-slate-500">
          Enter your college email or explore the interactive student preview
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 sm:px-10 space-y-6">
          {/* Direct Development Preview CTA */}
          <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Development Preview Mode</span>
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed">
              No login credentials required in Stage 1. Access the mobile-first student experience with complete fictional records:
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/student')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              Explore Student Demo
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
                College Email / Roll Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 23l31a5401@viit.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setValidationError(null)
                  }}
                  className="w-full h-10 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
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
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
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
                  className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
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
              message="Stage 1 frontend only. Real Supabase email authentication will be implemented in Stage 2."
            />
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            <span>Faculty or Administrator? </span>
            <Link to="/login/admin" className="text-indigo-600 font-semibold hover:underline">
              Switch to Admin Login
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
        title="Reset Student Password"
        description="Visual preview of future Supabase password recovery flow."
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Mock Recovery Link Sent</h4>
            <p className="text-xs text-slate-600">
              In production, a password reset email would be dispatched to <strong>{forgotEmail}</strong> via Supabase Auth.
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
              label="Registered College Email"
              placeholder="e.g. 23l31a5401@viit.ac.in"
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
                Send Mock Reset Link
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
