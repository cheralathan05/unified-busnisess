import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  MessageSquare,
  CreditCard,
  CheckSquare,
  Plus,
  ArrowRight,
} from 'lucide-react'

const actions = [
  {
    id: 1,
    icon: Users,
    label: 'New Lead',
    description: 'Add a new customer',
    color: 'text-primary',
  },
  {
    id: 2,
    icon: CreditCard,
    label: 'Record Payment',
    description: 'Log incoming payment',
    color: 'text-success',
  },
  {
    id: 3,
    icon: MessageSquare,
    label: 'Send Message',
    description: 'Contact customer',
    color: 'text-accent',
  },
  {
    id: 4,
    icon: CheckSquare,
    label: 'Create Task',
    description: 'Add follow-up',
    color: 'text-warning',
  },
]

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-3 hover:bg-muted/50"
            >
              <Icon className={`w-4 h-4 ${action.color} flex-shrink-0`} />
              <div className="text-left flex-1 ml-3">
                <p className="text-sm font-medium text-foreground">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
