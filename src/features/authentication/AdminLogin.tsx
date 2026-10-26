import * as React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Shield, Loader2 } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { DemoNotice } from '@/components/shared/DemoNotice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useAuth } from '@/app/providers/AuthContext'

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, signUp, resetPasswordForEmail, loginAsDemo, isConfigured, isDemoAllowed } = useAuth()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isForgotOpen, setIsForgotOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState('')
  const [forgotLoading, setForgotLoading] = React.useState(false)
  const [forgotSent, setForgotSent] = React.useState(false)

  // Administrator Account Registration Modal
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  const [regEmail, setRegEmail] = React.useState('')
  const [regPassword, setRegPassword] = React.useState('')
  const [regLoading, setRegLoading] = React.useState(false)
  const [regSuccess, setRegSuccess] = React.useState(false)
  const [regError, setRegError] = React.useState<string | null>(null)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both faculty email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await signInWithPassword(email.trim(), password)
      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid credentials. Please verify your faculty email and password.')
      } else {
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin'
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    if (!isDemoAllowed) return
    loginAsDemo('admin')
    navigate('/admin', { replace: true })
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)

    if (!regEmail.trim() || !regPassword.trim()) {
      setRegError('Please provide institutional email and password.')
      return
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.')
      return
    }

    setRegLoading(true)
    try {
      const res = await signUp(regEmail.trim(), regPassword)
      if (res.error) {
        setRegError(res.error.message)
      } else {
        setRegSuccess(true)
      }
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setRegLoading(false)
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
          {/* Direct Development Preview CTA (Visible in Development/Staging only) */}
          {isDemoAllowed && (
            <>
              <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                  <Sparkles className="h-4 w-4 text-purple-700" />
                  <span>Interactive Faculty Preview</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  Experience the desktop faculty dashboard, Mentor 360°, student list, and approval centre immediately:
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDemoLogin}
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
                Faculty Institutional Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. mentor.cseds@viit.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrorMessage(null)
                  }}
                  required
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
                    setErrorMessage(null)
                  }}
                  required
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

            <Button
              type="submit"
              variant="outline"
              disabled={loading}
              className="w-full mt-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying Faculty Access...
                </>
              ) : (
                'Sign In to Mentor Workspace'
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex flex-col gap-2">
            <div>
              <span>First time faculty administrator? </span>
              <button
                type="button"
                onClick={() => {
                  setRegSuccess(false)
                  setRegError(null)
                  setIsRegisterOpen(true)
                }}
                className="text-purple-700 font-bold hover:underline"
              >
                Create Administrator Account
              </button>
            </div>
            <div>
              <span>Student mentee? </span>
              <Link to="/login/student" className="text-purple-700 font-semibold hover:underline">
                Switch to Student Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Administrator Registration Dialog */}
      <Dialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Create Administrator Account"
        description="Provision an administrative user in Supabase Auth. Elevation to admin requires explicit database assignment."
      >
        {regSuccess ? (
          <div className="space-y-3 py-2 text-xs">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-center text-base">Account Created in Supabase Auth</h4>
            <p className="text-slate-600 text-center">
              Your authentication credentials for <strong>{regEmail}</strong> have been created.
            </p>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 space-y-1.5">
              <span className="font-bold block">Final Step — Assign Administrator Role in PostgreSQL:</span>
              <p className="text-[11px] text-slate-600">
                In Supabase Dashboard SQL Editor for project <code>mttocnlnmmtaugzthfih</code>, run:
              </p>
              <pre className="p-2 bg-slate-900 text-purple-200 rounded-lg text-[10px] overflow-x-auto select-all font-mono">
{`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = '${regEmail}'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';`}
              </pre>
            </div>
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsRegisterOpen(false)
                  setEmail(regEmail)
                }}
                className="bg-purple-700 hover:bg-purple-800"
              >
                Done — Return to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {regError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                {regError}
              </div>
            )}
            <Input
              label="Faculty Institutional Email"
              type="email"
              placeholder="e.g. mentor.cseds@viit.ac.in"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
            <Input
              label="Password (min 8 characters)"
              type="password"
              placeholder="••••••••"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
              minLength={8}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsRegisterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={regLoading} className="bg-purple-700 hover:bg-purple-800">
                {regLoading ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false)
          setForgotSent(false)
        }}
        title="Faculty Password Recovery"
        description="Receive an institutional password recovery email."
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Recovery Link Sent</h4>
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
