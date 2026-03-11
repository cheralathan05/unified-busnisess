'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/hooks/use-app-state'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge-enhanced'

export function ForecastWidget() {
  const { leads, payments } = useAppState()

  // Calculate forecast data
  const currentRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const avgMonthlyRevenue = currentRevenue > 0 ? currentRevenue / 1 : 10000
  const projectedDeals = leads.filter(l => ['Proposal', 'Negotiation'].includes(l.status))
  const potentialRevenue = projectedDeals.reduce((sum, l) => sum + l.dealValue, 0)

  // Generate forecast for next 6 months
  const forecastData = Array.from({ length: 6 }).map((_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() + i)
    const monthName = month.toLocaleString('en-US', { month: 'short' })

    // Conservative forecast: 70% of average monthly revenue + 30% of potential deals
    const forecasted = (avgMonthlyRevenue * 0.7) + (potentialRevenue * 0.3) * (i / 6)
    const actual = i === 0 ? currentRevenue : undefined

    return {
      month: monthName,
      forecasted: Math.round(forecasted),
      actual: actual,
    }
  })

  const forecastTrend = ((potentialRevenue / (currentRevenue || 1)) * 100).toFixed(0)
  const confidence = potentialRevenue > currentRevenue ? 'High' : 'Moderate'

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Revenue Forecast
            </CardTitle>
            <CardDescription>
              6-month projection based on current pipeline
            </CardDescription>
          </div>
          <Badge variant="soft" color="success" size="md">
            {forecastTrend}% Potential
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Forecast chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 24, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="forecasted"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 4 }}
                activeDot={{ r: 6 }}
                name="Forecast"
              />
              {forecastData[0].actual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  name="Actual"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast summary */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Monthly</p>
            <p className="text-lg font-bold text-primary">₹{Math.round(avgMonthlyRevenue / 1000).toLocaleString()}k</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">In Pipeline</p>
            <p className="text-lg font-bold text-warning">₹{Math.round(potentialRevenue / 1000).toLocaleString()}k</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-success">{confidence}</span>
              {confidence === 'High' && <span className="text-xs">📈</span>}
            </div>
          </div>
        </div>

        {/* Alert if low pipeline */}
        {potentialRevenue < avgMonthlyRevenue && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning">
              Pipeline is lower than average monthly revenue. Focus on lead generation to maintain growth.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
