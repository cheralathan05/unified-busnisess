'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Users } from "lucide-react"

// Mock data for customer growth
const data = [
  { month: 'Jan', customers: 120, active: 98 },
  { month: 'Feb', customers: 145, active: 112 },
  { month: 'Mar', customers: 178, active: 145 },
  { month: 'Apr', customers: 215, active: 189 },
  { month: 'May', customers: 268, active: 234 },
  { month: 'Jun', customers: 312, active: 287 },
]

export function CustomerGrowthChart() {
  const currentCustomers = data[data.length - 1].customers
  const previousCustomers = data[data.length - 2].customers
  const growth = Math.round(((currentCustomers - previousCustomers) / previousCustomers) * 100)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-success" />
              Customer Growth
            </CardTitle>
            <CardDescription>
              {currentCustomers} total customers (+{growth}% from last month)
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-success">+{growth}%</div>
            <div className="text-xs text-muted-foreground">Month over month</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 24, 0.8)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="active"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Active"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
