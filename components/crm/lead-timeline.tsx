'use client'

import { useEffect, useState } from "react"

import { getLeadActivities, Activity } from "@/lib/services/activity.service"
import { formatDate } from "@/lib/utils/date"

export default function LeadTimeline({ leadId }: { leadId: string }) {

const [activities,setActivities] = useState<Activity[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
 loadActivities()
},[leadId])

async function loadActivities(){

 try{

  const res = await getLeadActivities(leadId)

  setActivities(res.data || [])

 }catch(err){

  console.error("Activity fetch failed",err)

 }finally{

  setLoading(false)

 }

}

return(

<div className="space-y-3">

<h3 className="font-semibold text-lg">
Activity Timeline
</h3>

{loading && (
<p className="text-sm text-muted-foreground">
Loading activity...
</p>
)}

{!loading && activities.length === 0 && (
<p className="text-sm text-muted-foreground">
No activity yet
</p>
)}

<ul className="space-y-2">

{activities.map((a)=>(
<li
key={a.id}
className="border-l pl-3 text-sm"
>

<p>{a.description}</p>

<p className="text-xs text-muted-foreground">
{formatDate(a.createdAt)}
</p>

</li>
))}

</ul>

</div>

)

}