export const PIPELINE_STAGES = [

  "New",
  "Contacted",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost"

]

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