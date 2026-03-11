'use client'

interface Props {
  score: number
}

export default function LeadHeat({ score }: Props) {

  let label = "Cold"
  let color = "text-blue-400"

  if (score > 80) {
    label = "Hot"
    color = "text-red-500"
  }

  else if (score > 50) {
    label = "Warm"
    color = "text-yellow-500"
  }

  return (

    <span className={`text-xs font-medium ${color}`}>

      {label}

    </span>

  )

}