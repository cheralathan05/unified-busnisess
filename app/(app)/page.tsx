'use client'

import { useEffect, useState } from "react"

import {
Brain,
Zap,
AlertCircle,
MessageSquare
} from "lucide-react"

interface DashboardData{

totalRevenue:number
activeLeads:number
overdueTasks:number
failedPayments:number

}

export default function DashboardPage(){

const [data,setData] = useState<DashboardData>({
totalRevenue:0,
activeLeads:0,
overdueTasks:0,
failedPayments:0
})

const [loading,setLoading] = useState(true)

useEffect(()=>{
loadDashboard()
},[])

async function loadDashboard(){

try{

const res = await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard`,
{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}
)

const json = await res.json()

setData(json.data)

}catch(err){

console.error("Dashboard load error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(
<div className="p-10 text-muted-foreground">
Loading dashboard...
</div>
)

}

return(

<div className="min-h-screen bg-background p-6 md:p-8">

<div className="max-w-7xl mx-auto space-y-8">

{/* Header */}

<div>

<h1 className="text-4xl font-bold flex items-center gap-3">

<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">

<Brain className="w-6 h-6 text-white"/>

</div>

Digital Business Brain

</h1>

<p className="text-muted-foreground mt-2">

AI powered business dashboard

</p>

</div>

{/* KPI GRID */}

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

<div className="bg-card border rounded-lg p-6">

<p className="text-sm text-muted-foreground">
Monthly Revenue
</p>

<p className="text-2xl font-bold mt-2">

₹{data.totalRevenue.toLocaleString()}

</p>

</div>

<div className="bg-card border rounded-lg p-6">

<p className="text-sm text-muted-foreground">

Active Leads

</p>

<p className="text-2xl font-bold mt-2">

{data.activeLeads}

</p>

</div>

<div className="bg-card border rounded-lg p-6">

<p className="text-sm text-muted-foreground">

Overdue Tasks

</p>

<p className="text-2xl font-bold mt-2">

{data.overdueTasks}

</p>

</div>

<div className="bg-card border rounded-lg p-6">

<p className="text-sm text-muted-foreground">

Failed Payments

</p>

<p className="text-2xl font-bold mt-2">

{data.failedPayments}

</p>

</div>

</div>

{/* AI Summary */}

<div className="bg-card border rounded-xl p-6">

<h2 className="text-xl font-semibold flex items-center gap-2 mb-4">

<Zap className="w-5 h-5 text-accent"/>

AI Business Summary

</h2>

<p className="text-muted-foreground">

Revenue has reached ₹{data.totalRevenue.toLocaleString()}.  
You currently have {data.activeLeads} active leads and {data.overdueTasks} tasks needing attention.

{data.failedPayments > 0
? ` ${data.failedPayments} payments require follow-up.`
: " All payments are on track."}

</p>

</div>

{/* AI Alerts */}

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="bg-card border rounded-lg p-6">

<h3 className="font-semibold flex items-center gap-2 mb-3">

<AlertCircle className="w-5 h-5 text-orange-500"/>

AI Alerts

</h3>

<p className="text-sm text-muted-foreground">

{data.failedPayments > 0
? `${data.failedPayments} payment issues detected`
: "No payment alerts"}

</p>

</div>

<div className="bg-card border rounded-lg p-6">

<h3 className="font-semibold flex items-center gap-2 mb-3">

<MessageSquare className="w-5 h-5 text-purple-500"/>

Lead Activity

</h3>

<p className="text-sm text-muted-foreground">

{data.activeLeads} leads currently active in pipeline

</p>

</div>

</div>

</div>

</div>

)

}