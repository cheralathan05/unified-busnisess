'use client'

import { Message } from "@/hooks/use-app-state"
import { Card } from "@/components/ui/card"

interface Props {
  message: Message
}

export default function MessageItem({ message }: Props) {

  const isUser = message.sender === "user"

  return (

    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>

      <Card className={`p-3 max-w-xs ${isUser ? "bg-primary text-white" : ""}`}>

        <p className="text-sm">
          {message.content}
        </p>

        <p className="text-xs opacity-70 mt-1">

          {new Date(message.timestamp).toLocaleTimeString()}

        </p>

      </Card>

    </div>

  )

}