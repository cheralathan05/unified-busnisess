'use client'

import { useEffect, useState } from "react"

import {
Card,
CardContent,
CardHeader,
CardTitle
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import {
Sparkles,
Lightbulb
} from 'lucide-react'

import { getDashboardAnalytics } from "@/lib/services/analytics.service"
import { getActivities } from "@/lib/services/activity.service"

interface Analytics {
pipelineValue:number
expectedRevenue:number
hotLeads:number
overdueFollowUps:number
}

export function AIBriefing(){

const [analytics,setAnalytics] = useState<Analytics | null>(null)
const [activity,setActivity] = useState<string>("")
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadBriefing()
},[])

async function loadBriefing(){

try{

const [analyticsRes,activityRes] = await Promise.all([
getDashboardAnalytics(),
getActivities()
])

setAnalytics(analyticsRes.data)

if(activityRes.data?.length){

setActivity(activityRes.data[0].description)

}

}catch(err){

console.error("AI briefing error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(

<Card className="p-6">
Loading briefing...
</Card>

)

}

return(

<Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">

<CardHeader className="pb-3">

<div className="flex items-center gap-2">

<Sparkles className="w-5 h-5 text-accent"/>

<CardTitle className="text-base">
AI Daily Briefing
</CardTitle>

</div>

</CardHeader>

<CardContent className="space-y-4">

{/* Main Insight */}

<div className="flex items-start gap-2">

<Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"/>

<div>

<p className="text-sm font-medium text-foreground">
Next Best Action
</p>

<p className="text-xs text-foreground/80 mt-1">

{activity || "No recent activity"}

</p>

</div>

</div>

{/* Quick Insights */}

<div className="space-y-2 pt-2 border-t border-border text-xs">

<p>

<strong>Pipeline Value:</strong> ₹
{analytics?.pipelineValue?.toLocaleString()}

</p>

<p>

<strong>Expected Revenue:</strong> ₹
{analytics?.expectedRevenue?.toLocaleString()}

</p>

<p>

<strong>Hot Leads:</strong> {analytics?.hotLeads}

</p>

<p>

<strong>Overdue Follow-ups:</strong> {analytics?.overdueFollowUps}

</p>

</div>

{/* CTA */}

<Button
variant="default"
size="sm"
className="w-full mt-2"
>

Get Full Briefing

</Button>

</CardContent>

</Card>

)

}