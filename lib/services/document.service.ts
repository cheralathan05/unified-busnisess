import { api } from "@/lib/api"

export interface CRMDocument {

  id: string
  name: string
  type: string
  size: number
  url: string
  leadId?: string
  createdAt?: string

}

export const getDocuments = (leadId?: string) =>
  api.get("/documents", leadId ? { leadId } : {})

export const uploadDocument = (formData: FormData) =>
  api.post("/documents", formData)

export const deleteDocument = (id: string) =>
  api.delete(`/documents/${id}`)