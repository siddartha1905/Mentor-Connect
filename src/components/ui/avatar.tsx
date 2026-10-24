import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps {
  src?: string
  alt: string
  fallback: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false)

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base font-semibold',
    xl: 'h-20 w-20 text-xl font-bold',
  }

  // Consistent pastel background based on fallback string
  const getPastelBg = (str: string) => {
    const pastels = [
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-amber-100 text-amber-800 border-amber-200',
    ]
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return pastels[Math.abs(hash) % pastels.length]
  }

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden border font-medium select-none shadow-xs',
        sizes[size],
        getPastelBg(fallback),
        className
      )}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}
