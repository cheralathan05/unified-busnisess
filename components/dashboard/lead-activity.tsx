'use client'

import { useEffect, useState } from "react"

import {
Card,
CardContent,
CardHeader,
CardTitle
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import {
ArrowRight,
MessageSquare,
Phone,
Mail
} from 'lucide-react'

import { getActivities, Activity } from "@/lib/services/activity.service"

export function LeadActivity(){

const [activities,setActivities] = useState<Activity[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadActivities()
},[])

async function loadActivities(){

try{

const res = await getActivities()

setActivities(res.data || [])

}catch(err){

console.error("Activity load error",err)

}finally{

setLoading(false)

}

}

function getIcon(type:string){

switch(type){

case "EMAIL_SENT":
return Mail

case "CALL_MADE":
return Phone

case "NOTE_ADDED":
return MessageSquare

default:
return ArrowRight

}

}

if(loading){

return(

<Card className="p-6">
Loading activity...
</Card>

)

}

return(

<Card className="bg-card border-border">

<CardHeader className="pb-4">

<div className="flex items-center justify-between">

<CardTitle>
Recent Activity
</CardTitle>

<Button variant="ghost" size="sm">
View All
</Button>

</div>

</CardHeader>

<CardContent>

<div className="space-y-3">

{activities.slice(0,6).map((activity)=>{

const Icon = getIcon(activity.type)

const initials =
activity.description
?.split(" ")
?.slice(0,2)
?.map(w=>w[0])
?.join("")
?.toUpperCase()

return(

<div
key={activity.id}
className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors"
>

<Avatar className="w-8 h-8">

<AvatarFallback className="text-xs font-semibold">

{initials || "AC"}

</AvatarFallback>

</Avatar>

<div className="flex-1">

<p className="text-sm font-medium">

{activity.description}

</p>

<p className="text-xs text-muted-foreground">

{new Date(activity.createdAt).toLocaleString()}

</p>

</div>

<Icon className="w-4 h-4 text-muted-foreground mt-1"/>

</div>

)

})}

{activities.length === 0 && (

<p className="text-sm text-muted-foreground text-center py-4">

No recent activity

</p>

)}

</div>

</CardContent>

</Card>

)

}