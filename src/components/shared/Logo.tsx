import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  inverted?: boolean
  showTagline?: boolean
  className?: string
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  inverted = false,
  showTagline = false,
  className,
}) => {
  const iconSizes = {
    sm: 'h-7 w-7 rounded-lg',
    md: 'h-9 w-9 rounded-xl',
    lg: 'h-12 w-12 rounded-2xl',
  }

  const textSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base font-bold tracking-tight',
    lg: 'text-xl font-extrabold tracking-tight',
  }

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      {/* Brand Icon SVG */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-teal-600 shadow-sm shadow-indigo-500/20 text-white',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3/4 w-3/4"
        >
          {/* Dual connected learning nodes and beacon */}
          <circle cx="23" cy="38" r="7" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="41" cy="24" r="8.5" fill="#FFFFFF" />
          <path
            d="M25 33 C 25 24, 38 34, 39 26"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M41 15 L43 21 L49 23 L43 25 L41 31 L39 25 L33 23 L39 21 Z"
            fill="#FBBF24"
            opacity="0.95"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={cn(
            textSizes[size],
            inverted ? 'text-white' : 'text-slate-900',
            'font-heading leading-tight'
          )}
        >
          MENTOR <span className="text-indigo-500">CONNECT</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              'text-[10px] font-medium tracking-wide uppercase',
              inverted ? 'text-slate-300' : 'text-slate-400'
            )}
          >
            Mentoring & Counselling Portal
          </span>
        )}
      </div>
    </div>
  )
}
