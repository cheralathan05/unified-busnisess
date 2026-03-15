'use client'

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import {
ArrowLeft,
Mail,
Phone,
Building,
DollarSign,
Calendar,
PhoneCall,
MailCheck
} from "lucide-react"

import { getLeadById, deleteLead } from "@/lib/services/lead.service"


const statusColors:Record<string,string>={

NEW:"bg-blue-500/10 text-blue-400 border border-blue-500/30",
CONTACTED:"bg-purple-500/10 text-purple-400 border border-purple-500/30",
QUALIFIED:"bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
PROPOSAL:"bg-orange-500/10 text-orange-400 border border-orange-500/30",
WON:"bg-green-500/10 text-green-400 border border-green-500/30",
LOST:"bg-red-500/10 text-red-400 border border-red-500/30"

}


export default function LeadProfilePage(){

const params = useParams()
const router = useRouter()

const leadId = params?.leadId as string

const [lead,setLead] = useState<any>(null)
const [loading,setLoading] = useState(true)


/* LOAD SINGLE LEAD */

useEffect(()=>{

async function loadLead(){

try{

const res = await getLeadById(leadId)

setLead(res.data)

}catch(err){

console.error("Failed to load lead",err)

}

setLoading(false)

}

loadLead()

},[leadId])


/* LOADING */

if(loading){

return(

<div className="p-10 text-center">
Loading lead...
</div>

)

}


/* NOT FOUND */

if(!lead){

return(

<div className="p-8 text-center">

<h2 className="text-xl font-semibold">
Lead not found
</h2>

<Button
className="mt-4"
onClick={()=>router.push("/crm")}
>

Back to CRM

</Button>

</div>

)

}


/* DELETE */

async function handleDelete(){

const confirmDelete = confirm("Delete this lead?")

if(!confirmDelete) return

await deleteLead(lead.id)

router.push("/crm")

}


const probability = lead.probability ?? 40


return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">

{/* BACK */}

<Button
variant="outline"
onClick={()=>router.push("/crm")}
>

<ArrowLeft className="w-4 h-4 mr-2"/>
Back to CRM

</Button>


{/* HEADER */}

<div className="flex items-center justify-between">

<div>

<h1 className="text-3xl font-bold">
{lead.name}
</h1>

<p className="text-muted-foreground">
{lead.company}
</p>

</div>

<Badge className={statusColors[lead.status]}>
{lead.status}
</Badge>

</div>


{/* DEAL PROGRESS */}

<Card className="p-6">

<h2 className="text-lg font-semibold mb-4">
Deal Progress
</h2>

<Progress value={probability} className="h-2"/>

<p className="text-sm text-muted-foreground mt-2">
Probability to close: {probability}%
</p>

</Card>


{/* INFO */}

<Card className="p-6 space-y-4">

<h2 className="text-lg font-semibold">
Lead Information
</h2>

<div className="grid md:grid-cols-2 gap-4">

{lead.email && (

<div className="flex items-center gap-2 text-sm">

<Mail className="w-4 h-4 text-muted-foreground"/>
{lead.email}

</div>

)}

{lead.phone && (

<div className="flex items-center gap-2 text-sm">

<Phone className="w-4 h-4 text-muted-foreground"/>
{lead.phone}

</div>

)}

<div className="flex items-center gap-2 text-sm">

<Building className="w-4 h-4 text-muted-foreground"/>
{lead.company}

</div>

<div className="flex items-center gap-2 text-sm font-semibold">

<DollarSign className="w-4 h-4"/>
₹{lead.value?.toLocaleString() || 0}

</div>

<div className="flex items-center gap-2 text-sm">

<Calendar className="w-4 h-4 text-muted-foreground"/>

Created:
{new Date(lead.createdAt).toLocaleDateString()}

</div>

</div>

</Card>


{/* ACTIONS */}

<div className="flex gap-3">

<Button
onClick={()=>router.push(`/crm/${lead.id}/edit`)}
>

Edit Lead

</Button>

<Button
variant="destructive"
onClick={handleDelete}
>

Delete Lead

</Button>

</div>

</div>

</div>

</div>

)

}