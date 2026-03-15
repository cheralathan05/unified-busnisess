'use client'

import { useEffect, useState } from "react"

import NotificationItem from "./notification-item"

import {
getNotifications,
markAsRead
} from "@/lib/services/notification.service"

import { api } from "@/lib/api"

interface Notification {

id: string
title: string
message: string
isRead: boolean
createdAt: string

}

export default function NotificationPanel() {

const [notifications,setNotifications] = useState<Notification[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadNotifications()
},[])

async function loadNotifications(){

try{

const res = await getNotifications()

setNotifications(res.data || [])

}catch(err){

console.error("Notification fetch error",err)

}finally{

setLoading(false)

}

}

async function handleRead(id:string){

try{

await markAsRead(id)

setNotifications(prev =>
prev.map(n =>
n.id === id ? {...n,isRead:true} : n
)
)

}catch(err){

console.error("Mark read failed",err)

}

}

async function clearNotifications(){

try{

await api.put("/notifications/read-all")

setNotifications(prev =>
prev.map(n => ({...n,isRead:true}))
)

}catch(err){

console.error("Clear notifications failed",err)

}

}

return (

<div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">

{/* Header */}

<div className="flex items-center justify-between px-4 py-3 border-b">

<p className="font-medium text-sm">
Notifications
</p>

<button
onClick={clearNotifications}
className="text-xs text-muted-foreground hover:text-foreground"
>

Clear

</button>

</div>

{/* List */}

<div className="max-h-80 overflow-y-auto">

{loading && (

<p className="p-4 text-sm text-muted-foreground text-center">
Loading...
</p>

)}

{!loading && notifications.length === 0 && (

<p className="p-4 text-sm text-muted-foreground text-center">
No notifications
</p>

)}

{notifications.map((notification)=> (

<NotificationItem
key={notification.id}
notification={notification}
onClick={()=>handleRead(notification.id)}
/>

))}

</div>

</div>

)

}