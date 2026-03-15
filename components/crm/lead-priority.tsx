'use client'

import { Badge } from "@/components/ui/badge"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select"

import { updateLead } from "@/lib/services/lead.service"

export type LeadPriority =
 | "LOW"
 | "MEDIUM"
 | "HIGH"
 | "URGENT"

interface Props {

 leadId: string
 value?: LeadPriority
 onUpdated?: () => void

}

const priorityColors: Record<LeadPriority,string> = {

 LOW: "bg-blue-500/10 text-blue-400 border border-blue-500/30",

 MEDIUM: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",

 HIGH: "bg-orange-500/10 text-orange-400 border border-orange-500/30",

 URGENT: "bg-red-500/10 text-red-400 border border-red-500/30"

}

export default function LeadPriority({

 leadId,
 value = "MEDIUM",
 onUpdated

}: Props){

 async function handleChange(priority: LeadPriority){

  try{

   await updateLead(leadId,{
    priority
   })

   onUpdated?.()

  }catch(err){

   console.error("Priority update failed",err)

  }

 }

 return(

  <div className="flex items-center gap-3">

   <Badge className={priorityColors[value]}>
    {value}
   </Badge>

   <Select
    value={value}
    onValueChange={(v)=>handleChange(v as LeadPriority)}
   >

    <SelectTrigger className="w-[140px]">
     <SelectValue placeholder="Priority"/>
    </SelectTrigger>

    <SelectContent>

     <SelectItem value="LOW">
      Low
     </SelectItem>

     <SelectItem value="MEDIUM">
      Medium
     </SelectItem>

     <SelectItem value="HIGH">
      High
     </SelectItem>

     <SelectItem value="URGENT">
      Urgent
     </SelectItem>

    </SelectContent>

   </Select>

  </div>

 )

}