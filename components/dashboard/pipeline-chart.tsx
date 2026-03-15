'use client'

import { useEffect, useState } from "react"

import {
BarChart,
Bar,
XAxis,
Tooltip,
ResponsiveContainer
} from "recharts"

interface PipelineStage {
stage: string
count: number
}

export default function PipelineChart(){

const [data,setData] = useState<PipelineStage[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{

fetchPipeline()

},[])

async function fetchPipeline(){

try{

const res = await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/pipeline`,
{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}
)

const json = await res.json()

setData(json.data || [])

}catch(err){

console.error("Pipeline chart error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(

<div className="h-80 flex items-center justify-center text-sm text-muted-foreground">

Loading pipeline...

</div>

)

}

return(

<div className="h-80">

<ResponsiveContainer width="100%" height="100%">

<BarChart data={data}>

<XAxis dataKey="stage"/>

<Tooltip/>

<Bar
dataKey="count"
fill="#22c55e"
/>

</BarChart>

</ResponsiveContainer>

</div>

)

}