import { api } from "@/lib/api"

/*
=====================================
Dashboard Analytics
=====================================
*/

export const getDashboardAnalytics = async () => {
  return api.get("/analytics/dashboard")
}

/*
=====================================
Pipeline Analytics
=====================================
*/

export const getPipelineAnalytics = async () => {
  return api.get("/analytics/pipeline")
}