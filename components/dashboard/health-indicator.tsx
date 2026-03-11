import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'

export function HealthIndicator() {
  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Health</CardTitle>
          <TrendingUp className="w-5 h-5 text-success" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Overall Score</p>
            <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Excellent</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="bg-success h-3 rounded-full w-4/5" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">82/100 - Up from 78 last month</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Lead Conv. Rate</p>
            <p className="text-lg font-bold text-foreground">28%</p>
            <p className="text-xs text-success mt-1">↑ 4% vs last month</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Payment Health</p>
            <p className="text-lg font-bold text-foreground">94%</p>
            <p className="text-xs text-success mt-1">↑ 2% vs last month</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Avg Response Time</p>
            <p className="text-lg font-bold text-foreground">2.4h</p>
            <p className="text-xs text-warning mt-1">↓ Slower by 20min</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Team Productivity</p>
            <p className="text-lg font-bold text-foreground">91%</p>
            <p className="text-xs text-success mt-1">↑ 3% vs last month</p>
          </div>
        </div>

        {/* Alert */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">⚠️ Attention Needed</p>
          <p className="text-xs text-foreground mt-1">
            3 customers have overdue payments (₹1,25,000 total)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
