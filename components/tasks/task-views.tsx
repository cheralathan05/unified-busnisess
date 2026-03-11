'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge-enhanced'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Task } from '@/hooks/use-app-state'
import { Calendar, Grid2x2, List, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface TaskViewProps {
  tasks: Task[]
  onUpdate?: (task: Task) => void
  onDelete?: (id: string) => void
}

export function TaskViews({ tasks, onUpdate, onDelete }: TaskViewProps) {
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('list')

  // Group tasks by status
  const tasksByStatus = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'done': tasks.filter(t => t.status === 'done'),
  }

  // Task card component
  const TaskCard = ({ task }: { task: Task }) => {
    const priorityColor: Record<string, string> = {
      low: 'primary',
      medium: 'warning',
      high: 'destructive',
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-lg border border-border bg-card hover:shadow-elevation-1 transition-shadow"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm flex-1 text-foreground">{task.title}</h4>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              ✕
            </Button>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <Badge variant="soft" color={priorityColor[task.priority] as any} size="sm">
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      </motion.div>
    )
  }

  // List view
  const ListViewContent = () => (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No tasks to display</p>
      ) : (
        tasks.map(task => <TaskCard key={task.id} task={task} />)
      )}
    </div>
  )

  // Board view (Kanban)
  const BoardViewContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
        <div key={status} className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold capitalize">{status.replace('-', ' ')}</h3>
            <Badge variant="soft" size="sm">{statusTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {statusTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // Calendar view
  const CalendarViewContent = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Calendar view shows tasks by due date. {tasks.length} total tasks.
      </p>
      {tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => (
        <div key={task.id} className="p-3 rounded-lg border border-border flex items-start gap-3">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              Due: {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <Badge variant="soft" size="sm">
            {task.status.replace('-', ' ')}
          </Badge>
        </div>
      ))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Task Management
            </CardTitle>
            <CardDescription>
              {tasks.length} total tasks • {tasksByStatus.done.length} completed
            </CardDescription>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-2">
                <Grid2x2 className="w-4 h-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        {view === 'list' && <ListViewContent />}
        {view === 'board' && <BoardViewContent />}
        {view === 'calendar' && <CalendarViewContent />}
      </CardContent>
    </Card>
  )
}
