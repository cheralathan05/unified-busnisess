'use client'

import { useDroppable } from "@dnd-kit/core"

import PipelineCard from "./pipeline-card"

interface Lead {

  id: string
  name: string
  email?: string
  phone?: string
  source?: string
  status: string
  value?: number

}

interface Props {

  stage: string
  leads: Lead[]

}

export default function PipelineColumn({

  stage,
  leads

}: Props) {

  const { setNodeRef } = useDroppable({

    id: stage

  })

  return (

    <div className="flex flex-col bg-muted/30 rounded-lg p-3 min-h-[500px]">

      {/* Stage Header */}

      <h3 className="font-semibold mb-3">

        {stage} ({leads.length})

      </h3>

      {/* Drop Zone */}

      <div
        ref={setNodeRef}
        className="space-y-2 flex-1"
      >

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