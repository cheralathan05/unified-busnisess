import { create } from "zustand"

/* ---------------- TYPES ---------------- */

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  dealValue: number
  status: "New" | "Contacted" | "Proposal" | "Negotiation" | "Won" | "Lost"
  notes: string
  createdAt: Date
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: Date
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
  date: Date
  notes: string
  status: "pending" | "completed" | "failed"
}

export interface Message {
  id: string
  leadId: string
  content: string
  sender: "user" | "contact"
  timestamp: Date
}

/* ---------------- STORE TYPE ---------------- */

interface AppState {

  leads: Lead[]
  tasks: Task[]
  payments: Payment[]
  messages: Message[]

  /* lead actions */

  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  deleteLead: (id: string) => void
  getLeadById: (id: string) => Lead | undefined

  /* task actions */

  addTask: (task: Omit<Task, "id">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasksByLead: (leadId: string) => Task[]

  /* payment actions */

  addPayment: (payment: Omit<Payment, "id">) => void
  updatePayment: (id: string, updates: Partial<Payment>) => void
  deletePayment: (id: string) => void

  /* message actions */

  addMessage: (message: Omit<Message, "id" | "timestamp">) => void
  deleteMessage: (id: string) => void

  /* analytics */

  getTotalRevenue: () => number
  getLeadCount: () => number
  getTaskCount: () => number
  getOverdueTasks: () => Task[]
}

/* ---------------- STORE ---------------- */

export const useAppState = create<AppState>((set, get) => ({

  /* ---------------- LEADS ---------------- */

  leads: [

    {
      id: "1",
      name: "Ravi Kumar",
      email: "ravi@example.com",
      phone: "+91-9876543210",
      company: "Tech Solutions",
      dealValue: 50000,
      status: "Proposal",
      notes: "Interested in website development",
      createdAt: new Date("2024-01-15")
    },

    {
      id: "2",
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91-9876543211",
      company: "Fashion Retail",
      dealValue: 75000,
      status: "Contacted",
      notes: "E-commerce platform needed",
      createdAt: new Date("2024-01-20")
    },

    {
      id: "3",
      name: "Amit Singh",
      email: "amit@example.com",
      phone: "+91-9876543212",
      company: "Logistics Co.",
      dealValue: 120000,
      status: "Won",
      notes: "Closed deal for tracking system",
      createdAt: new Date("2024-01-10")
    }

  ],

  addLead: (lead) =>
    set((state) => ({
      leads: [
        {
          ...lead,
          id: Date.now().toString(),
          createdAt: new Date()
        },
        ...state.leads
      ]
    })),

  updateLead: (id, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...updates } : lead
      )
    })),

  deleteLead: (id) =>
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== id)
    })),

  getLeadById: (id) => {
    return get().leads.find((lead) => lead.id === id)
  },

  /* ---------------- TASKS ---------------- */

  tasks: [],

  addTask: (task) =>
    set((state) => ({
      tasks: [
        {
          ...task,
          id: Date.now().toString()
        },
        ...state.tasks
      ]
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id)
    })),

  getTasksByLead: (leadId) => {
    return get().tasks.filter((task) => task.leadId === leadId)
  },

  /* ---------------- PAYMENTS ---------------- */

  payments: [],

  addPayment: (payment) =>
    set((state) => ({
      payments: [
        {
          ...payment,
          id: Date.now().toString()
        },
        ...state.payments
      ]
    })),

  updatePayment: (id, updates) =>
    set((state) => ({
      payments: state.payments.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )
    })),

  deletePayment: (id) =>
    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id)
    })),

  /* ---------------- MESSAGES ---------------- */

  messages: [],

  addMessage: (message) =>
    set((state) => ({
      messages: [
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date()
        },
        ...state.messages
      ]
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id)
    })),

  /* ---------------- ANALYTICS ---------------- */

  getTotalRevenue: () =>
    get().payments.reduce(
      (sum, p) => (p.status === "completed" ? sum + p.amount : sum),
      0
    ),

  getLeadCount: () => get().leads.length,

  getTaskCount: () => get().tasks.length,

  getOverdueTasks: () => {

    const now = new Date()

    return get().tasks.filter(
      (task) => task.dueDate < now && task.status !== "done"
    )

  }

}))