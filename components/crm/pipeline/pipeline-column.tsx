'use client'

import { useDroppable } from "@dnd-kit/core"

import PipelineCard from "./pipeline-card"
import { Lead } from "@/hooks/use-app-state"

interface Props {
  stage: string
  leads: Lead[]
}

export default function PipelineColumn({ stage, leads }: Props) {

  const { setNodeRef } = useDroppable({
    id: stage
  })

  return (

    <div className="flex flex-col bg-muted/30 rounded-lg p-3 min-h-[500px]">

      <h3 className="font-semibold mb-3">
        {stage} ({leads.length})
      </h3>

      <div ref={setNodeRef} className="space-y-2">

        {leads.map((lead) => (

          <PipelineCard
            key={lead.id}
            lead={lead}
          />

        ))}

      </div>

    </div>

  )

}