import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'pastel-lavender' | 'pastel-mint' | 'pastel-blue'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
      outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs',
      ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200',
      'pastel-lavender': 'bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-200',
      'pastel-mint': 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-200',
      'pastel-blue': 'bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-200',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5 font-semibold',
      icon: 'h-9 w-9 p-0 rounded-lg justify-center',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
