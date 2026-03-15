import { Lead } from "@/lib/services/lead.service"

/*
=====================================
Leads Needing Follow-Up
=====================================
*/

export function getLeadsNeedingFollowUp(leads: Lead[]) {

  const now = new Date()

  return leads.filter((lead) => {

    const created = new Date(lead.createdAt)

    const diff =
      (now.getTime() - created.getTime()) /
      (1000 * 60 * 60 * 24)

    return diff >= 3 && lead.status !== "WON"

  })

}