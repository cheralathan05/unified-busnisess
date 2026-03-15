import { api } from "@/lib/api"

/*
=====================================
Activity Type
=====================================
*/

export interface Activity {

  id: string
  leadId?: string
  type: string
  description: string
  createdAt: string

}

/*
=====================================
Activity API Response
=====================================
*/

interface ActivityResponse {

  success: boolean
  data: Activity[]

}

/*
=====================================
Get All Activities
=====================================
*/

export const getActivities = async (): Promise<ActivityResponse> => {

  return api.get("/activities")

}

/*
=====================================
Get Lead Activities
=====================================
*/

export const getLeadActivities = async (
  leadId: string
): Promise<ActivityResponse> => {

  return api.get(`/leads/${leadId}/activities`)

}

/*
=====================================
Create Activity
=====================================
*/

export const createActivity = async (
  leadId: string,
  type: string,
  description: string
) => {

  return api.post("/activities", {
    leadId,
    type,
    description
  })

}

/*
=====================================
Update Activity
=====================================
*/

export const updateActivity = async (
  id: string,
  data: Partial<Activity>
) => {

  return api.patch(`/activities/${id}`, data)

}

/*
=====================================
Delete Activity
=====================================
*/

export const deleteActivity = async (
  id: string
) => {

  return api.delete(`/activities/${id}`)

}