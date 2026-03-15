'use client'

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue
} from "@/components/ui/select"

interface Props{

setStatus:(s:string)=>void

}

export default function LeadFilters({setStatus}:Props){

return(

<Select onValueChange={(v)=>setStatus(v)}>

<SelectTrigger className="w-48">

<SelectValue placeholder="Filter Status"/>

</SelectTrigger>

<SelectContent>

<SelectItem value="all">
All
</SelectItem>

<SelectItem value="NEW">
New
</SelectItem>

<SelectItem value="CONTACTED">
Contacted
</SelectItem>

<SelectItem value="QUALIFIED">
Qualified
</SelectItem>

<SelectItem value="WON">
Won
</SelectItem>

<SelectItem value="LOST">
Lost
</SelectItem>

</SelectContent>

</Select>

)

}