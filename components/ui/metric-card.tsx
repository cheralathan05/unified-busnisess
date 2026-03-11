import * as React from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

interface MetricCardProps extends React.ComponentProps<'div'> {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  variant?: 'default' | 'elevated' | 'gradient'
  status?: 'success' | 'warning' | 'destructive' | 'info'
  footer?: React.ReactNode
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      label,
      value,
      trend,
      trendLabel,
      icon,
      variant = 'default',
      status = 'info',
      footer,
      className,
      ...props
    },
    ref,
  ) => {
    const isPositiveTrend = trend !== undefined && trend >= 0

    const variantClass = {
      default: 'bg-card border border-border',
      elevated: 'card-elevated border-0',
      gradient: 'gradient-primary border-0 text-white',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-lg p-6 transition-smooth hover:shadow-elevation-2',
          variantClass[variant],
          className,
        )}
        {...props}
      >
        {/* Background glow effect for elevated cards */}
        {variant === 'elevated' && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        <div className="relative z-10">
          {/* Header with icon and label */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className={cn('text-sm font-medium mb-1', variant === 'gradient' ? 'text-white/90' : 'text-muted-foreground')}>
                {label}
              </p>
            </div>
            {icon && (
              <div className={cn('flex-shrink-0 ml-2', variant === 'gradient' ? 'text-white/80' : 'text-primary/60 group-hover:text-primary transition-colors')}>
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-3">
            <div className={cn('text-2xl sm:text-3xl font-bold tracking-tight', variant === 'gradient' ? 'text-white' : 'text-foreground')}>
              {value}
            </div>
          </div>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
                isPositiveTrend
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive',
              )}>
                {isPositiveTrend ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
              {trendLabel && (
                <span className={cn('text-xs', variant === 'gradient' ? 'text-white/70' : 'text-muted-foreground')}>
                  {trendLabel}
                </span>
              )}
            </div>
          )}

          {/* Footer content */}
          {footer && (
            <div className={cn('text-xs border-t pt-3', variant === 'gradient' ? 'border-white/20 text-white/70' : 'border-border text-muted-foreground')}>
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  },
)

MetricCard.displayName = 'MetricCard'

export { MetricCard }
