'use client'

import Link from "next/link"

import { Lead } from "@/hooks/use-app-state"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Mail, Phone } from "lucide-react"

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

      <Card className="p-4 hover:shadow-lg transition-all border-border/50">

        <div className="flex items-start justify-between gap-4">

          {/* LEFT SIDE */}

          <div className="flex-1 min-w-0">

            <h3 className="text-lg font-semibold truncate">
              {lead.name}
            </h3>

            <p className="text-sm text-muted-foreground truncate">
              {lead.company}
            </p>


            {/* CONTACT INFO */}

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">

              {lead.email && (

                <div className="flex items-center gap-1 truncate">

                  <Mail className="w-4 h-4" />

                  <span className="truncate">
                    {lead.email}
                  </span>

                </div>

              )}

              {lead.phone && (

                <div className="flex items-center gap-1">

                  <Phone className="w-4 h-4" />

                  {lead.phone}

                </div>

              )}

            </div>

          </div>


          {/* RIGHT SIDE */}

          <div className="text-right flex-shrink-0">

            <p className="font-semibold text-foreground">

              ₹{lead.dealValue.toLocaleString()}

            </p>

            <Badge className={statusClass}>

              {lead.status}

            </Badge>

          </div>

        </div>

      </Card>

    </Link>

  )

}