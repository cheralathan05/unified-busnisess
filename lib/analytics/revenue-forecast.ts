import { Lead } from "@/lib/services/lead.service"

/*
=====================================
Revenue Forecast Calculator
=====================================
*/

export function calculateRevenueForecast(leads: Lead[]) {

  let expected = 0
  let closed = 0
  let lost = 0

  leads.forEach((lead) => {

    const value = lead.value ?? 0

    if (lead.status === "WON") {
      closed += value
    }

    else if (lead.status === "LOST") {
      lost += value
    }

    else {
      expected += value
    }

  })

  return {
    expected,
    closed,
    lost
  }

}