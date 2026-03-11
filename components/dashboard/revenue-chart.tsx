'use client'

import { useAppState } from "@/hooks/use-app-state"

import {
ResponsiveContainer,
LineChart,
Line,
XAxis,
YAxis,
Tooltip
} from "recharts"

export default function RevenueChart(){

const {payments}=useAppState()

const data=payments.map(p=>({

date:new Date(p.date).toLocaleDateString(),

value:p.amount

}))

return(

<div className="h-80">

<ResponsiveContainer>

<LineChart data={data}>

<XAxis dataKey="date"/>

<YAxis/>

<Tooltip/>

<Line dataKey="value" stroke="#6366f1"/>

</LineChart>

</ResponsiveContainer>

</div>

)

}