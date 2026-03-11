'use client'

import { Card } from "@/components/ui/card"
import { useAppState } from "@/hooks/use-app-state"

export default function RevenueForecast() {

  const { leads } = useAppState()

  const expected = leads.reduce(
    (sum, lead) => sum + lead.dealValue,
    0
  )

  const atRisk = leads
    .filter((l) => l.status === "Lost")
    .reduce((sum, l) => sum + l.dealValue, 0)

  return (

    <Card className="p-6 space-y-3">

      <h3 className="font-semibold">
        Revenue Forecast
      </h3>

      <p>

        This Month:
        <b> ₹{expected.toLocaleString()}</b>

      </p>

      <p>

        Deals at Risk:
        <b> ₹{atRisk.toLocaleString()}</b>

      </p>

    </Card>

  )

}