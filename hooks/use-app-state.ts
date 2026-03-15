import { create } from "zustand"
import { api } from "@/lib/api"

/* ---------------- TYPES ---------------- */

export interface Lead {
id: string
name: string
email: string
phone: string
company: string
dealValue: number
status:
| "New"
| "Contacted"
| "Proposal"
| "Negotiation"
| "Won"
| "Lost"
notes: string
createdAt: string

tags?: string[]
probability?: number

calls?: number
emails?: number

nextFollowUp?: string
}

export interface Task {
id: string
title: string
description: string
dueDate: string
priority: "low" | "medium" | "high"
status: "todo" | "in-progress" | "done"
assignedTo?: string
leadId?: string
}

export interface Payment {
id: string
customerId: string
amount: number
method: "bank" | "card" | "cash" | "other"
date: string
notes: string
status: "pending" | "completed" | "failed"
}

interface AppState {

leads: Lead[]
tasks: Task[]
payments: Payment[]

loading: boolean

/* fetch */

fetchLeads: () => Promise<void>
fetchTasks: () => Promise<void>
fetchPayments: () => Promise<void>

/* lead actions */

addLead: (lead: Partial<Lead>) => Promise<void>
updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
deleteLead: (id: string) => Promise<void>

/* analytics */

getTotalRevenue: () => number
}

/* ---------------- STORE ---------------- */

export const useAppState = create<AppState>((set, get) => ({

leads: [],
tasks: [],
payments: [],

loading: false,

/* ---------------- FETCH DATA ---------------- */

fetchLeads: async () => {

set({ loading: true })

const res = await api.get("/leads")

set({
  leads: res.data || [],
  loading: false
})

},

fetchTasks: async () => {

const res = await api.get("/tasks")

set({
  tasks: res.data || []
})

},

fetchPayments: async () => {

const res = await api.get("/payments")

set({
  payments: res.data || []
})

},

/* ---------------- ADD LEAD ---------------- */

addLead: async (lead) => {

const res = await api.post("/leads", lead)

set((state) => ({
  leads: [res.data, ...state.leads]
}))
},

/* ---------------- UPDATE LEAD ---------------- */

updateLead: async (id, updates) => {

const res = await api.put(`/leads/${id}`, updates)

set((state) => ({
  leads: state.leads.map((lead) =>
    lead.id === id ? res.data : lead
  )
}))

},

/* ---------------- DELETE LEAD ---------------- */

deleteLead: async (id) => {

await api.delete(`/leads/${id}`)

set((state) => ({
  leads: state.leads.filter((l) => l.id !== id)
}))

},

/* ---------------- ANALYTICS ---------------- */

getTotalRevenue: () =>
get().payments.reduce(
(sum, p) => (p.status === "completed" ? sum + p.amount : sum),
0
)

}))
