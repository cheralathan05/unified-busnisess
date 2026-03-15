import { api } from "@/lib/api"

export interface Task {
  id: string
  title: string
  description?: string
  status: "PENDING" | "COMPLETED"
  dueDate?: string
  leadId?: string
  createdAt: string
}

/*
=====================================
Get Tasks
=====================================
*/

export const getTasks = async () => {
  return api.get("/tasks")
}

/*
=====================================
Create Task
=====================================
*/

export const createTask = async (data: Partial<Task>) => {
  return api.post("/tasks", data)
}

/*
=====================================
Update Task
=====================================
*/

export const updateTask = async (
  id: string,
  data: Partial<Task>
) => {
  return api.put(`/tasks/${id}`, data)
}

/*
=====================================
Delete Task
=====================================
*/

export const deleteTask = async (id: string) => {
  return api.delete(`/tasks/${id}`)
}