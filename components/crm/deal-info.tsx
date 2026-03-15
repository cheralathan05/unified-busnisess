'use client'

import { useEffect, useState } from "react"

import { getLeadActivities } from "@/lib/services/activity.service"
import { formatDate } from "@/lib/utils/date"

interface Activity {

 id:string
 description:string
 createdAt:string

}

export default function LeadTimeline({leadId}:{leadId:string}){

const [activities,setActivities] = useState<Activity[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
 loadTimeline()
},[leadId])

async function loadTimeline(){

 try{

  const res = await getLeadActivities(leadId)

  setActivities(res.data || [])

 }catch(err){

  console.error("Timeline load failed",err)

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
<li key={a.id} className="text-sm border-l pl-3">

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