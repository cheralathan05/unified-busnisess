'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useAppState } from "@/hooks/use-app-state"
import { CreditCard } from "lucide-react"

export function PaymentStatusChart() {
  const { payments } = useAppState()

  // Group payments by status
  const data = [
    {
      status: 'Completed',
      amount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      count: payments.filter(p => p.status === 'completed').length,
      color: '#22c55e',
    },
    {
      status: 'Pending',
      amount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      count: payments.filter(p => p.status === 'pending').length,
      color: '#f59e0b',
    },
    {
      status: 'Failed',
      amount: payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0),
      count: payments.filter(p => p.status === 'failed').length,
      color: '#ef4444',
    },
  ]

  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-info" />
              Payment Status
            </CardTitle>
            <CardDescription>
              Total: ₹{totalAmount.toLocaleString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="status"
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
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => `₹${value.toLocaleString()}`}
              />
              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
                animationDuration={600}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {data.map((item) => (
            <div key={item.status} className="p-3 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
              <p className="text-xs text-muted-foreground mb-1">{item.status}</p>
              <p className="text-lg font-bold" style={{ color: item.color }}>
                ₹{(item.amount / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-muted-foreground mt-1">{item.count} payment{item.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
