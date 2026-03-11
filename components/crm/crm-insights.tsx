'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge-enhanced'
import { useAppState } from '@/hooks/use-app-state'
import { TrendingUp, AlertCircle, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CRMInsights() {
  const { leads } = useAppState()

  // Calculate insights
  const totalLeads = leads.length || 1
  const wonLeads = leads.filter(l => l.status === 'Won').length
  const lostLeads = leads.filter(l => l.status === 'Lost').length
  const activeLeads = leads.filter(l => !['Won', 'Lost'].includes(l.status)).length
  const hotLeads = leads.filter(l => ['Proposal', 'Negotiation'].includes(l.status)).length

  const conversionRate = Math.round((wonLeads / totalLeads) * 100)
  const avgDealValue = leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.dealValue, 0) / totalLeads) : 0
  const topDeal = leads.reduce((max, l) => (l.dealValue > max.dealValue ? l : max), leads[0])

  const inactiveLeads = leads.filter(l => {
    const daysSinceCreation = (new Date().getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreation > 7 && !['Won', 'Lost'].includes(l.status)
  })

  const insights = [
    {
      label: 'Conversion Rate',
      value: conversionRate,
      unit: '%',
      trend: 'up',
      status: conversionRate >= 25 ? 'good' : 'warning',
      description: `${wonLeads} won from ${totalLeads} leads`,
    },
    {
      label: 'Hot Leads',
      value: hotLeads,
      unit: '',
      trend: hotLeads > 0 ? 'up' : 'down',
      status: hotLeads > 0 ? 'good' : 'warning',
      description: 'In proposal or negotiation',
    },
    {
      label: 'Avg Deal Value',
      value: avgDealValue / 1000,
      unit: 'k',
      trend: 'neutral',
      status: avgDealValue > 50000 ? 'good' : 'warning',
      description: '₹ per lead',
    },
    {
      label: 'Inactive Leads',
      value: inactiveLeads.length,
      unit: '',
      trend: 'down',
      status: inactiveLeads.length === 0 ? 'good' : 'warning',
      description: 'No activity in 7+ days',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Insights grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight) => (
          <Card
            key={insight.label}
            className={cn(
              'overflow-hidden',
              insight.status === 'good' && 'border-success/30 bg-success/5',
              insight.status === 'warning' && 'border-warning/30 bg-warning/5',
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {insight.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {insight.value}
                  <span className="text-sm text-muted-foreground ml-1">{insight.unit}</span>
                </span>
                {insight.trend === 'up' && (
                  <TrendingUp className={cn(
                    'w-5 h-5',
                    insight.status === 'good' ? 'text-success' : 'text-warning',
                  )} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top opportunity */}
      {topDeal && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Top Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{topDeal.name}</p>
                <p className="text-sm text-muted-foreground">{topDeal.company}</p>
              </div>
              <Badge variant="solid" color="primary" size="md">
                ₹{topDeal.dealValue.toLocaleString()}
              </Badge>
            </div>
            <div className="mt-3 p-2 rounded bg-background/50">
              <p className="text-xs">
                <span className="font-medium">Status: </span>
                <span className="text-primary">{topDeal.status}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {inactiveLeads.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <AlertCircle className="w-4 h-4" />
              Follow-up Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-semibold">{inactiveLeads.length}</span> lead{inactiveLeads.length !== 1 ? 's' : ''} {inactiveLeads.length === 1 ? 'has' : 'have'} been inactive for 7+ days.
            </p>
            {inactiveLeads.slice(0, 2).map(lead => (
              <div key={lead.id} className="mt-2 text-xs text-muted-foreground p-2 rounded bg-background/50">
                • {lead.name} from {lead.company}
              </div>
            ))}
            {inactiveLeads.length > 2 && (
              <p className="mt-2 text-xs text-muted-foreground">+ {inactiveLeads.length - 2} more</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
