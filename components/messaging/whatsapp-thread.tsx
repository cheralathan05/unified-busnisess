'use client'

import MessageThread from "./message-thread"

interface Props {
  leadId: string
}

export default function WhatsAppThread({ leadId }: Props) {

  return (

    <div className="space-y-4">

      <h3 className="font-semibold">
        WhatsApp Chat
      </h3>

      <MessageThread leadId={leadId}/>

    </div>

  )

}