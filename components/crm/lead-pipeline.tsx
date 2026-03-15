'use client'

import React from "react"

import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { Lead } from "@/lib/services/lead.service"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDate } from "@/lib/utils/date"

const pipelineStages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST"
]

interface Props {
  leads: Lead[]
}

export function LeadPipeline({ leads }: Props) {

  return (

    <CardContent className="p-4">

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {pipelineStages.map((stage) => {

          const stageLeads = leads.filter(
            (lead) => lead.status === stage
          )

          const stageValue = stageLeads.reduce((sum, lead) => {

            const dealValue =
              lead.deals?.[0]?.value ?? 0

            return sum + dealValue

          }, 0)

          return (

            <div key={stage} className="space-y-3">

              {/* Stage Header */}

              <div className="p-3 bg-muted/50 rounded-lg">

                <p className="font-medium text-sm text-foreground">

                  {stage}

                </p>

                <p className="text-xs text-muted-foreground mt-1">

                  {stageLeads.length} leads

                </p>

                <p className="text-sm font-semibold text-accent mt-1">

                  {formatCurrency(stageValue)}

                </p>

              </div>

              {/* Leads */}

              <div className="space-y-2">

                {stageLeads.map((lead) => {

                  const initials = lead.name
                    ?.split(" ")
                    .map(n => n[0])
                    .join("")
                    .slice(0,2)
                    .toUpperCase()

                  const dealValue =
                    lead.deals?.[0]?.value ?? 0

                  return (

                    <div
                      key={lead.id}
                      className="p-3 bg-card border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                    >

                      <div className="flex items-start gap-2 mb-2">

                        <Avatar className="w-6 h-6">

                          <AvatarFallback className="text-xs">

                            {initials}

                          </AvatarFallback>

                        </Avatar>

                        <div className="flex-1 min-w-0">

                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">

                            {lead.name}

                          </p>

                          {lead.company && (

                            <p className="text-xs text-muted-foreground truncate">

                              {lead.company}

                            </p>

                          )}

                        </div>

                      </div>

                      <div className="flex items-center justify-between">

                        <Badge variant="secondary" className="text-xs">

                          {formatCurrency(dealValue)}

                        </Badge>

                        <p className="text-xs text-muted-foreground">

                          {formatDate(lead.createdAt)}

                        </p>

                      </div>

                    </div>

                  )

                })}

                {stageLeads.length === 0 && (

                  <div className="p-8 text-center border border-dashed border-border rounded-lg">

                    <p className="text-xs text-muted-foreground">

                      No leads

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