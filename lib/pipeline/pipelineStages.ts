import { api } from "@/lib/api"

/*
=====================================
Pipeline Stage Type
=====================================
*/

export interface PipelineStage {
  id: string
  name: string
  order: number
}

/*
=====================================
Fetch Pipeline Stages From Backend
=====================================
*/

export async function getPipelineStages(): Promise<PipelineStage[]> {

  const res = await api.get("/pipeline")

  return res.data || []

}

/*
=====================================
Stage Probability Logic
=====================================
*/

export function getStageProbability(stage: string) {

  switch (stage) {

    case "New":
      return 10

    case "Contacted":
      return 30

    case "Proposal":
      return 60

    case "Negotiation":
      return 80

    case "Won":
      return 100

    default:
      return 0

  }

}