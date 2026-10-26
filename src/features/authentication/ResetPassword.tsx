import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/AuthContext'

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const { updatePassword, role, isConfigured } = useAuth()

  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter both carefully.')
      return
    }

    setLoading(true)
    try {
      if (isConfigured) {
        const { error } = await updatePassword(password)
        if (error) {
          setErrorMessage(error.message || 'Unable to update password. Your invitation link may have expired.')
          return
        }
      }

      setSuccess(true)
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/student/profile', { replace: true })
        }
      }, 1500)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
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
          Set Your Password
        </h2>
        <p className="text-xs text-slate-500">
          Create a secure password to activate your Mentor Connect account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 sm:px-10 space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Password Saved Successfully</h3>
              <p className="text-xs text-slate-600">
                Your credentials have been securely stored. Redirecting you to your portal...
              </p>
              <div className="flex items-center justify-center pt-2">
                <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium leading-relaxed flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrorMessage(null)
                    }}
                    required
                    minLength={8}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrorMessage(null)
                    }}
                    required
                    minLength={8}
                    className="w-full h-10 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700 block">Security requirements:</span>
                <p>• Minimum 8 characters in length</p>
                <p>• Unique institutional password (do not reuse personal passwords)</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving Password...
                  </>
                ) : (
                  <>
                    <span>Set Password & Proceed</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-500">
            <Link to="/login/student" className="text-indigo-600 font-semibold hover:underline">
              Back to Student Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
