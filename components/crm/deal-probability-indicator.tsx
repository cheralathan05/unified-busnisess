'use client'

import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface DealProbabilityProps {
  probability: number // 0-100
  stage: string
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export function DealProbabilityIndicator({
  probability,
  stage,
  size = 'md',
  showPercentage = true,
  className,
}: DealProbabilityProps) {
  // Determine color based on probability
  const getColor = (prob: number) => {
    if (prob >= 75) return 'bg-success text-success'
    if (prob >= 50) return 'bg-primary text-primary'
    if (prob >= 25) return 'bg-warning text-warning'
    return 'bg-destructive text-destructive'
  }

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const getProbabilityLabel = (stage: string) => {
    const stageProbs: Record<string, number> = {
      'New': 10,
      'Contacted': 20,
      'Proposal': 50,
      'Negotiation': 75,
      'Won': 100,
      'Lost': 0,
    }
    return stageProbs[stage] || probability
  }

  const stageProbability = getProbabilityLabel(stage)

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Deal Probability</span>
        {showPercentage && (
          <span className="text-xs font-semibold text-foreground">{stageProbability}%</span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', getColor(stageProbability))}
          style={{ width: `${stageProbability}%` }}
        />
      </div>

      {/* Stage label */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Zap className="w-3 h-3" />
        Stage: <span className="font-medium text-foreground">{stage}</span>
      </div>
    </div>
  )
}
