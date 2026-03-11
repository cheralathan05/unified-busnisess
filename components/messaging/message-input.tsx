'use client'

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useAppState } from "@/hooks/use-app-state"

import { Send } from "lucide-react"

interface Props {
  leadId: string
}

export default function MessageInput({ leadId }: Props) {

  const [text, setText] = useState("")

  const { addMessage } = useAppState()

  function sendMessage() {

    if (!text) return

    addMessage({

      leadId,
      content: text,
      sender: "user"

    })

    setText("")

  }

  return (

    <div className="flex gap-2">

      <Input
        placeholder="Type message..."
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <Button onClick={sendMessage} size="icon">

        <Send className="w-4 h-4"/>

      </Button>

    </div>

  )

}