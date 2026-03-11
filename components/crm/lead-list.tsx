import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Phone, Mail, MoreVertical, Trash2 } from 'lucide-react'

interface Lead {
  id: number
  name: string
  company: string
  status: string
  value: string
  lastContact: string
  email: string
  phone: string
  tags: string[]
  avatar: string
}

const statusColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  Contacted: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  Proposal: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  Negotiation: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  Won: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  Lost: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

export function LeadList({
  leads,
  onSelectLead,
}: {
  leads: Lead[]
  onSelectLead: (lead: Lead) => void
}) {
  return (
    <CardContent className="p-0">
      <div className="divide-y divide-border">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group flex items-center justify-between"
            onClick={() => onSelectLead(lead)}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar>
                <AvatarFallback className="text-xs font-semibold">
                  {lead.avatar}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {lead.name}
                </p>
                <p className="text-xs text-muted-foreground">{lead.company}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-right hidden md:block">
                <p className="font-semibold text-foreground">{lead.value}</p>
                <p className="text-xs text-muted-foreground">{lead.lastContact}</p>
              </div>

              <Badge
                variant="outline"
                className={`${statusColors[lead.status]} border`}
              >
                {lead.status}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Send Message</DropdownMenuItem>
                <DropdownMenuItem>Make Call</DropdownMenuItem>
                <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </CardContent>
  )
}
