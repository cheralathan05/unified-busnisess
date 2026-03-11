'use client'

import { Input } from "@/components/ui/input"

interface Props{
value:string
setValue:(v:string)=>void
}

export default function LeadSearch({value,setValue}:Props){

return(

<Input
placeholder="Search Leads..."
value={value}
onChange={(e)=>setValue(e.target.value)}
/>

)

}