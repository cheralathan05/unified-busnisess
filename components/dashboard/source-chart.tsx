'use client'

import { useAppState } from "@/hooks/use-app-state"

import {
PieChart,
Pie,
Tooltip,
ResponsiveContainer
} from "recharts"

export default function SourceChart(){

const {leads}=useAppState()

const sources=["Website","Google Ads","LinkedIn","Referral","Cold Call"]

const data=sources.map(source=>({

name:source,

value:leads.filter(l=>l.source===source).length

}))

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