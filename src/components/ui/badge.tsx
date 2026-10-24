import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'approved'
    | 'pending'
    | 'changes'
    | 'rejected'
    | 'locked'
    | 'draft'
    | 'high'
    | 'medium'
    | 'low'
    | 'outline'
    | 'good'
    | 'warning'
    | 'critical'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors'

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    // Status badges
    approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    changes: 'bg-orange-100 text-orange-800 border border-orange-200',
    rejected: 'bg-rose-100 text-rose-800 border border-rose-200',
    locked: 'bg-slate-200 text-slate-800 border border-slate-300',
    draft: 'bg-purple-100 text-purple-800 border border-purple-200',
    // Priority badges
    high: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
    medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    low: 'bg-blue-100 text-blue-800 border border-blue-200',
    // Attendance / Health
    good: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    critical: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
  }

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
