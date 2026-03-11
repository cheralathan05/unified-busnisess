'use client'

import { useAppState } from "@/hooks/use-app-state"

import { AlertTriangle } from "lucide-react"

export default function FollowupAlert(){

const {leads}=useAppState()

const staleLeads=leads.filter(l=>{

const days=
(Date.now()-new Date(l.createdAt).getTime())
/86400000

return days>3 && l.status!=="Won"

})

if(staleLeads.length===0)return null

return(

<div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">

<AlertTriangle className="w-4 h-4 text-yellow-400"/>

<span className="text-sm">

{staleLeads.length} leads need follow-up

</span>

</div>

)

}