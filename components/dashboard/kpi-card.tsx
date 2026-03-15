'use client'

import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface Props {

title:string
value:string | number
icon?:ReactNode
loading?:boolean
trend?:string

}

export default function KpiCard({

title,
value,
icon,
loading,
trend

}:Props){

return(

<Card className="p-6 flex items-center justify-between">

<div>

<p className="text-sm text-muted-foreground">

{title}

</p>

<p className="text-2xl font-bold mt-2">

{loading ? "..." : value}

</p>

{trend && (

<p className="text-xs text-muted-foreground mt-1">

{trend}

</p>

)}

</div>

{icon && (

<div className="text-muted-foreground">

{icon}

</div>

)}

</Card>

)

}