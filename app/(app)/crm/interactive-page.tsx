'use client'

import { useState, useMemo, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import {
Tabs,
TabsContent,
TabsList,
TabsTrigger
} from '@/components/ui/tabs'

import {
getLeads,
createLead,
updateLead,
deleteLead
} from '@/lib/services/lead.service'

import { AddLeadModal } from '@/components/modals/add-lead-modal'
import { LeadDetailModal } from '@/components/modals/lead-detail-modal'

import {
Plus,
Search,
Phone,
Mail,
DollarSign,
Kanban,
List
} from 'lucide-react'


const statuses = [
"NEW",
"CONTACTED",
"QUALIFIED",
"WON",
"LOST"
]


const statusColors:Record<string,string>={

NEW:'bg-blue-500/10 text-blue-400 border border-blue-500/30',

CONTACTED:'bg-purple-500/10 text-purple-400 border border-purple-500/30',

QUALIFIED:'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',

WON:'bg-green-500/10 text-green-400 border border-green-500/30',

LOST:'bg-red-500/10 text-red-400 border border-red-500/30'

}


export function InteractiveCRMPage(){

/* DATA */

const [leads,setLeads] = useState<any[]>([])
const [loading,setLoading] = useState(true)

/* UI */

const [showAddModal,setShowAddModal] = useState(false)
const [selectedLead,setSelectedLead] = useState<any|null>(null)
const [showDetailModal,setShowDetailModal] = useState(false)

const [searchQuery,setSearchQuery] = useState("")
const [viewMode,setViewMode] = useState<'list'|'board'>('list')


/* LOAD LEADS */

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


/* CREATE */

async function handleAddLead(data:any){

await createLead(data)

loadLeads()

}


/* UPDATE */

async function handleUpdateLead(id:string,data:any){

await updateLead(id,data)

loadLeads()

}


/* DELETE */

async function handleDeleteLead(id:string){

await deleteLead(id)

loadLeads()

}


/* OPEN LEAD */

function openLeadDetail(lead:any){

setSelectedLead(lead)

setShowDetailModal(true)

}


/* FILTER */

const filteredLeads = useMemo(()=>{

return leads.filter((lead)=>{

const q = searchQuery.toLowerCase()

return(

lead.name?.toLowerCase().includes(q) ||

lead.email?.toLowerCase().includes(q) ||

lead.company?.toLowerCase().includes(q)

)

})

},[leads,searchQuery])


/* GROUP */

const leadsByStatus = useMemo(()=>{

const grouped:any = {}

statuses.forEach(status=>{

grouped[status] =
filteredLeads.filter(l => l.status===status)

})

return grouped

},[filteredLeads])


/* LOADING */

if(loading){

return(

<div className="p-10 text-center">

Loading CRM...

</div>

)

}


/* PAGE */

return(

<div className="space-y-6 p-6 max-w-7xl mx-auto">

{/* HEADER */}

<div className="flex items-center justify-between">

<div>

<h1 className="text-4xl font-bold">

Leads & Customers

</h1>

<p className="text-muted-foreground mt-2">

Manage your sales pipeline

</p>

</div>

<Button
onClick={()=>setShowAddModal(true)}
className="gap-2"
>

<Plus className="w-5 h-5"/>

Add Lead

</Button>

</div>


{/* SEARCH */}

<div className="relative max-w-lg">

<Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>

<Input
placeholder="Search leads..."
value={searchQuery}
onChange={(e)=>setSearchQuery(e.target.value)}
className="pl-10"
/>

</div>


{/* VIEW MODE */}

<Tabs
value={viewMode}
onValueChange={(v)=>setViewMode(v as any)}
>

<TabsList>

<TabsTrigger value="list">

<List className="w-4 h-4 mr-2"/>

List

</TabsTrigger>

<TabsTrigger value="board">

<Kanban className="w-4 h-4 mr-2"/>

Board

</TabsTrigger>

</TabsList>


{/* LIST */}

<TabsContent value="list" className="space-y-3">

{filteredLeads.map((lead:any)=>(

<Card
key={lead.id}
className="p-4 hover:shadow-md cursor-pointer"
onClick={()=>openLeadDetail(lead)}
>

<div className="flex justify-between">

<div>

<h3 className="font-semibold">

{lead.name}

</h3>

<p className="text-sm text-muted-foreground">

{lead.company}

</p>

<div className="flex gap-4 mt-2 text-sm">

{lead.email && (

<div className="flex gap-1 items-center">

<Mail className="w-4 h-4"/>

{lead.email}

</div>

)}

{lead.phone && (

<div className="flex gap-1 items-center">

<Phone className="w-4 h-4"/>

{lead.phone}

</div>

)}

</div>

</div>

<div className="text-right">

<p className="font-semibold">

₹{lead.value?.toLocaleString() || 0}

</p>

<Badge className={statusColors[lead.status]}>

{lead.status}

</Badge>

</div>

</div>

</Card>

))}

</TabsContent>


{/* BOARD */}

<TabsContent value="board">

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

{statuses.map(status=>{

const columnLeads = leadsByStatus[status]

return(

<div key={status} className="space-y-3">

<h3 className="font-semibold">

{status}

</h3>

{columnLeads.map((lead:any)=>(

<Card
key={lead.id}
className="p-3 cursor-pointer hover:shadow"
onClick={()=>openLeadDetail(lead)}
>

<h4 className="font-medium text-sm">

{lead.name}

</h4>

<p className="text-xs text-muted-foreground">

{lead.company}

</p>

<p className="font-semibold mt-2">

₹{lead.value?.toLocaleString()}

</p>

</Card>

))}

</div>

)

})}

</div>

</TabsContent>

</Tabs>


{/* MODALS */}

<AddLeadModal
open={showAddModal}
onOpenChange={setShowAddModal}
onAddLead={handleAddLead}
/>

<LeadDetailModal
open={showDetailModal}
onOpenChange={setShowDetailModal}
lead={selectedLead}
onUpdateLead={handleUpdateLead}
onDeleteLead={handleDeleteLead}
/>

</div>

)

}