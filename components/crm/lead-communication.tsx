'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LeadCommunication(){

const [messages,setMessages] = useState<string[]>([])
const [text,setText] = useState("")

function send(){

setMessages([...messages,text])
setText("")

}

return(

<div className="space-y-3">

<h3 className="font-semibold">
Communication
</h3>

<Input
value={text}
onChange={(e)=>setText(e.target.value)}
placeholder="Send message"
/>

<Button onClick={send}>
Send
</Button>

<div className="space-y-1">

{messages.map((m,i)=>(
<p key={i}>
{m}
</p>
))}

</div>

</div>

)

}