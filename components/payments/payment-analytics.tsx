'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge-enhanced'
import { useAppState } from '@/hooks/use-app-state'
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export function PaymentAnalytics() {
  const { payments } = useAppState()

  // Calculate metrics
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const completedPayments = payments.filter(p => p.status === 'completed')
  const pendingPayments = payments.filter(p => p.status === 'pending')
  const failedPayments = payments.filter(p => p.status === 'failed')

  const completedAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const collectionRate = payments.length > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0

  // Calculate average payment time
  const avgDays = payments.length > 0 ? Math.round(
    payments.reduce((sum, p) => {
      const days = (new Date().getTime() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24)
      return sum + days
    }, 0) / payments.length
  ) : 0

  const metrics = [
    {
      label: 'Total Revenue',
      value: `₹${(totalAmount / 100000).toFixed(1)}L`,
      icon: TrendingUp,
      color: 'text-primary',
      description: `${payments.length} payments`,
    },
    {
      label: 'Completed',
      value: completedPayments.length,
      icon: CheckCircle2,
      color: 'text-success',
      description: `₹${(completedAmount / 1000).toFixed(0)}k collected`,
    },
    {
      label: 'Pending',
      value: pendingPayments.length,
      icon: Clock,
      color: 'text-warning',
      description: `₹${(pendingAmount / 1000).toFixed(0)}k awaiting`,
    },
    {
      label: 'Collection Rate',
      value: `${collectionRate}%`,
      icon: CheckCircle2,
      color: collectionRate >= 80 ? 'text-success' : 'text-warning',
      description: 'On-time collection rate',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              status: 'Completed',
              count: completedPayments.length,
              amount: completedAmount,
              color: 'success',
              percentage: payments.length > 0 ? Math.round((completedPayments.length / payments.length) * 100) : 0,
            },
            {
              status: 'Pending',
              count: pendingPayments.length,
              amount: pendingAmount,
              color: 'warning',
              percentage: payments.length > 0 ? Math.round((pendingPayments.length / payments.length) * 100) : 0,
            },
            {
              status: 'Failed',
              count: failedPayments.length,
              amount: failedPayments.reduce((sum, p) => sum + p.amount, 0),
              color: 'destructive',
              percentage: payments.length > 0 ? Math.round((failedPayments.length / payments.length) * 100) : 0,
            },
          ].map((item) => (
            <div key={item.status}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="soft" color={item.color as any} size="sm">
                    {item.count}
                  </Badge>
                  <span className="text-sm font-medium">{item.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{(item.amount / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent alerts */}
      {failedPayments.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              Failed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-semibold">{failedPayments.length}</span> payment{failedPayments.length !== 1 ? 's' : ''} have failed. Retry or contact customer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
