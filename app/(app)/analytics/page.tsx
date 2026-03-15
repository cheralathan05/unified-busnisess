'use client'

import React, { useEffect, useState } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue
} from '@/components/ui/select'

import {
BarChart,
Bar,
LineChart,
Line,
PieChart,
Pie,
Cell,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
Legend,
ResponsiveContainer
} from 'recharts'

import {
TrendingUp,
Calendar,
Download
} from 'lucide-react'

import { getDashboardAnalytics } from '@/lib/services/analytics.service'


export default function AnalyticsPage(){

const [loading,setLoading] = useState(true)

const [stats,setStats] = useState<any>({})
const [salesData,setSalesData] = useState<any[]>([])
const [conversionData,setConversionData] = useState<any[]>([])
const [sourceData,setSourceData] = useState<any[]>([])


useEffect(()=>{

loadAnalytics()

},[])


async function loadAnalytics(){

try{

const res = await getDashboardAnalytics()

const data = res.data || {}

setStats(data.stats || {})

setSalesData(data.revenueTrend || [])

setConversionData(data.conversionFunnel || [])

setSourceData(data.leadSources || [])

}catch(err){

console.error("Analytics load error",err)

}

setLoading(false)

}


if(loading){

return(

<div className="p-10 text-center">
Loading analytics...
</div>

)

}


return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">


{/* HEADER */}

<div className="flex items-center justify-between">

<div>

<h1 className="text-3xl font-bold">
Analytics
</h1>

<p className="text-muted-foreground mt-1">
Track your business performance
</p>

</div>

<div className="flex gap-2">

<Select defaultValue="month">

<SelectTrigger className="w-32">

<Calendar className="w-4 h-4 mr-2"/>
<SelectValue/>

</SelectTrigger>

<SelectContent>

<SelectItem value="week">This Week</SelectItem>
<SelectItem value="month">This Month</SelectItem>
<SelectItem value="quarter">This Quarter</SelectItem>
<SelectItem value="year">This Year</SelectItem>

</SelectContent>

</Select>

<Button variant="outline" size="icon">

<Download className="w-4 h-4"/>

</Button>

</div>

</div>


{/* METRICS */}

<div className="grid grid-cols-1 md:grid-cols-4 gap-6">

<Card className="p-6">

<p className="text-sm text-muted-foreground">
Total Revenue
</p>

<p className="text-3xl font-bold">
₹{stats.revenue || 0}
</p>

</Card>


<Card className="p-6">

<p className="text-sm text-muted-foreground">
Total Leads
</p>

<p className="text-3xl font-bold">
{stats.totalLeads || 0}
</p>

</Card>


<Card className="p-6">

<p className="text-sm text-muted-foreground">
Deals Won
</p>

<p className="text-3xl font-bold">
{stats.wonDeals || 0}
</p>

</Card>


<Card className="p-6">

<p className="text-sm text-muted-foreground">
Pipeline Value
</p>

<p className="text-3xl font-bold">
₹{stats.pipelineValue || 0}
</p>

</Card>

</div>


{/* CHARTS */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


{/* REVENUE TREND */}

<Card className="p-6">

<h2 className="text-lg font-bold mb-4">
Revenue Trend
</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={salesData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="month"/>
<YAxis/>

<Tooltip/>
<Legend/>

<Line type="monotone" dataKey="revenue" stroke="#3b82f6"/>

</LineChart>

</ResponsiveContainer>

</Card>


{/* CONVERSION */}

<Card className="p-6">

<h2 className="text-lg font-bold mb-4">
Conversion Funnel
</h2>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={conversionData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="stage"/>
<YAxis/>

<Tooltip/>

<Bar dataKey="count" fill="#3b82f6"/>

</BarChart>

</ResponsiveContainer>

</Card>

</div>


{/* SOURCES */}

<Card className="p-6">

<h2 className="text-lg font-bold mb-4">
Lead Source Distribution
</h2>

<ResponsiveContainer width="100%" height={300}>

<PieChart>

<Pie
data={sourceData}
dataKey="value"
outerRadius={100}
label
>

{sourceData.map((entry,index)=>(
<Cell key={index} fill={entry.fill || "#3b82f6"}/>
))}

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</Card>


</div>

</div>

</div>

)

}