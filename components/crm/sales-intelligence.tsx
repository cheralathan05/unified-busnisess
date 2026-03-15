'use client'

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"

import { getDashboardAnalytics } from "@/lib/services/analytics.service"

interface DashboardAnalytics {

pipelineValue:number
expectedRevenue:number
hotLeads:number
overdueFollowUps:number

}

export default function SalesIntelligence(){

const [data,setData] = useState<DashboardAnalytics | null>(null)
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadAnalytics()
},[])

async function loadAnalytics(){

try{

const res = await getDashboardAnalytics()

setData(res.data)

}catch(err){

console.error("Dashboard analytics error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(

<Card className="p-6">

Loading intelligence...

</Card>

)

}

if(!data){

return(

<Card className="p-6">

Failed to load analytics

</Card>

)

}

return(

<div className="grid md:grid-cols-4 gap-4">

<Card className="p-4">

<p className="text-sm text-muted-foreground">
🔥 Hot Leads
</p>

<p className="text-2xl font-bold">
{data.hotLeads}
</p>

</Card>

<Card className="p-4">

<p className="text-sm text-muted-foreground">
📈 Pipeline Value
</p>

<p className="text-2xl font-bold">
₹{data.pipelineValue.toLocaleString()}
</p>

</Card>

<Card className="p-4">

<p className="text-sm text-muted-foreground">
💰 Expected Revenue
</p>

<p className="text-2xl font-bold">
₹{data.expectedRevenue.toLocaleString()}
</p>

</Card>

<Card className="p-4">

<p className="text-sm text-muted-foreground">
⚠ Overdue Follow-ups
</p>

<p className="text-2xl font-bold">
{data.overdueFollowUps}
</p>

</Card>

</div>

)

}