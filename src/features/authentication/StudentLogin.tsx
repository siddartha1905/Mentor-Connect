import * as React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck, Loader2 } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, resetPasswordForEmail, loginAsDemo, isConfigured, isDemoAllowed } = useAuth()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isForgotOpen, setIsForgotOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState('')
  const [forgotLoading, setForgotLoading] = React.useState(false)
  const [forgotSent, setForgotSent] = React.useState(false)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your college email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await signInWithPassword(email.trim(), password)
      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid email or password. Please try again.')
      } else {
        const from = (location.state as any)?.from?.pathname || '/student'
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    if (!isDemoAllowed) return
    loginAsDemo('student', '23L31A5401')
    navigate('/student', { replace: true })
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return

    setForgotLoading(true)
    try {
      const res = await resetPasswordForEmail(forgotEmail.trim())
      if (res.error) {
        setErrorMessage(res.error.message)
      } else {
        setForgotSent(true)
      }
    } finally {
      setForgotLoading(false)
    }
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
          {/* Direct Demo / Fast Access CTA (Visible in Development/Staging only) */}
          {isDemoAllowed && (
            <>
              <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Interactive Student Preview</span>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Explore the mobile-first student experience with preloaded CSE-Data Science 2nd-year profiles:
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDemoLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5"
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  Explore Student Demo (Aarav Sharma)
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                    Or Sign In With Supabase
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. aarav.23l31a5401@viit.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrorMessage(null)
                  }}
                  required
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
                    setErrorMessage(null)
                  }}
                  required
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

            <Button
              type="submit"
              variant="outline"
              disabled={loading}
              className="w-full mt-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying Credentials...
                </>
              ) : (
                'Sign In to Student Portal'
              )}
            </Button>
          </form>

          {isConfigured && (
            <div className="pt-1">
              <DemoNotice
                variant="inline"
                message="Connected to Supabase PostgreSQL. Authenticated student sessions will enforce isolation via RLS."
              />
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-500">
            <span>Faculty or Administrator? </span>
            <Link to="/login/admin" className="text-indigo-600 font-semibold hover:underline">
              Switch to Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false)
          setForgotSent(false)
        }}
        title="Reset Student Password"
        description="Receive a secure password recovery email via Supabase Auth."
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Recovery Link Dispatched</h4>
            <p className="text-xs text-slate-600">
              A password reset link has been dispatched to <strong>{forgotEmail}</strong>.
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
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <Input
              label="Registered College Email"
              placeholder="e.g. aarav.23l31a5401@viit.ac.in"
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
              <Button type="submit" variant="primary" size="sm" disabled={forgotLoading}>
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
