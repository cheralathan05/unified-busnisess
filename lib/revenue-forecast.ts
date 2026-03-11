import { Lead } from "@/hooks/use-app-state"

export function calculateRevenueForecast(leads: Lead[]) {

  let expected = 0
  let closed = 0
  let lost = 0

  leads.forEach((lead) => {

    if (lead.status === "Won")
      closed += lead.dealValue

    else if (lead.status === "Lost")
      lost += lead.dealValue

    else
      expected += lead.dealValue

  })

  return {
    expected,
    closed,
    lost
  }

}