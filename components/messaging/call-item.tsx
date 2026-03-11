'use client'

import { Card } from "@/components/ui/card"
import { Phone } from "lucide-react"

import { CallLog, formatDuration } from "./message-utils"

interface Props {
  call: CallLog
}

export default function CallItem({ call }: Props) {

  return (

    <Card className="p-3 flex justify-between">

      <div className="flex gap-2 items-center">

        <Phone className="w-4 h-4"/>

        <span>

          Call • {formatDuration(call.duration)}

        </span>

      </div>

      <span className="text-xs text-muted-foreground">

        {new Date(call.createdAt).toLocaleDateString()}

      </span>

    </Card>

  )

}