'use client'

import { Lead } from "@/hooks/use-app-state"

interface Props{
lead:Lead
}

export default function LeadProfileHeader({lead}:Props){

return(

<div className="border-b pb-6">

<h1 className="text-3xl font-bold">
{lead.name}
</h1>

<p className="text-muted-foreground">
{lead.company}
</p>

</div>

)

}