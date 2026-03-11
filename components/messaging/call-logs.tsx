'use client'

import { useState } from "react"

import CallItem from "./call-item"

import { CallLog } from "./message-utils"

import { Button } from "@/components/ui/button"

import { Phone } from "lucide-react"

interface Props {
  leadId: string
}

export default function CallLogs({ leadId }: Props) {

  const [calls, setCalls] =
    useState<CallLog[]>([])

  function addCall() {

    const call: CallLog = {

      id: Date.now().toString(),
      leadId,
      duration: Math.floor(Math.random()*300),
      note: "Follow-up call",
      createdAt: new Date()

    }

    setCalls([call, ...calls])

  }

  return (

    <div className="space-y-3">

      <div className="flex justify-between items-center">

        <h3 className="font-semibold">
          Call Logs
        </h3>

        <Button
          onClick={addCall}
          size="sm"
          className="gap-2"
        >

          <Phone className="w-4 h-4"/>

          Log Call

        </Button>

      </div>

      {calls.map(call => (
        <CallItem key={call.id} call={call}/>
      ))}

    </div>

  )

}