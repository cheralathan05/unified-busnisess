"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type StatusData = {
  name: string
  value: number
}

interface PaymentStatusChartProps {
  data?: StatusData[]
}

const defaultData: StatusData[] = [
  { name: "Paid", value: 420000 },
  { name: "Pending", value: 180000 },
  { name: "Failed", value: 45000 },
  { name: "Refunded", value: 30000 },
]

const COLORS = [
  "#22c55e", // Paid
  "#facc15", // Pending
  "#ef4444", // Failed
  "#3b82f6", // Refunded
]

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function PaymentStatusChart({
  data = defaultData,
}: PaymentStatusChartProps) {

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-border">

      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>

      <CardContent>

        <ResponsiveContainer width="100%" height={300}>

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name }) => name}
            >

              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}

            </Pie>

            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
            />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

        {/* TOTAL */}

        <div className="text-center mt-4">

          <p className="text-sm text-muted-foreground">
            Total Transactions
          </p>

          <p className="text-xl font-semibold">
            {formatCurrency(total)}
          </p>

        </div>

      </CardContent>

    </Card>
  )
}
