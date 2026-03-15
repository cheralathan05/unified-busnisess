'use client'

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

import { Lead } from "@/lib/services/lead.service"

interface Props {
  lead: Lead
}

function calculateScore(lead: Lead) {

  let score = 0

  /* Deal Value */

  if (lead.value && lead.value > 100000)
    score += 30
  else if (lead.value && lead.value > 50000)
    score += 20
  else if (lead.value && lead.value > 0)
    score += 10

  /* Lead Status */

  switch (lead.status) {

    case "QUALIFIED":
      score += 25
      break

    case "CONTACTED":
      score += 15
      break

    case "NEW":
      score += 5
      break

    case "WON":
      score = 100
      break

    case "LOST":
      score = 0
      break

  }

  /* Company bonus */

  if (lead.company)
    score += 10

  /* Email bonus */

  if (lead.email)
    score += 5

  /* Phone bonus */

  if (lead.phone)
    score += 5

  return Math.min(score, 100)

}

function getScoreLabel(score: number) {

  if (score >= 80) return "Hot"
  if (score >= 50) return "Warm"
  if (score >= 25) return "Cold"

  return "Low"

}

function getScoreColor(score: number) {

  if (score >= 80)
    return "bg-red-500/10 text-red-400 border-red-400/30"

  if (score >= 50)
    return "bg-yellow-500/10 text-yellow-400 border-yellow-400/30"

  if (score >= 25)
    return "bg-blue-500/10 text-blue-400 border-blue-400/30"

  return "bg-gray-500/10 text-gray-400 border-gray-400/30"

}

export default function LeadScore({ lead }: Props) {

  const score = calculateScore(lead)

  const label = getScoreLabel(score)

  const color = getScoreColor(score)

  return (

    <div className="space-y-3">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium">
          Lead Score
        </p>

        <Badge className={color}>
          {label}
        </Badge>

      </div>

      <Progress
        value={score}
        className="h-2"
      />

      <p className="text-xs text-muted-foreground">
        Score: {score}/100
      </p>

    </div>

  )

}