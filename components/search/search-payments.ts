import { Payment } from "@/hooks/use-app-state"

export function searchPayments(payments: Payment[], query: string) {

  const q = query.toLowerCase()

  return payments.filter((payment) =>
    payment.customerId.toLowerCase().includes(q) ||
    payment.notes.toLowerCase().includes(q)
  )

}