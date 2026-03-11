'use client'

import { Card } from "@/components/ui/card"
import { useAppState } from "@/hooks/use-app-state"

export default function ConversionRate() {

  const { leads } = useAppState()

  const won = leads.filter((l) => l.status === "Won").length

  const rate = leads.length === 0
    ? 0
    : ((won / leads.length) * 100).toFixed(1)

  return (

    <Card className="p-6">

      <h3 className="font-semibold mb-2">
        Conversion Rate
      </h3>

      <p className="text-3xl font-bold">
        {rate}%
      </p>

      <p className="text-sm text-muted-foreground">
        Leads converted to deals
      </p>

    </Card>

  )

}