'use client'

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
TrendingUp,
Users,
CreditCard,
Calendar,
ArrowUpRight,
ArrowDownRight
} from 'lucide-react'

import {
getDashboardAnalytics,
getActivities
} from "@/lib/services/analytics.service"


interface DashboardMetrics{
totalLeads:number
totalDeals:number
revenue:number
pipelineValue:number
wonDeals:number
hotLeads:number
}

interface Activity{
id:string
description:string
createdAt:string
}

export default function DashboardPage(){

const [metrics,setMetrics] = useState<DashboardMetrics | null>(null)
const [activities,setActivities] = useState<Activity[]>([])
const [loading,setLoading] = useState(true)


useEffect(()=>{

loadDashboard()

},[])


async function loadDashboard(){

try{

const [dashboardRes,activityRes] = await Promise.all([
getDashboardAnalytics(),
getActivities()
])

setMetrics(dashboardRes.data)
setActivities(activityRes.data || [])

}catch(err){

console.error("Dashboard load error",err)

}

setLoading(false)

}


if(loading){

return(

<p className="p-6 text-muted-foreground">

Loading dashboard...

</p>

)

}

if(!metrics) return null


const kpis=[

{
label:'Total Revenue',
value:`₹${metrics.revenue.toLocaleString()}`,
change:'+12%',
positive:true,
icon:TrendingUp
},

{
label:'Total Leads',
value:metrics.totalLeads.toString(),
change:`${metrics.hotLeads} hot`,
positive:true,
icon:Users
},

{
label:'Total Deals',
value:metrics.totalDeals.toString(),
change:`${metrics.wonDeals} won`,
positive:true,
icon:Calendar
},

{
label:'Pipeline Value',
value:`₹${metrics.pipelineValue.toLocaleString()}`,
change:'Active deals',
positive:false,
icon:CreditCard
}

]


return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">


{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">

Dashboard

</h1>

<p className="text-muted-foreground mt-1">

Welcome back! Here's your business overview.

</p>

</div>


{/* KPI GRID */}

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

{kpis.map((kpi,idx)=>{

const Icon=kpi.icon

return(

<Card key={idx} className="p-6 hover:shadow-lg transition-shadow">

<div className="flex items-start justify-between mb-4">

<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">

<Icon className="w-6 h-6 text-primary"/>

</div>

<div className={`flex items-center gap-1 text-sm font-semibold ${
kpi.positive ? 'text-green-500' : 'text-orange-500'
}`}>

{kpi.positive
? <ArrowUpRight className="w-4 h-4"/>
: <ArrowDownRight className="w-4 h-4"/>
}

{kpi.change}

</div>

</div>

<p className="text-sm text-muted-foreground">

{kpi.label}

</p>

<p className="text-2xl font-bold">

{kpi.value}

</p>

</Card>

)

})}

</div>


{/* BUSINESS HEALTH */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

<Card className="lg:col-span-2 p-6">

<h2 className="text-lg font-bold mb-4">

Business Health

</h2>

<div className="space-y-4">

<div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">

<p className="text-sm font-semibold">

Revenue Growth

</p>

</div>

<div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">

<p className="text-sm font-semibold">

Lead Conversion

</p>

</div>

<div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">

<p className="text-sm font-semibold">

Team Efficiency

</p>

</div>

</div>

</Card>


{/* AI INSIGHTS */}

<Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5">

<h2 className="text-lg font-bold mb-4">

AI Insights

</h2>

<p className="text-sm text-muted-foreground">

Your revenue is trending up. Continue focusing on high-value leads.

</p>

<Button className="w-full mt-6" size="sm">

Get More Insights

</Button>

</Card>

</div>


{/* RECENT ACTIVITY */}

<Card className="p-6">

<h2 className="text-lg font-bold mb-4">

Recent Activity

</h2>

<div className="space-y-3">

{activities.slice(0,6).map(activity=> (

<div
key={activity.id}
className="flex items-center justify-between py-3 border-b last:border-0"
>

<div>

<p className="text-sm font-medium">

{activity.description}

</p>

<p className="text-xs text-muted-foreground">

{new Date(activity.createdAt).toLocaleString()}

</p>

</div>

<div className="w-2 h-2 rounded-full bg-primary/50"/>

</div>

))}

</div>

</Card>

</div>

</div>

</div>

)

}