'use client'

import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"

import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts"

import { getPipelineAnalytics } from "@/lib/services/analytics.service"

interface PipelineData {
stage: string
value: number
}

export default function PipelineAnalytics(){

const [data,setData] = useState<PipelineData[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadPipeline()
},[])

async function loadPipeline(){

try{

const res = await getPipelineAnalytics()

setData(res.data || [])

}catch(err){

console.error("Pipeline analytics error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(

<Card className="p-6">

Loading analytics...

</Card>

)

}

return(

<Card className="p-6">

<h3 className="font-semibold mb-4">
Pipeline Analytics
</h3>

<div className="h-64">

<ResponsiveContainer width="100%" height="100%">

<BarChart data={data}>

<XAxis dataKey="stage"/>

<YAxis/>

<Tooltip/>

<Bar
dataKey="value"
fill="#6366f1"
/>

</BarChart>

</ResponsiveContainer>

</div>

</Card>

)

}