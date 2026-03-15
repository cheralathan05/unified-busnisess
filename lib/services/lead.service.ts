import { api } from "@/lib/api"

/*
=====================================
Lead Types
=====================================
*/

export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: string
  source?: string
  stageId?: string
  createdAt: string
  updatedAt: string
}

export interface LeadQueryParams {
  page?: number
  limit?: number
}

/*
=====================================
Get All Leads
=====================================
*/

export const getLeads = async (params?: LeadQueryParams) => {
  const res = await api.get("/leads", { params })
  return res.data
}

/*
=====================================
Get Single Lead
=====================================
*/

export const getLead = async (id: string) => {
  const res = await api.get(`/leads/${id}`)
  return res.data
}

/*
=====================================
Get Lead By ID (alias)
=====================================
*/

export const getLeadById = async (id: string) => {
  const res = await api.get(`/leads/${id}`)
  return res.data
}

/*
=====================================
Create Lead
=====================================
*/

export const createLead = async (data: {
  name: string
  email?: string
  phone?: string
  company?: string
  source?: string
  stageId?: string
}) => {
  const res = await api.post("/leads", data)
  return res.data
}

/*
=====================================
Update Lead
=====================================
*/

export const updateLead = async (
  id: string,
  data: Partial<Lead>
) => {
  const res = await api.put(`/leads/${id}`, data)
  return res.data
}

/*
=====================================
Delete Lead
=====================================
*/

export const deleteLead = async (id: string) => {
  const res = await api.delete(`/leads/${id}`)
  return res.data
}

/*
=====================================
Search Leads
=====================================
*/

export const searchLeads = async (query: string) => {
  const res = await api.get("/leads/search", {
    params: { q: query }
  })
  return res.data
}

/*
=====================================
Lead Activities
=====================================
*/

export const getLeadActivities = async (id: string) => {
  const res = await api.get(`/leads/${id}/activities`)
  return res.data
}

/*
=====================================
Convert Lead to Deal
=====================================
*/

export const convertLeadToDeal = async (id: string) => {
  const res = await api.post(`/leads/${id}/convert`)
  return res.data
}

/*
=====================================
Assign Lead
=====================================
*/

export const assignLead = async (
  leadId: string,
  userId: string
) => {
  const res = await api.put(`/leads/${leadId}/assign`, {
    userId
  })
  return res.data
}