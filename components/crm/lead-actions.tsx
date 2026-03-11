'use client'

import { Lead } from "@/hooks/use-app-state"
import { Button } from "@/components/ui/button"
import { useAppState } from "@/hooks/use-app-state"

interface Props{
lead:Lead
}

export default function LeadActions({lead}:Props){

const {deleteLead} = useAppState()

return(

<div className="flex gap-2">

<Button
variant="outline"
onClick={()=>window.location.href=`/crm/${lead.id}/edit`}
>
Edit
</Button>

<Button
variant="destructive"
onClick={()=>deleteLead(lead.id)}
>
Delete
</Button>

</div>

)

}