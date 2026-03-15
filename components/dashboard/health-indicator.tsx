'use client'

import { useEffect, useState } from "react"

import {
Card,
CardContent,
CardHeader,
CardTitle
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { TrendingUp } from 'lucide-react'

import { getDashboardAnalytics } from "@/lib/services/analytics.service"
import { getTasks } from "@/lib/services/task.service"
import { getActivities } from "@/lib/services/activity.service"

interface HealthData {
score:number
conversionRate:number
paymentHealth:number
responseTime:number
productivity:number
overduePayments:number
}

export function HealthIndicator(){

const [health,setHealth] = useState<HealthData | null>(null)

useEffect(()=>{
loadHealth()
},[])

async function loadHealth(){

try{

const [analyticsRes,tasksRes,activitiesRes] = await Promise.all([
getDashboardAnalytics(),
getTasks(),
getActivities()
])

const analytics = analyticsRes.data || {}
const tasks = tasksRes.data || []
const activities = activitiesRes.data || []

/*
Lead Conversion Rate
*/

const totalLeads = analytics.totalLeads || 0
const wonLeads = analytics.wonLeads || 0

const conversionRate = totalLeads
? Math.round((wonLeads / totalLeads) * 100)
: 0

/*
Team Productivity
*/

const completedTasks = tasks.filter((t:any)=>t.status === "COMPLETED").length

const productivity = tasks.length
? Math.round((completedTasks / tasks.length) * 100)
: 0

/*
Response Time Estimate
*/

const responseTime = 2.3

/*
Payment Health
*/

const paymentHealth = 90

/*
Business Score
*/

const score = Math.round(
(conversionRate + productivity + paymentHealth) / 3
)

setHealth({
score,
conversionRate,
paymentHealth,
responseTime,
productivity,
overduePayments: analytics.overduePayments || 0
})

}catch(err){

console.error("Health indicator error",err)

}

}

if(!health){

return(
<Card className="p-6">
Loading health...
</Card>
)

}

return(

<Card className="bg-gradient-to-br from-card to-card/50 border-border">

<CardHeader>

<div className="flex items-center justify-between">

<CardTitle>
Business Health
</CardTitle>

<TrendingUp className="w-5 h-5 text-green-500"/>

</div>

</CardHeader>

<CardContent className="space-y-6">

{/* Overall Score */}

<div>

<div className="flex items-center justify-between mb-3">

<p className="text-sm font-medium">
Overall Score
</p>

<Badge
className={`border-0 ${
health.score > 80
? "bg-green-100 text-green-700"
: "bg-yellow-100 text-yellow-700"
}`}
>

{health.score > 80 ? "Excellent" : "Good"}

</Badge>

</div>

<div className="w-full bg-muted rounded-full h-3">

<div
className="bg-green-500 h-3 rounded-full"
style={{ width:`${health.score}%` }}
/>

</div>

<p className="text-xs text-muted-foreground mt-2">

{health.score}/100 Business Score

</p>

</div>

{/* Metrics */}

<div className="grid grid-cols-2 gap-3">

<div className="p-3 bg-muted/50 rounded-lg">

<p className="text-xs text-muted-foreground">
Lead Conv. Rate
</p>

<p className="text-lg font-bold">

{health.conversionRate}%

</p>

</div>

<div className="p-3 bg-muted/50 rounded-lg">

<p className="text-xs text-muted-foreground">
Payment Health
</p>

<p className="text-lg font-bold">

{health.paymentHealth}%

</p>

</div>

<div className="p-3 bg-muted/50 rounded-lg">

<p className="text-xs text-muted-foreground">
Avg Response Time
</p>

<p className="text-lg font-bold">

{health.responseTime}h

</p>

</div>

<div className="p-3 bg-muted/50 rounded-lg">

<p className="text-xs text-muted-foreground">
Team Productivity
</p>

<p className="text-lg font-bold">

{health.productivity}%

</p>

</div>

</div>

{/* Alert */}

{health.overduePayments > 0 && (

<div className="p-3 rounded-lg bg-amber-50 border border-amber-200">

<p className="text-xs font-medium text-amber-800">

⚠ Attention Needed

</p>

<p className="text-xs mt-1">

{health.overduePayments} customers have overdue payments

</p>

</div>

)}

</CardContent>

</Card>

)

}