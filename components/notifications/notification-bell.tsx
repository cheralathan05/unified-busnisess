'use client'

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import NotificationPanel from "./notification-panel"

import { api } from "@/lib/api"

export default function NotificationBell() {

const [open,setOpen] = useState(false)
const [unreadCount,setUnreadCount] = useState(0)

useEffect(()=>{
loadUnread()
},[])

async function loadUnread(){

try{

const res = await api.get("/notifications/unread-count")

setUnreadCount(res.count || 0)

}catch(err){

console.error("Unread notification error",err)

}

}

function togglePanel(){

setOpen(!open)

if(!open){
loadUnread()
}

}

return(

<div className="relative">

<Button
variant="ghost"
size="icon"
onClick={togglePanel}
>

<Bell className="w-5 h-5"/>

{unreadCount > 0 && (

<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] bg-red-500 text-white flex items-center justify-center">

{unreadCount}

</span>

)}

</Button>

{open && (

<NotificationPanel
onRead={loadUnread}
/>

)}

</div>

)

}