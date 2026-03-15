import { api } from "@/lib/api"

/*
=====================================
Deal Type
=====================================
*/

export interface Deal {
  id: string
  title: string
  value?: number
  stage?: string
  leadId: string
  businessId?: string
  createdAt: string
  updatedAt: string
}

/*
=====================================
Get All Deals
=====================================
*/

export const getDeals = async () => {
  return api.get("/deals")
}

/*
=====================================
Create Deal
=====================================
*/

export const createDeal = async (data: Partial<Deal>) => {
  return api.post("/deals", data)
}

/*
=====================================
Update Deal
=====================================
*/

export const updateDeal = async (
  id: string,
  data: Partial<Deal>
) => {
  return api.put(`/deals/${id}`, data)
}

/*
=====================================
Delete Deal
=====================================
*/

export const deleteDeal = async (id: string) => {
  return api.delete(`/deals/${id}`)
}