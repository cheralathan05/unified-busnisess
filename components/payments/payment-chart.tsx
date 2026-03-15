'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type PaymentData = {
  month: string
  collected: number
  pending: number
}

interface PaymentChartProps {
  data?: PaymentData[]
  loading?: boolean
}

const defaultData: PaymentData[] = [
  { month: 'Jan', collected: 150000, pending: 45000 },
  { month: 'Feb', collected: 180000, pending: 60000 },
  { month: 'Mar', collected: 165000, pending: 50000 },
  { month: 'Apr', collected: 200000, pending: 70000 },
  { month: 'May', collected: 220000, pending: 85000 },
  { month: 'Jun', collected: 245000, pending: 150000 },
]

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString('en-IN')}`

export function PaymentChart({
  data = defaultData,
  loading = false,
}: PaymentChartProps) {

  const chartData = data.length ? data : defaultData

  const totalCollected = chartData.reduce(
    (sum, item) => sum + item.collected,
    0
  )

  const totalPending = chartData.reduce(
    (sum, item) => sum + item.pending,
    0
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Trends</CardTitle>
        </CardHeader>

        <CardContent className="flex items-center justify-center h-[320px] text-muted-foreground">
          Loading payment analytics...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>

      {/* HEADER */}

      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

        <div>
          <CardTitle>Payment Trends</CardTitle>

          <p className="text-xs text-muted-foreground mt-1">
            Collected vs Pending payments over time
          </p>
        </div>

        <div className="text-xs text-muted-foreground flex gap-6">

          <span>
            Collected:{" "}
            <strong className="text-green-500">
              {formatCurrency(totalCollected)}
            </strong>
          </span>

          <span>
            Pending:{" "}
            <strong className="text-yellow-500">
              {formatCurrency(totalPending)}
            </strong>
          </span>

        </div>

      </CardHeader>

      {/* CHART */}

      <CardContent>

        <ResponsiveContainer width="100%" height={320}>

          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >

            {/* GRADIENTS */}

            <defs>

              <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
              </linearGradient>

            </defs>

            {/* GRID */}

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
            />

            {/* AXIS */}

            <XAxis
              dataKey="month"
              stroke="var(--muted-foreground)"
              fontSize={12}
            />

            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />

            {/* TOOLTIP */}

            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />

            {/* LEGEND */}

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '12px' }}
            />

            {/* COLLECTED AREA */}

            <Area
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#collectedGradient)"
              dot={false}
              activeDot={{ r: 6 }}
            />

            {/* PENDING AREA */}

            <Area
              type="monotone"
              dataKey="pending"
              name="Pending"
              stroke="#facc15"
              strokeWidth={2}
              fill="url(#pendingGradient)"
              dot={false}
              activeDot={{ r: 6 }}
            />

          </AreaChart>

        </ResponsiveContainer>

      </CardContent>

    </Card>
  )
}
