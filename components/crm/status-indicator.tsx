'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface StatusIndicatorProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'New': { color: 'text-info', bg: 'bg-info/10', label: 'New' },
  'Contacted': { color: 'text-primary', bg: 'bg-primary/10', label: 'Contacted' },
  'Qualified': { color: 'text-success', bg: 'bg-success/10', label: 'Qualified' },
  'Proposal': { color: 'text-warning', bg: 'bg-warning/10', label: 'Proposal' },
  'Negotiation': { color: 'text-primary', bg: 'bg-primary/10', label: 'Negotiation' },
  'Won': { color: 'text-success', bg: 'bg-success/10', label: 'Won' },
  'Lost': { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Lost' },
  'online': { color: 'text-success', bg: 'bg-success', label: 'Online' },
  'offline': { color: 'text-destructive', bg: 'bg-destructive', label: 'Offline' },
  'idle': { color: 'text-warning', bg: 'bg-warning', label: 'Idle' },
}

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
  animated = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig['New']

  const sizeClasses: Record<string, string> = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          config.bg.replace('bg-', '').replace('/10', ''),
          animated && 'animate-pulse',
          className,
        )}
        style={
          animated
            ? {
                background: config.color.replace('text-', ''),
                boxShadow: `0 0 8px currentColor`,
              }
            : {}
        }
      />
      {showLabel && (
        <span className={cn('text-xs font-semibold', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['New']

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
        config.bg,
        config.color,
        className,
      )}
    >
      <div className="w-2 h-2 rounded-full bg-current opacity-60" />
      {config.label}
    </div>
  )
}
