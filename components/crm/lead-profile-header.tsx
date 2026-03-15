'use client'

import { Lead } from "@/lib/services/lead.service"

import { Badge } from "@/components/ui/badge"

import { formatCurrency } from "@/lib/utils/currency"

import LeadPriority from "@/components/crm/lead-priority"

interface Props {

  lead: Lead
  refreshLead?: () => void

}

const statusColors: Record<string,string> = {

  NEW: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  CONTACTED: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  QUALIFIED: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  WON: "bg-green-500/10 text-green-400 border border-green-500/30",
  LOST: "bg-red-500/10 text-red-400 border border-red-500/30"

}

export default function LeadProfileHeader({

  lead,
  refreshLead

}: Props){

return(

<div className="border-b pb-6 space-y-4">

  {/* NAME */}

  <div>

    <h1 className="text-3xl font-bold">
      {lead.name}
    </h1>

    {lead.company && (

      <p className="text-muted-foreground">
        {lead.company}
      </p>

    )}

  </div>

  {/* STATUS + PRIORITY */}

  <div className="flex items-center gap-3 flex-wrap">

    <Badge
      className={
        statusColors[lead.status] ??
        "bg-gray-500/10 text-gray-400"
      }
    >
      {lead.status}
    </Badge>

    <LeadPriority
      leadId={lead.id}
      value={lead.priority}
      onUpdated={refreshLead}
    />

  </div>

  {/* DEAL VALUE */}

  {lead.value !== undefined && (

    <div>

      <p className="text-sm text-muted-foreground">
        Deal Value
      </p>

      <p className="text-xl font-semibold">

        {formatCurrency(lead.value)}

      </p>

    </div>

  )}

</div>

)

}