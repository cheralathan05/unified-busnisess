'use client'

import { useState, useMemo } from 'react'

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

import { useAppState, type Lead } from '@/hooks/use-app-state'

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
"New",
"Contacted",
"Proposal",
"Negotiation",
"Won",
"Lost"
] as const


const statusColors: Record<string,string> = {
New:'bg-blue-500/10 text-blue-400 border border-blue-500/30',
Contacted:'bg-purple-500/10 text-purple-400 border border-purple-500/30',
Proposal:'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
Negotiation:'bg-amber-500/10 text-amber-400 border border-amber-500/30',
Won:'bg-green-500/10 text-green-400 border border-green-500/30',
Lost:'bg-red-500/10 text-red-400 border border-red-500/30'
}


export function InteractiveCRMPage(){

const {leads,addLead,updateLead,deleteLead}=useAppState()

const [showAddModal,setShowAddModal]=useState(false)
const [selectedLead,setSelectedLead]=useState<Lead|null>(null)
const [showDetailModal,setShowDetailModal]=useState(false)

const [searchQuery,setSearchQuery]=useState("")
const [viewMode,setViewMode]=useState<'list'|'board'>('list')


function openLeadDetail(lead:Lead){

setSelectedLead(lead)
setShowDetailModal(true)

}


const filteredLeads=useMemo(()=>{

return leads.filter((lead)=>

lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
lead.company.toLowerCase().includes(searchQuery.toLowerCase())

)

},[leads,searchQuery])


const leadsByStatus=useMemo(()=>{

const grouped:Record<string,Lead[]>={}

statuses.forEach((status)=>{

grouped[status]=filteredLeads.filter(l=>l.status===status)

})

return grouped

},[filteredLeads])


return(

<div className="space-y-6 p-6 max-w-7xl mx-auto">

{/* HEADER */}

<div className="flex items-center justify-between">

<div>

<h1 className="text-4xl font-bold">
Leads & Customers
</h1>

<p className="text-muted-foreground mt-2">
Manage your sales pipeline with intelligence
</p>

</div>

<Button
onClick={()=>setShowAddModal(true)}
className="gap-2 rounded-lg font-semibold shadow-sm"
>

<Plus className="w-5 h-5"/>

Add Lead

</Button>

</div>


{/* SEARCH */}

<div className="relative max-w-lg">

<Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>

<Input
placeholder="Search leads by name, email, or company..."
value={searchQuery}
onChange={(e)=>setSearchQuery(e.target.value)}
className="pl-10"
/>

</div>


{/* VIEW MODE */}

<Tabs
value={viewMode}
onValueChange={(v)=>setViewMode(v as 'list'|'board')}
>

<TabsList>

<TabsTrigger value="list" className="gap-2">

<List className="w-4 h-4"/>

List View

</TabsTrigger>

<TabsTrigger value="board" className="gap-2">

<Kanban className="w-4 h-4"/>

Pipeline Board

</TabsTrigger>

</TabsList>


{/* LIST VIEW */}

<TabsContent value="list" className="space-y-3">

{filteredLeads.length===0?(
<Card className="p-12 text-center">

<p className="text-muted-foreground">

No leads found. Create your first lead.

</p>

</Card>
):(

filteredLeads.map((lead)=>(

<Card
key={lead.id}
className="p-4 hover:shadow-md cursor-pointer"
onClick={()=>openLeadDetail(lead)}
>

<div className="flex items-start justify-between">

<div className="flex-1">

<h3 className="font-semibold">
{lead.name}
</h3>

<p className="text-sm text-muted-foreground">
{lead.company}
</p>

<div className="flex flex-wrap gap-4 mt-3 text-sm">

<div className="flex items-center gap-1 text-muted-foreground">
<Mail className="w-4 h-4"/>
{lead.email}
</div>

<div className="flex items-center gap-1 text-muted-foreground">
<Phone className="w-4 h-4"/>
{lead.phone}
</div>

<div className="flex items-center gap-1 font-medium">
<DollarSign className="w-4 h-4"/>
₹{lead.dealValue.toLocaleString()}
</div>

</div>

</div>

<Badge className={statusColors[lead.status]}>
{lead.status}
</Badge>

</div>

</Card>

))

)}

</TabsContent>


{/* PIPELINE BOARD */}

<TabsContent value="board">

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

{statuses.map((status)=>{

const columnLeads=leadsByStatus[status]

return(

<div key={status} className="space-y-3">

<div className="flex items-center justify-between">

<h3 className="font-semibold">
{status}
</h3>

<Badge variant="secondary">
{columnLeads.length}
</Badge>

</div>

{columnLeads.map((lead)=>(

<Card
key={lead.id}
className="p-3 hover:shadow-md cursor-pointer"
onClick={()=>openLeadDetail(lead)}
>

<h4 className="font-medium text-sm">
{lead.name}
</h4>

<p className="text-xs text-muted-foreground">
{lead.company}
</p>

<p className="font-semibold text-primary mt-2">
₹{lead.dealValue.toLocaleString()}
</p>

</Card>

))}

</div>

)

})}

</div>

</TabsContent>

</Tabs>


{/* ADD LEAD */}

<AddLeadModal
open={showAddModal}
onOpenChange={setShowAddModal}
onAddLead={addLead}
/>


{/* LEAD DETAILS */}

<LeadDetailModal
open={showDetailModal}
onOpenChange={setShowDetailModal}
lead={selectedLead}
onUpdateLead={updateLead}
onDeleteLead={deleteLead}
/>

</div>

)

}