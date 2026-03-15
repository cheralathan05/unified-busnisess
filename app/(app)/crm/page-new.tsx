'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getLeads } from '@/lib/services/lead.service'

import {
Plus,
Search,
List,
Kanban as KanbanIcon,
Mail,
Phone
} from 'lucide-react'

const statuses = [
"NEW",
"CONTACTED",
"QUALIFIED",
"WON",
"LOST"
]

const statusColors:Record<string,string> = {

NEW:'bg-blue-500/10 text-blue-400 border border-blue-500/30',

CONTACTED:'bg-purple-500/10 text-purple-400 border border-purple-500/30',

QUALIFIED:'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',

WON:'bg-green-500/10 text-green-400 border border-green-500/30',

LOST:'bg-red-500/10 text-red-400 border border-red-500/30'

}

export default function CRMPage(){

/* ---------------- DATA ---------------- */

const [leads,setLeads] = useState<any[]>([])
const [loading,setLoading] = useState(true)

/* ---------------- UI ---------------- */

const [view,setView] = useState<'list'|'kanban'>('list')
const [searchQuery,setSearchQuery] = useState('')

/* ---------------- FETCH LEADS ---------------- */

async function loadLeads(){

try{

const res = await getLeads()

setLeads(res.data || [])

}catch(err){

console.error("Failed to load leads",err)

}

setLoading(false)

}

useEffect(()=>{

loadLeads()

},[])

/* ---------------- FILTER ---------------- */

const filteredLeads = useMemo(()=>{

return leads.filter(lead =>

lead.name
?.toLowerCase()
.includes(searchQuery.toLowerCase())

)

},[leads,searchQuery])

/* ---------------- GROUP ---------------- */

const leadsByStatus = useMemo(()=>{

const grouped:any = {}

statuses.forEach(status=>{

grouped[status] =
filteredLeads.filter(l => l.status === status)

})

return grouped

},[filteredLeads])

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

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

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

<Plus className="w-5 h-5"/>

Add Lead

</Button>

</Link>

</div>

{/* SEARCH */}

<div className="flex items-center gap-4 flex-wrap">

<div className="relative flex-1 max-w-md">

<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>

<Input
placeholder="Search leads..."
value={searchQuery}
onChange={(e)=>setSearchQuery(e.target.value)}
className="pl-10"
/>

</div>

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

</div>

{/* LIST VIEW */}

{view==="list" && (

<div className="space-y-3">

{filteredLeads.length === 0 && (

<Card className="p-12 text-center">

<p className="text-muted-foreground">

No leads found

</p>

</Card>

)}

{filteredLeads.map(lead=>(

<Link key={lead.id} href={`/crm/${lead.id}`}>

<Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">

<div className="flex justify-between gap-4">

<div className="flex-1">

<h3 className="font-semibold text-lg">

{lead.name}

</h3>

<p className="text-sm text-muted-foreground">

{lead.company}

</p>

<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">

{lead.email && (

<div className="flex items-center gap-1">

<Mail className="w-4 h-4"/>

{lead.email}

</div>

)}

{lead.phone && (

<div className="flex items-center gap-1">

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

<p className="text-xs text-muted-foreground">

{new Date(lead.createdAt).toLocaleDateString()}

</p>

<Badge className={statusColors[lead.status]}>

{lead.status}

</Badge>

</div>

</div>

</Card>

</Link>

))}

</div>

)}

{/* KANBAN */}

{view==="kanban" && (

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

{statuses.map(status=>(

<div key={status} className="space-y-3">

<div className="flex justify-between px-2">

<h3 className="font-semibold text-sm">

{status}

</h3>

<span className="text-xs bg-muted px-2 py-1 rounded">

{leadsByStatus[status]?.length || 0}

</span>

</div>

<div className="space-y-2">

{leadsByStatus[status]?.map((lead:any)=>(

<Link key={lead.id} href={`/crm/${lead.id}`}>

<Card className="p-3 hover:shadow-md cursor-pointer">

<h4 className="font-medium text-sm">

{lead.name}

</h4>

<p className="text-xs text-muted-foreground">

{lead.company}

</p>

<p className="text-sm font-semibold mt-2">

₹{lead.value?.toLocaleString() || 0}

</p>

</Card>

</Link>

))}

</div>

</div>

))}

</div>

)}

</div>

</div>

</div>

)

}