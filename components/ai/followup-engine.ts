import { Lead } from "@/hooks/use-app-state"

export function getFollowUpLeads(leads: Lead[]) {

  const now = new Date()

  return leads.filter((lead) => {

    const created = new Date(lead.createdAt)

    const diffDays =
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)

    return diffDays > 3 && lead.status !== "Won"

  })

}