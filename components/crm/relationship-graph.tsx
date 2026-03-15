'use client'

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"

import { getLead } from "@/lib/services/lead.service"

interface Person {

role:string
name:string

}

export default function RelationshipGraph({leadId}:{leadId:string}){

const [people,setPeople] = useState<Person[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadRelationship()
},[leadId])

async function loadRelationship(){

try{

const res = await getLead(leadId)

const lead = res.data

const map:Person[] = []

if(lead.assignee){

map.push({
role:"Account Manager",
name:lead.assignee.name
})

}

if(lead.user){

map.push({
role:"Lead Owner",
name:lead.user.name
})

}

if(lead.company){

map.push({
role:"Company",
name:lead.company
})

}

setPeople(map)

}catch(err){

console.error("Relationship load failed",err)

}finally{

setLoading(false)

}

}

return(

<Card className="p-4">

<h3 className="font-semibold mb-3">
Relationship Map
</h3>

{loading && (
<p className="text-sm text-muted-foreground">
Loading relationships...
</p>
)}

{!loading && people.length === 0 && (
<p className="text-sm text-muted-foreground">
No relationships found
</p>
)}

<div className="space-y-2 text-sm">

{people.map((p,i)=>(
<p key={i}>
{p.role} → {p.name}
</p>
))}

</div>

</Card>

)

}