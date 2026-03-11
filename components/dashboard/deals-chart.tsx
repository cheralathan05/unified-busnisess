'use client'

import { useAppState } from "@/hooks/use-app-state"

import {
PieChart,
Pie,
Tooltip,
ResponsiveContainer
} from "recharts"

export default function DealsChart(){

const {leads}=useAppState()

const data=[

{name:"Won",value:leads.filter(l=>l.status==="Won").length},

{name:"Lost",value:leads.filter(l=>l.status==="Lost").length}

]

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