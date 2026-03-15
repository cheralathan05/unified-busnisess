'use client'

import { DndContext } from "@dnd-kit/core"
import { useState } from "react"

import PipelineColumn from "./pipeline-column"
import { PIPELINE_STAGES } from "./pipeline-utils"

import { updateLead } from "@/lib/services/lead.service"

interface Lead {
  id: string
  name: string
  status: string
}

interface Props {
  leads: Lead[]
  refreshLeads: () => void
}

export default function PipelineBoard({

  leads,
  refreshLeads

}: Props) {

  const [loading, setLoading] = useState(false)

  async function updateLeadStage(
    leadId: string,
    newStage: string
  ) {

    try {

      setLoading(true)

      await updateLead(leadId, {
        status: newStage
      })

      refreshLeads()

    } catch (err) {

      console.error("Pipeline update failed", err)

    } finally {

      setLoading(false)

    }

  }

  function handleDragEnd(event: any) {

    const { active, over } = event

    if (!over) return

    const leadId = active.id
    const newStage = over.id

    updateLeadStage(leadId, newStage)

  }

  return (

    <DndContext onDragEnd={handleDragEnd}>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

        {PIPELINE_STAGES.map((stage) => {

          const stageLeads = leads.filter(
            (l) => l.status === stage
          )

          return (

            <PipelineColumn
              key={stage}
              stage={stage}
              leads={stageLeads}
              loading={loading}
            />

          )

        })}

      </div>

    </DndContext>

  )

}