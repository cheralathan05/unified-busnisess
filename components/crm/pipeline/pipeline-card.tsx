'use client'

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { Lead } from "@/hooks/use-app-state"
import { Card } from "@/components/ui/card"

interface Props {
  lead: Lead
}

export default function PipelineCard({ lead }: Props) {

  const { attributes, listeners, setNodeRef, transform } =
    useDraggable({
      id: lead.id
    })

  const style = {
    transform: CSS.Translate.toString(transform)
  }

  return (

    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 cursor-grab hover:shadow-lg"
    >

      <h4 className="font-semibold text-sm">
        {lead.name}
      </h4>

      <p className="text-xs text-muted-foreground">
        {lead.company}
      </p>

      <p className="text-sm font-bold mt-2">
        ₹{lead.dealValue.toLocaleString()}
      </p>

    </Card>

  )

}