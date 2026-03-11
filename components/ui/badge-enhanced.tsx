'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'soft' | 'solid' | 'outline'
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  onRemove?: () => void
  className?: string
}

export function Badge({
  children,
  variant = 'soft',
  color = 'primary',
  size = 'sm',
  icon,
  onRemove,
  className,
}: BadgeProps) {
  const getColorClasses = (color: string, variant: string) => {
    const colorMap: Record<string, Record<string, string>> = {
      primary: {
        soft: 'bg-primary/10 text-primary',
        solid: 'bg-primary text-primary-foreground',
        outline: 'border border-primary/50 text-primary',
      },
      success: {
        soft: 'bg-success/10 text-success',
        solid: 'bg-success text-success-foreground',
        outline: 'border border-success/50 text-success',
      },
      warning: {
        soft: 'bg-warning/10 text-warning',
        solid: 'bg-warning text-warning-foreground',
        outline: 'border border-warning/50 text-warning',
      },
      destructive: {
        soft: 'bg-destructive/10 text-destructive',
        solid: 'bg-destructive text-destructive-foreground',
        outline: 'border border-destructive/50 text-destructive',
      },
      info: {
        soft: 'bg-info/10 text-info',
        solid: 'bg-info text-info-foreground',
        outline: 'border border-info/50 text-info',
      },
    }
    return colorMap[color]?.[variant] || colorMap.primary[variant]
  }

  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        getColorClasses(color, variant),
        sizeClasses,
        onRemove && 'pr-1.5',
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export function BadgeGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  )
}
