'use client'

import { useAppState } from "@/hooks/use-app-state"

import MessageItem from "./message-item"
import MessageInput from "./message-input"

interface Props {
  leadId: string
}

export default function MessageThread({ leadId }: Props) {

  const { messages } = useAppState()

  const leadMessages =
    messages.filter(m => m.leadId === leadId)

  return (

    <div className="space-y-3">

      <div className="space-y-2 max-h-[300px] overflow-y-auto">

        {leadMessages.map((msg)=>(
          <MessageItem key={msg.id} message={msg}/>
        ))}

      </div>

      <MessageInput leadId={leadId}/>

    </div>

  )

}