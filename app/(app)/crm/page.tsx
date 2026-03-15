'use client'

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ActivityFeed from "@/components/crm/activity-feed"
import PipelineAnalytics from "@/components/crm/pipeline-analytics"
import LeadCard from "@/components/crm/lead-card"
import LeadSearch from "@/components/crm/lead-search"
import LeadFilters from "@/components/crm/lead-filters"
import LeadPagination from "@/components/crm/lead-pagination"
import BulkActions from "@/components/crm/bulk-actions"
import LeadPreviewPanel from "@/components/crm/lead-preview-panel"

import SalesIntelligence from "@/components/crm/sales-intelligence"
import LeadAutomation from "@/components/crm/lead-automation"
import RelationshipGraph from "@/components/crm/relationship-graph"
import CommandPalette from "@/components/ui/command-palette"

import { getLeads, deleteLead } from "@/lib/services/lead.service"

import {
Plus,
List,
Kanban as KanbanIcon
} from "lucide-react"

export default function CRMPage(){

/* ---------------- BACKEND DATA ---------------- */

const [leads,setLeads] = useState<any[]>([])
const [loading,setLoading] = useState(true)

/* ---------------- UI STATE ---------------- */

const [view,setView] = useState<'list' | 'kanban'>('list')
const [searchQuery,setSearchQuery] = useState("")
const [statusFilter,setStatusFilter] = useState("all")

const [selectedLeads,setSelectedLeads] = useState<string[]>([])
const [selectedLead,setSelectedLead] = useState<any | null>(null)

const [page,setPage] = useState(1)

const pageSize = 10

/* ---------------- LOAD LEADS ---------------- */

async function loadLeads(){

try{

const res = await getLeads()

setLeads(res.data || [])

}catch(err){

console.error("Failed to fetch leads",err)

}

setLoading(false)

}

useEffect(()=>{

loadLeads()

},[])

/* ---------------- FILTER ---------------- */

const filteredLeads = useMemo(()=>{

return leads
.filter((lead)=>
lead.name?.toLowerCase()
.includes(searchQuery.toLowerCase())
)
.filter((lead)=>
statusFilter === "all"
? true
: lead.status === statusFilter
)

},[leads,searchQuery,statusFilter])

/* ---------------- PAGINATION ---------------- */

const totalPages = Math.ceil(filteredLeads.length / pageSize)

const paginatedLeads = filteredLeads.slice(
(page-1)*pageSize,
page*pageSize
)

/* ---------------- SELECT ---------------- */

function toggleLead(id:string){

setSelectedLeads(prev =>
prev.includes(id)
? prev.filter(l=>l!==id)
: [...prev,id]
)

}

/* ---------------- BULK DELETE ---------------- */

async function handleDelete(ids:string[]){

try{

await Promise.all(
ids.map(id => deleteLead(id))
)

setSelectedLeads([])

loadLeads()

}catch(err){

console.error("Delete failed",err)

}

}

/* ---------------- LOADING ---------------- */

if(loading){

return(

<div className="p-10 text-center">
Loading CRM...
</div>

)

}

/* ---------------- PAGE ---------------- */

return(

<div className="w-full h-full flex">

<div className="flex-1 overflow-y-auto">

<div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">

{/* HEADER */}

<div className="flex items-center justify-between">

<div>

<h1 className="text-3xl font-bold">
CRM & Leads
</h1>

<p className="text-muted-foreground mt-1">
Manage your sales pipeline
</p>

</div>

<Link href="/crm/add-lead">

<Button className="gap-2">

<Plus className="w-4 h-4"/>

Add Lead

</Button>

</Link>

</div>

{/* DASHBOARD BLOCKS */}

<SalesIntelligence />
<LeadAutomation />
<RelationshipGraph />
<ActivityFeed />

{/* SEARCH + FILTER */}

<div className="flex flex-col md:flex-row gap-4 md:items-center">

<LeadSearch
value={searchQuery}
setValue={(v)=>{
setSearchQuery(v)
setPage(1)
}}
/>

<LeadFilters
setStatus={(v)=>{
setStatusFilter(v)
setPage(1)
}}
/>

</div>

{/* VIEW SWITCH */}

<Tabs value={view} onValueChange={(v)=>setView(v as any)}>

<TabsList>

<TabsTrigger value="list">

<List className="w-4 h-4 mr-2"/>
List

</TabsTrigger>

<TabsTrigger value="kanban">

<KanbanIcon className="w-4 h-4 mr-2"/>
Board

</TabsTrigger>

</TabsList>

</Tabs>

{/* BULK ACTIONS */}

{selectedLeads.length > 0 && (

<BulkActions
selectedIds={selectedLeads}
onDelete={handleDelete}
/>

)}

{/* EMPTY */}

{filteredLeads.length === 0 && (

<div className="border rounded-lg p-10 text-center">

<p className="text-muted-foreground">
No leads found
</p>

</div>

)}

{/* LIST */}

{view==="list" && (

<div className="space-y-3">

{paginatedLeads.map((lead)=>(
<LeadCard
key={lead.id}
lead={lead}
selected={selectedLeads.includes(lead.id)}
onSelect={()=>toggleLead(lead.id)}
onClick={()=>setSelectedLead(lead)}
/>
))}

</div>

)}

{/* KANBAN */}

{view==="kanban" && (

<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

{["NEW","CONTACTED","QUALIFIED","WON","LOST"]
.map(status=>{

const columnLeads =
filteredLeads.filter(l => l.status===status)

return(

<div key={status}>

<h3 className="font-semibold mb-2">

{status} ({columnLeads.length})

</h3>

<div className="space-y-2">

{columnLeads.map(lead=>(
<LeadCard
key={lead.id}
lead={lead}
onClick={()=>setSelectedLead(lead)}
/>
))}

</div>

</div>

)

})}

</div>

)}

{/* ANALYTICS */}

<PipelineAnalytics />

{/* PAGINATION */}

{view==="list" && totalPages>1 && (

<LeadPagination
page={page}
setPage={setPage}
/>

)}

</div>

</div>

{/* PREVIEW */}

{selectedLead && (

<LeadPreviewPanel
lead={selectedLead}
onClose={()=>setSelectedLead(null)}
/>

)}

<CommandPalette/>

</div>

)

}