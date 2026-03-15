'use client'

import { useEffect, useState } from "react"

import {
PieChart,
Pie,
Tooltip,
ResponsiveContainer
} from "recharts"

import { Card } from "@/components/ui/card"

import { getPipelineAnalytics } from "@/lib/services/analytics.service"

interface PipelineStage {
stage: string
value: number
}

export default function DealsChart(){

const [data,setData] = useState<PipelineStage[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadDeals()
},[])

async function loadDeals(){

try{

const res = await getPipelineAnalytics()

const pipeline = res.data || []

const won = pipeline
.filter((p:any)=>p.stage === "WON")
.reduce((sum:any,p:any)=>sum+p.value,0)

const lost = pipeline
.filter((p:any)=>p.stage === "LOST")
.reduce((sum:any,p:any)=>sum+p.value,0)

setData([
{name:"Won",value:won},
{name:"Lost",value:lost}
])

}catch(err){

console.error("Deals chart error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(
<Card className="p-6">
Loading deals chart...
</Card>
)

}

return(

<div className="h-80">

<ResponsiveContainer>

<PieChart>

<Pie
data={data}
dataKey="value"
nameKey="name"
outerRadius={100}
/>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

)

}