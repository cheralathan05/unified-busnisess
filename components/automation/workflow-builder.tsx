'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Zap,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Activity,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface WorkflowTrigger {
  id: string
  type: 'email' | 'task-created' | 'deal-won' | 'form-submission'
  name: string
}

interface WorkflowAction {
  id: string
  type: 'send-email' | 'create-task' | 'update-contact' | 'send-notification'
  name: string
  config: Record<string, any>
}

interface Workflow {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  isActive: boolean
  createdAt: Date
  executionCount: number
}

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'New Deal Notification',
      description: 'Send email when a new deal is created',
      trigger: { id: '1', type: 'deal-won', name: 'Deal Won' },
      actions: [
        { id: '1', type: 'send-email', name: 'Send Team Email', config: {} },
        { id: '2', type: 'create-task', name: 'Create Follow-up Task', config: {} },
      ],
      isActive: true,
      createdAt: new Date('2024-01-15'),
      executionCount: 128,
    },
    {
      id: '2',
      name: 'Lead Qualification',
      description: 'Automatically qualify and segment leads',
      trigger: { id: '2', type: 'form-submission', name: 'Form Submission' },
      actions: [
        { id: '3', type: 'update-contact', name: 'Update Contact Info', config: {} },
        { id: '4', type: 'send-notification', name: 'Send Notification', config: {} },
      ],
      isActive: true,
      createdAt: new Date('2024-01-10'),
      executionCount: 342,
    },
  ])

  const [view, setView] = useState<'list' | 'builder'>('list')
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  const triggerTypes: { value: WorkflowTrigger['type']; label: string; icon: React.ReactNode }[] = [
    { value: 'email', label: 'Email Received', icon: '📧' },
    { value: 'task-created', label: 'Task Created', icon: '✓' },
    { value: 'deal-won', label: 'Deal Won', icon: '🎉' },
    { value: 'form-submission', label: 'Form Submission', icon: '📝' },
  ]

  const actionTypes: { value: WorkflowAction['type']; label: string; icon: React.ReactNode }[] = [
    { value: 'send-email', label: 'Send Email', icon: '📧' },
    { value: 'create-task', label: 'Create Task', icon: '✓' },
    { value: 'update-contact', label: 'Update Contact', icon: '👤' },
    { value: 'send-notification', label: 'Send Notification', icon: '🔔' },
  ]

  const toggleWorkflow = (id: string) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w))
  }

  const deleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage workflow automations</p>
        </div>
        <Button className="gap-2" onClick={() => setView('builder')}>
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      {view === 'list' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{workflows.filter(w => w.isActive).length}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Executions</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{workflows.reduce((sum, w) => sum + w.executionCount, 0).toLocaleString()}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-500/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Workflows</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{workflows.length}</p>
                </div>
                <GitBranch className="w-8 h-8 text-purple-500/30" />
              </div>
            </Card>
          </div>

          {/* Workflows List */}
          <div className="space-y-3">
            {workflows.map(workflow => (
              <Card key={workflow.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Trigger: {workflow.trigger.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {workflow.actions.length} actions
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {workflow.executionCount} executions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleWorkflow(workflow.id)}
                    >
                      {workflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedWorkflow(workflow)
                        setView('builder')
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {selectedWorkflow ? `Edit: ${selectedWorkflow.name}` : 'Create New Workflow'}
              </h2>
            </div>

            {/* Workflow Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Workflow Name</label>
              <Input
                placeholder="e.g., Send welcome email to new customers"
                defaultValue={selectedWorkflow?.name}
                className="bg-background"
              />
            </div>

            {/* Trigger Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Trigger Event</label>
              <div className="grid grid-cols-2 gap-3">
                {triggerTypes.map(type => (
                  <Card
                    key={type.value}
                    className="p-3 cursor-pointer hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{type.label}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Actions</label>
              <div className="space-y-2 mb-3">
                {selectedWorkflow?.actions.map(action => (
                  <Card key={action.id} className="p-3 bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-foreground">{action.name}</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {actionTypes.map(type => (
                  <Card
                    key={type.value}
                    className="p-3 cursor-pointer hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{type.label}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setView('list')
                  setSelectedWorkflow(null)
                }}
              >
                Cancel
              </Button>
              <Button>
                {selectedWorkflow ? 'Update Workflow' : 'Create Workflow'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
