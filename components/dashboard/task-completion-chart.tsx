'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { useAppState } from "@/hooks/use-app-state"
import { CheckCircle2, Clock } from "lucide-react"

export function TaskCompletionChart() {
  const { tasks } = useAppState()

  const completed = tasks.filter(t => t.status === 'done').length
  const pending = tasks.filter(t => t.status !== 'done').length
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  const data = [
    { name: 'Completed', value: completed, color: '#22c55e' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Task Completion
            </CardTitle>
            <CardDescription>
              {completed} of {tasks.length} tasks completed
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-success">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">Completion rate</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationDuration={600}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 24, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-success/10 border border-success/30">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-success">{completed}</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-warning">{pending}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
