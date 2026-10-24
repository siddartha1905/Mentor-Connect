import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from '@/app/providers/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Checking authorization...</p>
        </div>
      </div>
    )
  }

  // If role is guest / not authorized
  if (!allowedRoles.includes(role)) {
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/login/admin" state={{ from: location }} replace />
    }
    return <Navigate to="/login/student" state={{ from: location }} replace />
  }

  return <>{children}</>
}
