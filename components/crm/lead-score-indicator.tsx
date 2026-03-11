'use client'

import { cn } from '@/lib/utils'
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react'

interface LeadScoreIndicatorProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function LeadScoreIndicator({
  score,
  size = 'md',
  showLabel = true,
  className,
}: LeadScoreIndicatorProps) {
  // Determine score quality
  const quality = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  }

  const colorClasses = {
    excellent: 'bg-success/20 text-success border border-success/50',
    good: 'bg-primary/20 text-primary border border-primary/50',
    fair: 'bg-warning/20 text-warning border border-warning/50',
    poor: 'bg-destructive/20 text-destructive border border-destructive/50',
  }

  const qualityLabels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  }

  const icon = {
    excellent: <Trophy className={size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />,
    good: <TrendingUp className={size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />,
    fair: <AlertCircle className={size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />,
    poor: <AlertCircle className={size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />,
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold',
          sizeClasses[size],
          colorClasses[quality],
        )}
        title={`Lead Score: ${score}/100`}
      >
        {icon[quality]}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">{qualityLabels[quality]}</span>
        </div>
      )}
    </div>
  )
}
