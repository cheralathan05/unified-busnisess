'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface KPICardProps {
  icon?: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  status?: 'online' | 'offline' | 'idle'
  onClick?: () => void
  className?: string
  trend?: {
    value: number
    label: string
  }
}

export function KPICardNew({
  icon,
  label,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  status,
  onClick,
  className,
  trend,
}: KPICardProps) {
  const getTrendColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-success bg-success/10'
      case 'negative':
        return 'text-destructive bg-destructive/10'
      default:
        return 'text-muted-foreground bg-muted/10'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-success'
      case 'offline':
        return 'bg-destructive'
      case 'idle':
        return 'bg-warning'
      default:
        return ''
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300',
        'hover:border-primary/50 hover:shadow-elevation-2 hover:bg-card-elevated',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/60">{subtitle}</p>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div className="flex-shrink-0 ml-2 p-2 rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary/20">
              {typeof icon === 'string' ? (
                <span className="text-lg">{icon}</span>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center">
                  {icon}
                </div>
              )}
            </div>
          )}

          {/* Status indicator */}
          {status && (
            <div className={cn('absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse', getStatusColor(status))} />
          )}
        </div>

        {/* Value section */}
        <div className="mb-4">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {value}
          </div>
        </div>

        {/* Footer with trend */}
        {(trend || change !== undefined) && (
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            {trend && (
              <div className="flex items-center gap-1">
                {change !== undefined && change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : change !== undefined && change < 0 ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Activity className="w-4 h-4 text-muted-foreground" />
                )}
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-md', getTrendColor(changeType))}>
                    {change !== undefined ? (
                      <>
                        {change > 0 ? '+' : ''}{change}%
                      </>
                    ) : (
                      <>{trend.value}%</>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {trend.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
