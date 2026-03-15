'use client'

import { useEffect, useState } from "react"

import {
PieChart,
Pie,
Tooltip,
ResponsiveContainer,
Cell
} from "recharts"

interface SourceData {
name: string
value: number
}

const COLORS = [
"#6366f1",
"#22c55e",
"#f59e0b",
"#ef4444",
"#3b82f6"
]

export default function SourceChart(){

const [data,setData] = useState<SourceData[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
fetchSources()
},[])

async function fetchSources(){

try{

const res = await fetch(
`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/sources`,
{
headers:{
Authorization:`Bearer ${localStorage.getItem("token")}`
}
}
)

const json = await res.json()

setData(json.data || [])

}catch(err){

console.error("Source analytics error",err)

}finally{

setLoading(false)

}

}

if(loading){

return(
<div className="h-80 flex items-center justify-center text-sm text-muted-foreground">
Loading source data...
</div>
)

}

return(

<div className="h-80">

<ResponsiveContainer width="100%" height="100%">

<PieChart>

<Pie
data={data}
dataKey="value"
nameKey="name"
outerRadius={100}
>

{data.map((_,index)=>(
<Cell key={index} fill={COLORS[index % COLORS.length]} />
))}

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

)

}