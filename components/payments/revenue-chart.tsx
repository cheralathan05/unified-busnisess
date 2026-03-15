"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type RevenueData = {
  month: string
  revenue: number
}

interface RevenueChartProps {
  data?: RevenueData[]
}

const defaultData: RevenueData[] = [
  { month: "Jan", revenue: 120000 },
  { month: "Feb", revenue: 150000 },
  { month: "Mar", revenue: 170000 },
  { month: "Apr", revenue: 200000 },
  { month: "May", revenue: 240000 },
  { month: "Jun", revenue: 260000 },
]

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function RevenueChart({ data = defaultData }: RevenueChartProps) {

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <Card className="border-border">

      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>

      <CardContent>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

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

            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

          </LineChart>

        </ResponsiveContainer>

        {/* TOTAL */}

        <div className="text-center mt-4">

          <p className="text-sm text-muted-foreground">
            Total Revenue
          </p>

          <p className="text-xl font-semibold">
            {formatCurrency(totalRevenue)}
          </p>

        </div>

      </CardContent>

    </Card>
  )
}
