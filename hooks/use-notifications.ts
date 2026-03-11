'use client'

import { create } from "zustand"

export interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

interface NotificationState {

  notifications: Notification[]

  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void

  markAsRead: (id: string) => void

  clearNotifications: () => void

}

export const useNotifications = create<NotificationState>((set) => ({

  notifications: [

    {
      id: "1",
      title: "Lead Activity",
      message: "Ravi Kumar opened your proposal",
      read: false,
      createdAt: new Date()
    },

    {
      id: "2",
      title: "Payment Received",
      message: "₹50,000 payment received from Tech Solutions",
      read: false,
      createdAt: new Date()
    }

  ],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Date.now().toString(),
          read: false,
          createdAt: new Date()
        },
        ...state.notifications
      ]
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    })),

  clearNotifications: () =>
    set({
      notifications: []
    })

}))