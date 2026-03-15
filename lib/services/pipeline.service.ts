import { api } from "@/lib/api"

export interface PipelineStage {
  id: string
  name: string
  order: number
}

/*
=====================================
Get Pipeline Stages
=====================================
*/

export const getPipelineStages = async () => {
  return api.get("/pipeline")
}

/*
=====================================
Create Pipeline Stage
=====================================
*/

export const createPipelineStage = async (data: Partial<PipelineStage>) => {
  return api.post("/pipeline", data)
}

/*
=====================================
Update Pipeline Stage
=====================================
*/

export const updatePipelineStage = async (
  id: string,
  data: Partial<PipelineStage>
) => {
  return api.put(`/pipeline/${id}`, data)
}

/*
=====================================
Delete Pipeline Stage
=====================================
*/

export const deletePipelineStage = async (id: string) => {
  return api.delete(`/pipeline/${id}`)
}