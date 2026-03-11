'use client'

import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select"

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

<SelectItem value="all">All</SelectItem>
<SelectItem value="New">New</SelectItem>
<SelectItem value="Contacted">Contacted</SelectItem>
<SelectItem value="Proposal">Proposal</SelectItem>
<SelectItem value="Won">Won</SelectItem>

</SelectContent>

</Select>

)

}