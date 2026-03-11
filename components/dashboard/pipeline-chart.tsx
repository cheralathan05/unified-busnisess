'use client'

import { useAppState } from "@/hooks/use-app-state"

import {
BarChart,
Bar,
XAxis,
Tooltip,
ResponsiveContainer
} from "recharts"

export default function PipelineChart(){

const {leads}=useAppState()

const stages=[
"New",
"Contacted",
"Proposal",
"Negotiation",
"Won"
]

const data=stages.map(stage=>({

stage,

count:leads.filter(l=>l.status===stage).length

}))

return(

<div className="h-80">

<ResponsiveContainer>

<BarChart data={data}>

<XAxis dataKey="stage"/>

<Tooltip/>

<Bar dataKey="count" fill="#22c55e"/>

</BarChart>

</ResponsiveContainer>

</div>

)

}