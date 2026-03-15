import { api } from "@/lib/api"

/*
=====================================
Notification Type
=====================================
*/

export interface Notification {
  id: string
  title: string
  message: string
  type?: string
  isRead: boolean
  createdAt: string
}

/*
=====================================
Get Notifications
=====================================
*/

export const getNotifications = async () => {
  return api.get("/notifications")
}

/*
=====================================
Mark Notification As Read
=====================================
*/

export const markAsRead = async (id: string) => {
  return api.put(`/notifications/${id}/read`, {})
}