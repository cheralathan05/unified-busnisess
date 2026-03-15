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

type MethodData = {
  name: string
  value: number
}

interface PaymentMethodChartProps {
  data?: MethodData[]
}

const defaultData: MethodData[] = [
  { name: "UPI", value: 420000 },
  { name: "Card", value: 280000 },
  { name: "Bank Transfer", value: 190000 },
  { name: "Cash", value: 80000 },
  { name: "Wallet", value: 60000 },
]

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
]

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function PaymentMethodChart({
  data = defaultData,
}: PaymentMethodChartProps) {

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-border">

      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
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
            Total Processed
          </p>

          <p className="text-xl font-semibold">
            {formatCurrency(total)}
          </p>

        </div>

      </CardContent>

    </Card>
  )
}
