import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'pills' | 'underline' | 'chips'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 overflow-x-auto no-scrollbar py-1',
        variant === 'pills' && 'bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60',
        variant === 'underline' && 'border-b border-slate-200 gap-6',
        variant === 'chips' && 'gap-2 flex-wrap',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 pb-3 pt-1 text-sm font-semibold transition-all border-b-2 whitespace-nowrap',
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}
            >
              {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600')}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        }

        if (variant === 'chips') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap',
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {tab.icon && <span className="h-3.5 w-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full', isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600')}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        }

        // Default: 'pills'
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
              isActive
                ? 'bg-white text-indigo-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            )}
          >
            {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200/80 text-slate-600')}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
