'use client'

import Link from "next/link"

import { Lead, Task, Payment } from "@/hooks/use-app-state"

interface Props {
  leads: Lead[]
  tasks: Task[]
  payments: Payment[]
}

export default function SearchResults({ leads, tasks, payments }: Props) {

  return (

    <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">

      {/* Leads */}

      {leads.length > 0 && (

        <div className="p-3 border-b">

          <p className="text-xs text-muted-foreground mb-2">
            Leads
          </p>

          {leads.map((lead) => (

            <Link
              key={lead.id}
              href={`/crm/${lead.id}`}
              className="block p-2 rounded hover:bg-muted text-sm"
            >
              {lead.name} — {lead.company}
            </Link>

          ))}

        </div>

      )}

      {/* Tasks */}

      {tasks.length > 0 && (

        <div className="p-3 border-b">

          <p className="text-xs text-muted-foreground mb-2">
            Tasks
          </p>

          {tasks.map((task) => (

            <div
              key={task.id}
              className="p-2 text-sm rounded hover:bg-muted"
            >
              {task.title}
            </div>

          ))}

        </div>

      )}

      {/* Payments */}

      {payments.length > 0 && (

        <div className="p-3">

          <p className="text-xs text-muted-foreground mb-2">
            Payments
          </p>

          {payments.map((payment) => (

            <div
              key={payment.id}
              className="p-2 text-sm rounded hover:bg-muted"
            >
              ₹{payment.amount} — {payment.customerId}
            </div>

          ))}

        </div>

      )}

      {leads.length === 0 && tasks.length === 0 && payments.length === 0 && (

        <p className="p-4 text-sm text-muted-foreground">
          No results found
        </p>

      )}

    </div>

  )

}