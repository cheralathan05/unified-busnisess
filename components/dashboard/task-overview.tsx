import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

const tasks = [
  {
    id: 1,
    title: 'Follow-up: Ravi Kumar',
    dueDate: 'Today',
    priority: 'high',
    completed: false,
  },
  {
    id: 2,
    title: 'Prepare proposal for Vijayk',
    dueDate: 'Tomorrow',
    priority: 'high',
    completed: false,
  },
  {
    id: 3,
    title: 'Send invoice to Priya Sharma',
    dueDate: 'Tomorrow',
    priority: 'medium',
    completed: false,
  },
  {
    id: 4,
    title: 'Payment verification',
    dueDate: 'Overdue',
    priority: 'high',
    completed: false,
  },
]

export function TaskOverview() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tasks Today</CardTitle>
          <Badge variant="secondary">5 due</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-2 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer group"
          >
            <button className="mt-1 flex-shrink-0 hover:scale-110 transition-transform">
              <Circle className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {task.dueDate}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                task.priority === 'high'
                  ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
              }
            >
              {task.priority}
            </Badge>
          </div>
        ))}

        <Button variant="ghost" size="sm" className="w-full mt-3">
          View All Tasks
        </Button>
      </CardContent>
    </Card>
  )
}
