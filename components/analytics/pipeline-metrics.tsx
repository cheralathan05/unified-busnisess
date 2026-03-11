'use client'

import { Card } from "@/components/ui/card"
import { useAppState } from "@/hooks/use-app-state"

export default function PipelineMetrics() {

  const { leads } = useAppState()

  const pipelineValue = leads.reduce(
    (sum, lead) => sum + lead.dealValue,
    0
  )

  const wonDeals = leads.filter((l) => l.status === "Won")

  const wonValue = wonDeals.reduce(
    (sum, l) => sum + l.dealValue,
    0
  )

  return (

    <div className="grid md:grid-cols-3 gap-6">

      <Card className="p-6">

        <p className="text-sm text-muted-foreground">
          Pipeline Value
        </p>

        <p className="text-2xl font-bold">
          ₹{pipelineValue.toLocaleString()}
        </p>

      </Card>

      <Card className="p-6">

        <p className="text-sm text-muted-foreground">
          Won Deals
        </p>

        <p className="text-2xl font-bold">
          ₹{wonValue.toLocaleString()}
        </p>

      </Card>

      <Card className="p-6">

        <p className="text-sm text-muted-foreground">
          Active Leads
        </p>

        <p className="text-2xl font-bold">
          {leads.length}
        </p>

      </Card>

    </div>

  )

}