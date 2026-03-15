'use client'

import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import {
 Tabs,
 TabsContent,
 TabsList,
 TabsTrigger
} from '@/components/ui/tabs'

import {
 Mail,
 Phone,
 MessageSquare,
 Phone as CallIcon,
 X
} from 'lucide-react'

import { Lead, getLeadById } from "@/lib/services/lead.service"
import { getLeadActivities } from "@/lib/services/activity.service"
import { getNotes } from "@/lib/services/note.service"

import { formatCurrency } from "@/lib/utils/currency"
import { formatDate } from "@/lib/utils/date"

export function LeadProfile({
 leadId,
 onClose
}:{
 leadId:string
 onClose:()=>void
}){

 const [lead,setLead] = useState<Lead | null>(null)
 const [activities,setActivities] = useState<any[]>([])
 const [notes,setNotes] = useState<any[]>([])
 const [loading,setLoading] = useState(true)

 useEffect(()=>{
  loadLead()
 },[leadId])

 async function loadLead(){

  try{

   const res = await getLeadById(leadId)

   setLead(res.data)

   const act = await getLeadActivities(leadId)
   setActivities(act.data || [])

   const noteRes = await getNotes(leadId)
   setNotes(noteRes.data || [])

  }catch(err){

   console.error("Lead profile load error",err)

  }finally{

   setLoading(false)

  }

 }

 if(loading){

  return(
   <Card className="p-6">
    Loading...
   </Card>
  )

 }

 if(!lead) return null

 const initials =
 lead.name
  .split(" ")
  .map(n=>n[0])
  .join("")
  .slice(0,2)
  .toUpperCase()

 return(

<Card className="bg-card border-border h-full flex flex-col">

{/* HEADER */}

<CardHeader className="pb-4 border-b border-border flex-row items-start justify-between">

<div className="flex items-start gap-3 flex-1">

<Avatar className="w-10 h-10">

<AvatarFallback>
{initials}
</AvatarFallback>

</Avatar>

<div className="flex-1 min-w-0">

<CardTitle className="text-lg">
{lead.name}
</CardTitle>

<p className="text-sm text-muted-foreground">
{lead.company}
</p>

</div>

</div>

<Button
variant="ghost"
size="icon"
onClick={onClose}
className="h-8 w-8"
>

<X className="w-4 h-4"/>

</Button>

</CardHeader>

{/* QUICK ACTIONS */}

<div className="p-4 border-b border-border space-y-2">

<Button className="w-full gap-2">

<MessageSquare className="w-4 h-4"/>

Send Message

</Button>

<Button
className="w-full gap-2"
variant="outline"
>

<CallIcon className="w-4 h-4"/>

Call

</Button>

</div>

{/* TABS */}

<div className="flex-1 overflow-y-auto">

<Tabs defaultValue="details">

<TabsList className="w-full border-b rounded-none">

<TabsTrigger value="details">
Details
</TabsTrigger>

<TabsTrigger value="activity">
Activity
</TabsTrigger>

<TabsTrigger value="notes">
Notes
</TabsTrigger>

</TabsList>

{/* DETAILS */}

<TabsContent value="details" className="p-4 space-y-4">

<div>

<p className="text-xs font-semibold text-muted-foreground mb-2">
CONTACT
</p>

<div className="space-y-2">

{lead.email && (

<div className="flex items-center gap-2">

<Mail className="w-4 h-4"/>

<p className="text-sm">
{lead.email}
</p>

</div>

)}

{lead.phone && (

<div className="flex items-center gap-2">

<Phone className="w-4 h-4"/>

<p className="text-sm">
{lead.phone}
</p>

</div>

)}

</div>

</div>

<Separator/>

<div>

<p className="text-xs text-muted-foreground">
Status
</p>

<Badge className="mt-1">
{lead.status}
</Badge>

</div>

<div>

<p className="text-xs text-muted-foreground">
Deal Value
</p>

<p className="text-lg font-semibold">

{formatCurrency(lead.value || 0)}

</p>

</div>

</TabsContent>

{/* ACTIVITY */}

<TabsContent value="activity" className="p-4 space-y-3">

{activities.length === 0 && (

<p className="text-sm text-muted-foreground">

No activity yet

</p>

)}

{activities.map((a)=>(
<div key={a.id}>

<p className="text-sm">
{a.description}
</p>

<p className="text-xs text-muted-foreground">

{formatDate(a.createdAt)}

</p>

<Separator className="mt-2"/>

</div>
))}

</TabsContent>

{/* NOTES */}

<TabsContent value="notes" className="p-4 space-y-3">

{notes.length === 0 && (

<p className="text-sm text-muted-foreground">
No notes yet
</p>

)}

{notes.map((note)=>(
<div key={note.id}>

<p className="text-sm">
{note.content}
</p>

<p className="text-xs text-muted-foreground">

{formatDate(note.createdAt)}

</p>

<Separator className="mt-2"/>

</div>
))}

</TabsContent>

</Tabs>

</div>

</Card>

)

}