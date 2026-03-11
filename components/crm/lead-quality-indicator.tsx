'use client'

import { Lead } from '@/hooks/use-app-state'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface LeadQualityIndicatorProps {
  lead: Lead
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LeadQualityIndicator({
  lead,
  showScore = true,
  size = 'md',
  className,
}: LeadQualityIndicatorProps) {
  // Calculate quality score based on lead properties
  const calculateScore = (): number => {
    let score = 0

    // Deal value (0-30 points)
    if (lead.dealValue > 100000) score += 30
    else if (lead.dealValue > 50000) score += 20
    else if (lead.dealValue > 10000) score += 10

    // Status progression (0-30 points)
    const statusScore: Record<string, number> = {
      'New': 5,
      'Contacted': 10,
      'Proposal': 20,
      'Negotiation': 25,
      'Won': 30,
      'Lost': 0,
    }
    score += statusScore[lead.status] || 0

    // Notes/engagement (0-20 points)
    if (lead.notes && lead.notes.length > 0) score += 10

    // Company presence (0-20 points)
    if (lead.company && lead.company.length > 0) score += 10

    return Math.min(score, 100)
  }

  const score = calculateScore()
  const quality = score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold'
  const qualityColor = score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-muted-foreground'
  const qualityBg = score >= 75 ? 'bg-success/10' : score >= 50 ? 'bg-warning/10' : 'bg-muted/10'

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold relative',
          sizeClasses[size],
          qualityBg,
          qualityColor,
        )}
      >
        {score}
        <div
          className="absolute inset-0 rounded-full opacity-30 animate-pulse"
          style={{
            background: `conic-gradient(#22c55e 0deg, #22c55e ${score * 3.6}deg, transparent ${score * 3.6}deg)`,
          }}
        />
      </div>
      {showScore && (
        <div className="mt-2 text-center">
          <p className={cn('text-xs font-semibold', qualityColor)}>
            {quality} Lead
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-center">
            <Sparkles className="w-3 h-3" />
            Score: {score}
          </p>
        </div>
      )}
    </div>
  )
}

// Inline version for table/list view
export function LeadQualityBadge({ lead }: { lead: Lead }) {
  const score = Math.min(
    (lead.dealValue > 50000 ? 30 : 10) +
    (['Proposal', 'Negotiation', 'Won'].includes(lead.status) ? 20 : 10) +
    (lead.notes ? 10 : 0) +
    (lead.company ? 10 : 0),
    100,
  )

  const quality = score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold'
  const colors = {
    Hot: 'bg-success/10 text-success',
    Warm: 'bg-warning/10 text-warning',
    Cold: 'bg-muted/10 text-muted-foreground',
  }

  return (
    <div className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', colors[quality])}>
      <Sparkles className="w-3 h-3" />
      {quality} ({score})
    </div>
  )
}
