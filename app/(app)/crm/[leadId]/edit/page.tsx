'use client'

import { useParams, useRouter } from "next/navigation"
import { useAppState } from "@/hooks/use-app-state"

import { useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { ArrowLeft } from "lucide-react"


export default function EditLeadPage(){

const params = useParams()
const router = useRouter()

const { leads, updateLead } = useAppState()

const leadId = params?.leadId as string

const lead = leads.find(l => l.id === leadId)

if(!lead){

return(

<div className="p-8 text-center">

<h2 className="text-xl font-semibold">
Lead not found
</h2>

<Button
className="mt-4"
onClick={()=>router.push("/crm")}
>
Back to CRM
</Button>

</div>

)

}

const [form,setForm]=useState({

name:lead.name,
email:lead.email,
phone:lead.phone,
company:lead.company,
dealValue:lead.dealValue,
notes:lead.notes

})


function handleChange(
e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>
){

const {name,value}=e.target

setForm(prev=>({

...prev,
[name]:value

}))

}


function handleSubmit(e:React.FormEvent){

e.preventDefault()

updateLead(lead.id,{
...form,
dealValue:Number(form.dealValue)
})

router.push(`/crm/${lead.id}`)

}


return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

{/* Back */}

<Button
variant="outline"
onClick={()=>router.push(`/crm/${lead.id}`)}
>

<ArrowLeft className="w-4 h-4 mr-2"/>

Back

</Button>


{/* Card */}

<Card className="p-6 space-y-6">

<h1 className="text-2xl font-bold">
Edit Lead
</h1>


<form
onSubmit={handleSubmit}
className="space-y-4"
>

<div>

<Label>Name</Label>

<Input
name="name"
value={form.name}
onChange={handleChange}
/>

</div>


<div>

<Label>Email</Label>

<Input
name="email"
type="email"
value={form.email}
onChange={handleChange}
/>

</div>


<div>

<Label>Phone</Label>

<Input
name="phone"
value={form.phone}
onChange={handleChange}
/>

</div>


<div>

<Label>Company</Label>

<Input
name="company"
value={form.company}
onChange={handleChange}
/>

</div>


<div>

<Label>Deal Value</Label>

<Input
name="dealValue"
type="number"
value={form.dealValue}
onChange={handleChange}
/>

</div>


<div>

<Label>Notes</Label>

<Textarea
name="notes"
value={form.notes}
onChange={handleChange}
/>

</div>


{/* Buttons */}

<div className="flex gap-3">

<Button type="submit">

Update Lead

</Button>

<Button
type="button"
variant="outline"
onClick={()=>router.push(`/crm/${lead.id}`)}
>

Cancel

</Button>

</div>

</form>

</Card>

</div>

</div>

</div>

)

}