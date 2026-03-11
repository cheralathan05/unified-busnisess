import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Phone as CallIcon,
  MoreVertical,
  X,
} from 'lucide-react'

interface Lead {
  id: number
  name: string
  company: string
  status: string
  value: string
  email: string
  phone: string
  tags: string[]
  avatar: string
}

export function LeadProfile({
  lead,
  onClose,
}: {
  lead: Lead
  onClose: () => void
}) {
  return (
    <Card className="bg-card border-border h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-border flex-row items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{lead.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{lead.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{lead.company}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border space-y-2">
        <Button className="w-full gap-2" variant="default">
          <MessageSquare className="w-4 h-4" />
          Send Message
        </Button>
        <Button className="w-full gap-2" variant="outline">
          <CallIcon className="w-4 h-4" />
          Make Call
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-4 space-y-4">
            {/* Contact Info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                CONTACT
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-foreground">{lead.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CallIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-foreground">{lead.phone}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Deal Info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                DEAL INFO
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className="mt-1 bg-primary/20 text-primary border-0"
                  >
                    {lead.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deal Value</p>
                  <p className="text-lg font-bold text-accent mt-1">{lead.value}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                TAGS
              </p>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4 space-y-3">
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-foreground">Message sent</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="font-medium text-foreground">Viewed proposal</p>
                <p className="text-xs text-muted-foreground">24 hours ago</p>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="font-medium text-foreground">Proposal sent</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="p-4">
            <p className="text-sm text-muted-foreground">
              No internal notes yet. Add notes to track important information about this lead.
            </p>
            <Button variant="outline" className="w-full mt-3" size="sm">
              Add Note
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
