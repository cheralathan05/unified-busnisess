'use client'

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"

import {
getLeads,
Lead
} from "@/lib/services/lead.service"

export default function LeadAutomation(){

const [overdue,setOverdue] = useState<Lead[]>([])

useEffect(()=>{

loadLeads()

},[])

async function loadLeads(){

try{

const res = await getLeads()

const leads = res.data || []

const overdueLeads = leads.filter((lead:any)=>{

if(!lead.nextFollowUp) return false

return new Date(lead.nextFollowUp) < new Date()

})

setOverdue(overdueLeads)

}catch(err){

console.error("Automation load error",err)

}

}

if(overdue.length === 0) return null

return(

<Card className="p-4 border-orange-400">

<h3 className="font-semibold mb-2">

⚠ Automation Alerts

</h3>

<ul className="space-y-1 text-sm">

{overdue.map((lead)=>(
<li key={lead.id}>
Follow-up needed: {lead.name}
</li>
))}

</ul>

</Card>

)

}