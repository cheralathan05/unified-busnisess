'use client'

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { Card } from "@/components/ui/card"

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

  lead: Lead

}

export default function PipelineCard({ lead }: Props) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform
  } = useDraggable({
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

      {/* Lead Name */}

      <h4 className="font-semibold text-sm">

        {lead.name}

      </h4>

      {/* Lead Source */}

      {lead.source && (

        <p className="text-xs text-muted-foreground">

          {lead.source}

        </p>

      )}

      {/* Deal Value */}

      <p className="text-sm font-bold mt-2">

        ₹{(lead.value ?? 0).toLocaleString("en-IN")}

      </p>

    </Card>

  )

}