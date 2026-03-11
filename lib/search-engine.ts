import { Lead, Task, Payment } from "@/hooks/use-app-state"

export function searchAll(

  query: string,
  leads: Lead[],
  tasks: Task[],
  payments: Payment[]

) {

  const q = query.toLowerCase()

  return {

    leads: leads.filter((l) =>
      l.name.toLowerCase().includes(q)
    ),

    tasks: tasks.filter((t) =>
      t.title.toLowerCase().includes(q)
    ),

    payments: payments.filter((p) =>
      p.customerId.toLowerCase().includes(q)
    )

  }

}