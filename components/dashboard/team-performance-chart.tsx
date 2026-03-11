'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/hooks/use-app-state'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Users } from 'lucide-react'

interface TeamMember {
  name: string
  leads: number
  closed: number
  revenue: number
  tasks_completed: number
}

export function TeamPerformanceChart() {
  const { leads, tasks } = useAppState()

  // Mock team members data (in a real app, this would come from your data store)
  const teamMembers: TeamMember[] = [
    { name: 'You', leads: leads.length, closed: leads.filter(l => l.status === 'Won').length, revenue: leads.reduce((sum, l) => sum + (l.status === 'Won' ? l.dealValue : 0), 0), tasks_completed: tasks.filter(t => t.status === 'done').length },
    { name: 'Team Member 1', leads: 8, closed: 2, revenue: 150000, tasks_completed: 12 },
    { name: 'Team Member 2', leads: 6, closed: 1, revenue: 75000, tasks_completed: 8 },
    { name: 'Team Member 3', leads: 10, closed: 3, revenue: 225000, tasks_completed: 15 },
  ]

  const data = teamMembers.map(member => ({
    name: member.name,
    leads: member.leads,
    closed: member.closed,
    taskCompletion: member.tasks_completed,
  }))

  const colors = ['#a855f7', '#7c3aed', '#6366f1', '#3b82f6']

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Team Performance
        </CardTitle>
        <CardDescription>
          Individual member metrics and productivity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
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
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="leads" fill="#a855f7" radius={[8, 8, 0, 0]} />
              <Bar dataKey="closed" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="taskCompletion" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-6 space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {teamMembers.map((member, idx) => (
              <div
                key={member.name}
                className="p-3 rounded-lg border border-border/30 bg-muted/10"
              >
                <p className="font-semibold text-foreground mb-2 truncate">{member.name}</p>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Leads:</span>
                    <span className="font-medium text-foreground">{member.leads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closed:</span>
                    <span className="font-medium text-success">{member.closed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium text-primary">₹{(member.revenue / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
