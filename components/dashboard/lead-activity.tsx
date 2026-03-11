import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowRight, MessageSquare, Phone, Mail } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'new_lead',
    name: 'Ravi Kumar',
    action: 'New lead interested in Website Design',
    avatar: 'RK',
    time: '10 minutes ago',
    icon: Mail,
  },
  {
    id: 2,
    type: 'payment',
    name: 'Priya Sharma',
    action: 'Payment received ₹75,000 for App Development',
    avatar: 'PS',
    time: '45 minutes ago',
    icon: MessageSquare,
  },
  {
    id: 3,
    type: 'message',
    name: 'Vijayk Enterprises',
    action: 'Sent proposal for branding services',
    avatar: 'VE',
    time: '2 hours ago',
    icon: Phone,
  },
  {
    id: 4,
    type: 'activity',
    name: 'Anita Singh',
    action: 'Moved to Negotiation stage from Proposal',
    avatar: 'AS',
    time: '5 hours ago',
    icon: ArrowRight,
  },
]

export function LeadActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs font-semibold">
                    {activity.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {activity.time}
                  </p>
                </div>
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
