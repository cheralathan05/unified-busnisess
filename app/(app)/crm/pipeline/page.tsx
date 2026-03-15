'use client'

import { useEffect, useState } from "react"

import PipelineBoard from "@/components/crm/pipeline/pipeline-board"

import { getLeads } from "@/lib/services/lead.service"

export default function PipelinePage() {

const [leads,setLeads] = useState<any[]>([])
const [loading,setLoading] = useState(true)

/* Load Leads From Backend */

useEffect(()=>{

loadLeads()

},[])

async function loadLeads(){

try{

const res = await getLeads()

setLeads(res.data || [])

}catch(err){

console.error("Pipeline load error",err)

}

setLoading(false)

}

if(loading){

return(

<div className="p-10 text-center">
Loading pipeline...
</div>

)

}

return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

{/* Header */}

<div className="space-y-1">

<h1 className="text-3xl font-bold">
Sales Pipeline
</h1>

<p className="text-muted-foreground">
Drag leads between stages to manage your sales workflow.
</p>

</div>

{/* Board */}

<PipelineBoard
leads={leads}
onRefresh={loadLeads}
/>

</div>

</div>

</div>

)

}