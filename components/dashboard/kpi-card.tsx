'use client'

import { Card } from "@/components/ui/card"

interface Props{
title:string
value:string|number
}

export default function KpiCard({
title,
value
}:Props){

return(

<Card className="p-6">

<p className="text-sm text-muted-foreground">
{title}
</p>

<p className="text-2xl font-bold mt-2">
{value}
</p>

</Card>

)

}