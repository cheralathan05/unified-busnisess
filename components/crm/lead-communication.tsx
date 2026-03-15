'use client'

import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
createActivity,
getLeadActivities,
Activity
} from "@/lib/services/activity.service"

interface Props{

leadId:string

}

export default function LeadCommunication({leadId}:Props){

const [messages,setMessages] =
useState<Activity[]>([])

const [text,setText] = useState("")

const [loading,setLoading] =
useState(true)

useEffect(()=>{

loadMessages()

},[leadId])

async function loadMessages(){

try{

const res = await getLeadActivities(leadId)

setMessages(res.data || [])

}catch(err){

console.error("Load messages failed",err)

}finally{

setLoading(false)

}

}

async function send(){

if(!text.trim()) return

try{

const res = await createActivity({

type:"MESSAGE_SENT",
description:text,
leadId

})

setMessages(prev=>[res.data,...prev])

setText("")

}catch(err){

console.error("Send message failed",err)

}

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

{loading ? (

<p className="text-sm text-muted-foreground">
Loading messages...
</p>

) : (

<div className="space-y-1">

{messages.map((m)=>(
<p key={m.id}>
{m.description}
</p>
))}

</div>

)}

</div>

)
}