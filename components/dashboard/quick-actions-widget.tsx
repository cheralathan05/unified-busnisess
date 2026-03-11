'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function QuickActionsWidget() {
  const router = useRouter()

  const actions = [
    {
      label: 'Add Lead',
      icon: Plus,
      action: () => router.push('/crm/add-lead'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Schedule Call',
      icon: Phone,
      action: () => router.push('/messages'),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Send Email',
      icon: Mail,
      action: () => router.push('/messages'),
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Create Task',
      icon: CheckCircle2,
      action: () => router.push('/tasks'),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Create Invoice',
      icon: DollarSign,
      action: () => router.push('/payments'),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Send Message',
      icon: MessageSquare,
      action: () => router.push('/messages'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Frequently used actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon
            return (
              <Button
                key={idx}
                onClick={action.action}
                variant="ghost"
                className={`h-auto flex-col gap-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-all ${action.bgColor}`}
              >
                <Icon className={`w-5 h-5 ${action.color}`} />
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
