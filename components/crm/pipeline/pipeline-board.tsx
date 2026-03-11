'use client'

import { DndContext } from "@dnd-kit/core"

import { useAppState } from "@/hooks/use-app-state"

import PipelineColumn from "./pipeline-column"
import { PIPELINE_STAGES } from "./pipeline-utils"

export default function PipelineBoard() {

  const { leads, updateLead } = useAppState()

  function handleDragEnd(event: any) {

    const { active, over } = event

    if (!over) return

    const leadId = active.id
    const newStage = over.id

    updateLead(leadId, {
      status: newStage
    })

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
            />

          )

        })}

      </div>

    </DndContext>

  )

}