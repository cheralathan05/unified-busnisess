'use client'

import AddLead from "@/components/crm/add-lead"

export default function AddLeadPage(){

return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">

{/* Header */}

<div>

<h1 className="text-3xl font-bold">
Add New Lead
</h1>

<p className="text-muted-foreground mt-1">
Create a new lead and start tracking your sales opportunity.
</p>

</div>

{/* Lead Form */}

<AddLead/>

</div>

</div>

</div>

)

}