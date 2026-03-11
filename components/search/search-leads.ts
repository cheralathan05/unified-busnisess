import { Lead } from "@/hooks/use-app-state"

export function searchLeads(leads: Lead[], query: string) {

  const q = query.toLowerCase()

  return leads.filter((lead) =>
    lead.name.toLowerCase().includes(q) ||
    lead.email.toLowerCase().includes(q) ||
    lead.company.toLowerCase().includes(q) ||
    lead.phone.toLowerCase().includes(q)
  )

}