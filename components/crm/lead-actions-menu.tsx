'use client'

import { Lead } from "@/lib/services/lead.service"

import { deleteLead } from "@/lib/services/lead.service"

import { Button } from "@/components/ui/button"

import { MoreVertical } from "lucide-react"

import {
DropdownMenu,
DropdownMenuTrigger,
DropdownMenuContent,
DropdownMenuItem
} from "@/components/ui/dropdown-menu"

import { useRouter } from "next/navigation"

interface Props {

lead: Lead
refreshLeads?: () => void

}

export default function LeadActionsMenu({

lead,
refreshLeads

}: Props) {

const router = useRouter()

async function handleDelete(){

const confirmDelete = confirm(
"Delete this lead?"
)

if(!confirmDelete) return

try{

await deleteLead(lead.id)

refreshLeads?.()

}catch(err){

console.error("Delete lead failed",err)

alert("Failed to delete lead")

}

}

return(

<DropdownMenu>

<DropdownMenuTrigger asChild>

<Button variant="ghost" size="icon">

<MoreVertical className="w-4 h-4"/>

</Button>

</DropdownMenuTrigger>

<DropdownMenuContent align="end">

<DropdownMenuItem
onClick={()=>router.push(`/crm/${lead.id}`)}
>
View Lead
</DropdownMenuItem>

<DropdownMenuItem
onClick={()=>router.push(`/crm/${lead.id}/edit`)}
>
Edit Lead
</DropdownMenuItem>

<DropdownMenuItem
onClick={()=>window.open(`mailto:${lead.email}`)}
>
Send Email
</DropdownMenuItem>

<DropdownMenuItem
onClick={()=>window.open(`tel:${lead.phone}`)}
>
Call
</DropdownMenuItem>

<DropdownMenuItem
className="text-red-500"
onClick={handleDelete}
>
Delete
</DropdownMenuItem>

</DropdownMenuContent>

</DropdownMenu>

)

}