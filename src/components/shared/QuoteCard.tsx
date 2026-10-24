import * as React from 'react'
import { Sparkles, Quote } from 'lucide-react'
import { getDailyQuote } from '@/data/mock'
import { cn } from '@/lib/utils'

export interface QuoteCardProps {
  className?: string
  variant?: 'light' | 'lavender' | 'navy'
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  className,
  variant = 'lavender',
}) => {
  const quoteData = React.useMemo(() => getDailyQuote(), [])

  const variants = {
    lavender: 'bg-gradient-to-r from-purple-50/90 to-indigo-50/80 border-purple-200/80 text-purple-950',
    light: 'bg-white border-slate-200 text-slate-800 shadow-xs',
    navy: 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4.5 sm:p-5 transition-all',
        variants[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-xl shrink-0 mt-0.5',
            variant === 'navy'
              ? 'bg-indigo-900/60 text-indigo-400'
              : 'bg-white text-indigo-600 shadow-xs border border-purple-100'
          )}
        >
          <Quote className="h-4 w-4" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider',
                variant === 'navy' ? 'text-indigo-400' : 'text-indigo-700'
              )}
            >
              <Sparkles className="h-3 w-3" />
              Daily Focus: {quoteData.focus}
            </span>
          </div>

          <p
            className={cn(
              'text-sm sm:text-base font-medium italic leading-snug',
              variant === 'navy' ? 'text-slate-100' : 'text-slate-800'
            )}
          >
            “{quoteData.quote}”
          </p>

          <p
            className={cn(
              'text-xs font-semibold pt-1',
              variant === 'navy' ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            — {quoteData.author}
          </p>
        </div>
      </div>
    </div>
  )
}
