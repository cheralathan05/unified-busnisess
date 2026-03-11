'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/hooks/use-app-state'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface HealthMetric {
  label: string
  value: number
  max?: number
  target?: number
  status: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down'
  description?: string
}

export function BusinessHealthDashboard() {
  const { leads, payments, tasks } = useAppState()

  // Calculate health metrics
  const totalLeads = leads.length || 1
  const wonLeads = leads.filter(l => l.status === 'Won').length
  const conversionRate = Math.round((wonLeads / totalLeads) * 100)

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length || 1
  const taskCompletion = Math.round((completedTasks / totalTasks) * 100)

  const inactiveLead = leads.filter(l => {
    const daysSinceCreation = (new Date().getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreation > 7
  }).length

  const metrics: HealthMetric[] = [
    {
      label: 'Revenue Growth',
      value: totalRevenue > 0 ? 12 : 0,
      target: 15,
      status: totalRevenue > 100000 ? 'good' : 'warning',
      trend: 'up',
      description: `${totalRevenue.toLocaleString()} collected`,
    },
    {
      label: 'Lead Conversion',
      value: conversionRate,
      max: 100,
      target: 30,
      status: conversionRate >= 25 ? 'good' : conversionRate >= 15 ? 'warning' : 'critical',
      trend: wonLeads > 0 ? 'up' : 'down',
      description: `${wonLeads} of ${totalLeads} leads converted`,
    },
    {
      label: 'Team Efficiency',
      value: taskCompletion,
      max: 100,
      target: 80,
      status: taskCompletion >= 75 ? 'good' : taskCompletion >= 50 ? 'warning' : 'critical',
      trend: taskCompletion > 50 ? 'up' : 'down',
      description: `${completedTasks} of ${totalTasks} tasks completed`,
    },
    {
      label: 'Pipeline Health',
      value: Math.max(0, 100 - (inactiveLead / totalLeads) * 100),
      max: 100,
      target: 90,
      status: inactiveLead === 0 ? 'good' : 'warning',
      trend: inactiveLead === 0 ? 'up' : 'down',
      description: `${inactiveLead} inactive lead${inactiveLead !== 1 ? 's' : ''}`,
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          Business Health
        </CardTitle>
        <CardDescription>
          Key metrics to monitor your business performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => {
          const percentage = metric.max ? (metric.value / metric.max) * 100 : metric.value
          const statusColor = {
            good: 'bg-success/10 border-success/30 text-success',
            warning: 'bg-warning/10 border-warning/30 text-warning',
            critical: 'bg-destructive/10 border-destructive/30 text-destructive',
          }

          return (
            <div
              key={metric.label}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                statusColor[metric.status],
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{metric.label}</p>
                  {metric.description && (
                    <p className="text-xs opacity-75 mt-0.5">{metric.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">{Math.round(metric.value)}%</span>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-current opacity-20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              {/* Target indicator */}
              {metric.target && (
                <p className="text-xs opacity-60 mt-2">
                  Target: {metric.target}% {metric.value >= metric.target ? '✓ Met' : ''}
                </p>
              )}
            </div>
          )
        })}

        {/* Summary insights */}
        <div className="pt-4 border-t border-border/50 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Quick Insights</p>
          <ul className="space-y-1 text-sm">
            {conversionRate >= 25 && (
              <li className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                Conversion rate is strong
              </li>
            )}
            {inactiveLead > 0 && (
              <li className="flex items-center gap-2 text-warning">
                <AlertCircle className="w-4 h-4" />
                {inactiveLead} lead{inactiveLead !== 1 ? 's' : ''} need follow-up
              </li>
            )}
            {taskCompletion >= 75 && (
              <li className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                Team is on track with tasks
              </li>
            )}
            {pendingPayments > 0 && (
              <li className="flex items-center gap-2 text-warning">
                <AlertCircle className="w-4 h-4" />
                ₹{pendingPayments.toLocaleString()} pending payment
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
