'use client'

import MessageThread from "./message-thread"

interface Props {
  leadId: string
}

export default function EmailThread({ leadId }: Props) {

  return (

    <div className="space-y-4">

      <h3 className="font-semibold">
        Email Conversation
      </h3>

      <MessageThread leadId={leadId}/>

    </div>

  )

}