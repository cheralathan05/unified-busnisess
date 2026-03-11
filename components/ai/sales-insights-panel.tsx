'use client'

import { Card } from "@/components/ui/card"
import { useAppState } from "@/hooks/use-app-state"

import { getFollowUpLeads } from "./followup-engine"

export default function SalesInsightsPanel() {

  const { leads } = useAppState()

  const followUps = getFollowUpLeads(leads)

  const totalRevenue = leads.reduce(
    (sum, lead) => sum + lead.dealValue,
    0
  )

  const hotLeads = leads.filter(
    (lead) => lead.dealValue > 80000
  )

  return (

    <Card className="p-6 space-y-4">

      <h3 className="text-lg font-semibold">

        AI Sales Insights

      </h3>

      <div className="space-y-2 text-sm">

        {hotLeads.length > 0 && (

          <p>

            🔥 Hot lead: <b>{hotLeads[0].name}</b>

          </p>

        )}

        {followUps.length > 0 && (

          <p>

            ⚠ Follow up with <b>{followUps[0].name}</b>

          </p>

        )}

        <p>

          📞 {followUps.length} leads need contact

        </p>

        <p>

          💰 Potential revenue: ₹{totalRevenue.toLocaleString()}

        </p>

      </div>

    </Card>

  )

}