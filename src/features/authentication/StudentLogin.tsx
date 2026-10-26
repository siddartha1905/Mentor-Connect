import * as React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Loader2, Info } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useAuth } from '@/app/providers/AuthContext'

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, resetPasswordForEmail } = useAuth()

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
      setErrorMessage('Please enter both your registered portal email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await signInWithPassword(email.trim(), password)
      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid email or password. Please try again.')
      } else {
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/student'
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-purple-100 selection:text-purple-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-block">
          <Link to="/" title="Mentor Connect Homepage">
            <Logo size="lg" showTagline />
          </Link>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Student Portal Login
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to access your personal mentoring space, profile, and progress records.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 sm:px-10 space-y-5">
          {/* Brief Invitation Instruction Notice */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-purple-900 text-xs flex items-start gap-2.5">
            <Info className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Please enter the <strong>invited college email address</strong> where you received your registration link to access your verified student record.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Portal Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="student@institution.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrorMessage(null)
                  }}
                  required
                  className="w-full h-10 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
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
                  Forgot Password?
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
                  className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
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
              disabled={loading}
              className="w-full mt-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>Faculty or Administrator? </span>
            <Link to="/login/admin" className="text-purple-700 font-semibold hover:underline">
              Switch to Faculty Login
            </Link>
          </div>
        </div>
      </div>

      {/* Account Activation & Forgot Password Dialog */}
      <Dialog
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false)
          setForgotSent(false)
        }}
        title="Student Password Recovery"
        description="Receive a secure link to reset your password or set up your initial account access."
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Reset Link Sent</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A secure password reset link has been dispatched to <strong>{forgotEmail}</strong>. Please check your inbox and click the link to set your password.
            </p>
            <Button
              type="button"
              variant="outline"
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
              label="Registered Portal Email"
              placeholder="student@institution.edu"
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
              <Button
                type="submit"
                disabled={forgotLoading}
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
