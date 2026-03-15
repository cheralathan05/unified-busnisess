'use client'

import { useEffect, useState } from "react"

import {
ResponsiveContainer,
LineChart,
Line,
XAxis,
YAxis,
Tooltip
} from "recharts"

interface RevenueData {
date: string
value: number
}

export default function RevenueChart(){

const [data,setData] = useState<RevenueData[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{

fetchRevenue()

},[])

async function fetchRevenue(){

try{

const res = await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/revenue`,
{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}
)

const json = await res.json()

setData(json.data || [])

}catch(err){

console.error("Revenue analytics error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(

<div className="h-80 flex items-center justify-center text-sm text-muted-foreground">

Loading revenue data...

</div>

)

}

return(

<div className="h-80">

<ResponsiveContainer width="100%" height="100%">

<LineChart data={data}>

<XAxis dataKey="date"/>

<YAxis/>

<Tooltip/>

<Line
dataKey="value"
stroke="#6366f1"
strokeWidth={2}
/>

</LineChart>

</ResponsiveContainer>

</div>

)

}