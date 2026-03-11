'use client'

import Link from "next/link"

import { Lead } from "@/hooks/use-app-state"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LeadScoreIndicator } from "@/components/crm/lead-score-indicator"
import { DealProbabilityIndicator } from "@/components/crm/deal-probability-indicator"

import { Mail, Phone, Calendar, BarChart3 } from "lucide-react"

interface Props {
  lead: Lead
}

const statusColors: Record<string, string> = {
  New: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  Contacted: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  Proposal: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  Negotiation: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  Won: "bg-green-500/10 text-green-400 border border-green-500/30",
  Lost: "bg-red-500/10 text-red-400 border border-red-500/30"
}

export default function LeadCard({ lead }: Props) {

  const statusClass =
    statusColors[lead.status] ?? "bg-gray-500/10 text-gray-400"

  return (

    <Link
      href={`/crm/${lead.id}`}
      className="block"
    >

      <Card className="p-4 hover:shadow-lg transition-all border-border/50 hover:border-primary/50">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">

          <div className="flex-1 min-w-0">

            <h3 className="text-lg font-semibold truncate">
              {lead.name}
            </h3>

            <p className="text-sm text-muted-foreground truncate">
              {lead.company}
            </p>

          </div>

          {/* Lead Score Indicator */}
          <LeadScoreIndicator 
            score={Math.min(100, Math.max(0, lead.dealValue / 1000))}
            size="md"
            showLabel={true}
          />

        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-muted-foreground">

          {lead.email && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="w-4 h-4" />
              <span className="truncate text-xs">{lead.email}</span>
            </div>
          )}

          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span className="text-xs">{lead.phone}</span>
            </div>
          )}

        </div>

        {/* Deal Info */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Deal Value</span>
            <span className="text-sm font-bold text-primary">₹{lead.dealValue.toLocaleString()}</span>
          </div>
          <DealProbabilityIndicator 
            probability={Math.min(100, Math.max(0, lead.dealValue / 1000))}
            stage={lead.status}
            size="md"
            showPercentage={true}
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={statusClass}>
            {lead.status}
          </Badge>
          <span className="text-xs text-muted-foreground">Updated today</span>
        </div>

      </Card>

    </Link>

  )

}
