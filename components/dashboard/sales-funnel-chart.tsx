'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useAppState } from "@/hooks/use-app-state"

export function SalesFunnelChart() {
  const { leads } = useAppState()

  // Calculate funnel stages
  const stages = {
    qualified: leads.filter(l => l.status === 'qualified').length,
    negotiation: leads.filter(l => l.status === 'negotiation').length,
    proposal: leads.filter(l => l.status === 'proposal').length,
    won: leads.filter(l => l.status === 'won').length,
  }

  const total = Object.values(stages).reduce((a, b) => a + b, 0) || 1

  const data = [
    {
      name: 'Qualified',
      leads: stages.qualified,
      percentage: Math.round((stages.qualified / total) * 100),
    },
    {
      name: 'Negotiation',
      leads: stages.negotiation,
      percentage: Math.round((stages.negotiation / total) * 100),
    },
    {
      name: 'Proposal',
      leads: stages.proposal,
      percentage: Math.round((stages.proposal / total) * 100),
    },
    {
      name: 'Won',
      leads: stages.won,
      percentage: Math.round((stages.won / total) * 100),
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Sales Funnel</CardTitle>
        <CardDescription>
          Lead progression through sales stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
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
                formatter={(value) => [value, 'Leads']}
              />
              <Bar
                dataKey="leads"
                fill="#a855f7"
                radius={[8, 8, 0, 0]}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel breakdown */}
        <div className="mt-6 space-y-3">
          {data.map((stage) => (
            <div key={stage.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="text-sm font-medium text-foreground">{stage.name}</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-3">
                <span className="text-sm font-semibold text-primary">{stage.leads}</span>
                <span className="text-xs text-muted-foreground ml-1">({stage.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
