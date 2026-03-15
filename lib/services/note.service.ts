import { api } from "@/lib/api"

export interface Note {
  id: string
  content: string
  leadId?: string
  createdAt: string
}

/*
=====================================
Get Notes
=====================================
*/

export const getNotes = async (leadId?: string) => {
  return api.get("/notes", leadId ? { leadId } : {})
}

/*
=====================================
Create Note
=====================================
*/

export const createNote = async (data: {
  content: string
  leadId: string
}) => {
  return api.post("/notes", data)
}

/*
=====================================
Delete Note
=====================================
*/

export const deleteNote = async (id: string) => {
  return api.delete(`/notes/${id}`)
}