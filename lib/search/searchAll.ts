import { Lead } from "@/lib/services/lead.service"
import { Task } from "@/lib/services/task.service"
import { Payment } from "@/lib/services/payment.service"

/*
=====================================
Global Search Utility
=====================================
*/

export function searchAll(
  query: string,
  leads: Lead[],
  tasks: Task[],
  payments: Payment[]
) {

  if (!query?.trim()) {
    return { leads, tasks, payments }
  }

  const q = query.toLowerCase()

  return {

    leads: leads.filter((l) =>
      [
        l.name,
        l.email,
        l.phone,
        l.company
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(q)
        )
    ),

    tasks: tasks.filter((t) =>
      [
        t.title,
        t.description
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(q)
        )
    ),

    payments: payments.filter((p) =>
      [
        p.customerId,
        p.status,
        String(p.amount)
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(q)
        )
    )

  }
}