'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import React from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  icon?: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'flat'
  gradient?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'elevated',
  gradient = false,
  size = 'md',
  onClick,
  className,
  children,
}: MetricCardProps) {
  const baseClasses =
    'relative group rounded-xl border transition-all duration-300 overflow-hidden'

  const variantClasses: Record<string, string> = {
    elevated: 'bg-card-elevated border-border hover:shadow-elevation-2 hover:border-primary/30',
    outlined:
      'bg-background border-border/50 hover:border-primary/50 hover:bg-card/50',
    flat: 'bg-card border-transparent hover:border-primary/20 hover:bg-card-elevated',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* Gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/60 mt-1">{subtitle}</p>
            )}
          </div>

          {icon && (
            <div className="flex-shrink-0 ml-3 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <div className="w-5 h-5 flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-4">
          <div className={cn(
            'font-bold tracking-tight text-foreground',
            size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-3xl' : 'text-4xl'
          )}>
            {value}
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1">
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : (
                <div className="w-4 h-4" />
              )}
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-1 rounded-md',
                  trend.direction === 'up'
                    ? 'bg-success/10 text-success'
                    : trend.direction === 'down'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted/10 text-muted-foreground',
                )}
              >
                {trend.direction === 'up' ? '+' : ''}{trend.value}%
              </span>
            </div>
            {trend.label && (
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}

        {/* Children slot */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}

/* Grid container for metric cards */
export function MetricGrid({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}) {
  const colClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        colClasses[cols],
        className,
      )}
    >
      {children}
    </div>
  )
}
