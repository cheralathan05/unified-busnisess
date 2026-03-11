import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Lead {
  id: number
  name: string
  company: string
  status: string
  value: string
  lastContact: string
  avatar: string
}

const pipelineStages = ['New', 'Contacted', 'Proposal', 'Negotiation', 'Won']

export function LeadPipeline({ leads }: { leads: Lead[] }) {
  return (
    <CardContent className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {pipelineStages.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.status === stage)
          const stageValue = stageLeads.reduce((sum, lead) => {
            const value = parseInt(lead.value.replace(/₹|,/g, ''))
            return sum + value
          }, 0)

          return (
            <div key={stage} className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm text-foreground">{stage}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stageLeads.length} leads
                </p>
                <p className="text-sm font-semibold text-accent mt-1">
                  ₹{(stageValue / 100000).toFixed(1)}L
                </p>
              </div>

              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-card border border-border rounded-lg hover:shadow-md transition-shadow cursor-move group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {lead.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {lead.value}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {lead.lastContact}
                      </p>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Drag leads here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </CardContent>
  )
}
