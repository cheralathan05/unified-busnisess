/*
=====================================
Pipeline Stages
Matches Backend LeadStatus Enum
=====================================
*/

export const PIPELINE_STAGES = [

  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST"

] as const


/*
=====================================
Stage Label (UI Friendly)
=====================================
*/

export function getStageLabel(stage: string) {

  switch (stage) {

    case "NEW":
      return "New"

    case "CONTACTED":
      return "Contacted"

    case "QUALIFIED":
      return "Qualified"

    case "WON":
      return "Won"

    case "LOST":
      return "Lost"

    default:
      return stage

  }

}


/*
=====================================
Stage Probability (Sales Forecast)
=====================================
*/

export function getStageProbability(stage: string) {

  switch (stage) {

    case "NEW":
      return 10

    case "CONTACTED":
      return 30

    case "QUALIFIED":
      return 70

    case "WON":
      return 100

    case "LOST":
      return 0

    default:
      return 0

  }

}