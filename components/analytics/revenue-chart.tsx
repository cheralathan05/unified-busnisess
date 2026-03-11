'use client'

import { Card } from "@/components/ui/card"
import { useAppState } from "@/hooks/use-app-state"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"

export default function RevenueChart() {

  const { payments } = useAppState()

  const data = payments.map((p) => ({
    date: new Date(p.date).toLocaleDateString(),
    revenue: p.amount
  }))

  return (

    <Card className="p-6 h-80">

      <h3 className="font-semibold mb-4">
        Revenue Trend
      </h3>

      <ResponsiveContainer width="100%" height="100%">

        <LineChart data={data}>

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
          />

        </LineChart>

      </ResponsiveContainer>

    </Card>

  )

}