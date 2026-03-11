'use client'

import { useAppState } from "@/hooks/use-app-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp } from "lucide-react"

interface RevenueDataPoint {
  date: string
  revenue: number
  forecast?: number
}

export function RevenueChartEnhanced() {
  const { payments } = useAppState()

  // Aggregate payments by date
  const data: RevenueDataPoint[] = payments.reduce((acc: RevenueDataPoint[], p) => {
    const date = new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const existing = acc.find(d => d.date === date)
    
    if (existing) {
      existing.revenue += p.amount
    } else {
      acc.push({
        date,
        revenue: p.amount,
        forecast: p.amount * 1.05,
      })
    }
    return acc
  }, [])

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Revenue Overview
            </CardTitle>
            <CardDescription>
              Total: ₹{totalRevenue.toLocaleString()} | Avg: ₹{Math.round(avgRevenue).toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
