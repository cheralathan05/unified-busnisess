'use client'

import { Lead } from "@/hooks/use-app-state"

interface Props {
  lead: Lead
}

export default function LeadScore({ lead }: Props) {

  let score = 0

  if (lead.dealValue > 50000) score += 30
  if (lead.status === "Proposal") score += 30
  if (lead.status === "Negotiation") score += 40
  if (lead.email) score += 10
  if (lead.phone) score += 10

  if (score > 100) score = 100

  return (

    <div className="flex items-center gap-2 text-xs">

      <span className="font-medium">
        Score
      </span>

      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">

        {score}

      </span>

    </div>

  )

}