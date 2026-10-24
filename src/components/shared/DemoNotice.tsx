import * as React from 'react'
import { Info, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DemoNoticeProps {
  message?: string
  variant?: 'banner' | 'inline' | 'pill'
  className?: string
}

export const DemoNotice: React.FC<DemoNoticeProps> = ({
  message = 'Stage 1 Development Preview: All records shown are fictional demo data. Backend integration and live persistence will be connected in a later stage.',
  variant = 'banner',
  className,
}) => {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80',
          className
        )}
      >
        <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
        <span>Stage 1 Demo Preview</span>
      </span>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-600 border border-slate-200',
          className
        )}
      >
        <Info className="h-4 w-4 text-slate-400 shrink-0" />
        <span>{message}</span>
      </div>
    )
  }

  // Default: 'banner'
  return (
    <div
      className={cn(
        'flex items-start sm:items-center gap-2.5 p-3 rounded-2xl bg-amber-50/90 text-amber-900 border border-amber-200/90 text-xs shadow-xs',
        className
      )}
    >
      <div className="p-1 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1">
        <span className="font-semibold mr-1.5">Stage 1 Architecture Preview:</span>
        <span className="text-amber-800/90">{message}</span>
      </div>
    </div>
  )
}
