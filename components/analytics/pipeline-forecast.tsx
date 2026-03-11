'use client'

import { Card } from "@/components/ui/card"
import { useAppState } from "@/hooks/use-app-state"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip
} from "recharts"

export default function PipelineChart() {

  const { leads } = useAppState()

  const stages = ["New","Contacted","Proposal","Negotiation","Won","Lost"]

  const data = stages.map((stage) => ({
    stage,
    value: leads.filter((l) => l.status === stage).length
  }))

  return (

    <Card className="p-6 h-80">

      <h3 className="font-semibold mb-4">
        Sales Pipeline
      </h3>

      <ResponsiveContainer width="100%" height="100%">

        <BarChart data={data}>

          <XAxis dataKey="stage" />

          <Tooltip />

          <Bar dataKey="value" fill="#10b981" />

        </BarChart>

      </ResponsiveContainer>

    </Card>

  )

}