'use client'

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { ArrowLeft } from "lucide-react"

import { getLeadById, updateLead } from "@/lib/services/lead.service"


export default function EditLeadPage(){

const params = useParams()
const router = useRouter()

const leadId = params?.leadId as string

const [lead,setLead] = useState<any>(null)
const [loading,setLoading] = useState(true)

const [form,setForm] = useState<any>({
name:"",
email:"",
phone:"",
company:"",
value:0,
notes:"",
tags:"",
probability:0,
calls:0,
emails:0,
nextFollowUp:""
})


/* LOAD SINGLE LEAD */

useEffect(()=>{

async function loadLead(){

try{

const res = await getLeadById(leadId)

const found = res.data

setLead(found)

setForm({
name:found.name || "",
email:found.email || "",
phone:found.phone || "",
company:found.company || "",
value:found.value || 0,
notes:found.notes || "",
tags:found.tags?.join(", ") || "",
probability:found.probability || 0,
calls:found.calls || 0,
emails:found.emails || 0,
nextFollowUp:found.nextFollowUp || ""
})

}catch(err){

console.error("Failed to load lead",err)

}

setLoading(false)

}

loadLead()

},[leadId])


/* LOADING */

if(loading){

return(
<div className="p-10 text-center">
Loading lead...
</div>
)

}


/* NOT FOUND */

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


/* CHANGE HANDLER */

function handleChange(
e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>
){

const {name,value} = e.target

setForm(prev=>({
...prev,
[name]:value
}))

}


/* SUBMIT */

async function handleSubmit(e:React.FormEvent){

e.preventDefault()

await updateLead(lead.id,{

...form,

value:Number(form.value),
probability:Number(form.probability),
calls:Number(form.calls),
emails:Number(form.emails),

tags:form.tags
.split(",")
.map((tag:string)=>tag.trim())
.filter(Boolean)

})

router.push(`/crm/${lead.id}`)

}


return(

<div className="w-full h-full flex flex-col">

<div className="flex-1 overflow-y-auto">

<div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">


<Button
variant="outline"
onClick={()=>router.push(`/crm/${lead.id}`)}
>

<ArrowLeft className="w-4 h-4 mr-2"/>
Back

</Button>


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
name="value"
type="number"
value={form.value}
onChange={handleChange}
/>

</div>


<div>

<Label>Deal Probability (%)</Label>

<Input
name="probability"
type="number"
value={form.probability}
onChange={handleChange}
/>

</div>


<div>

<Label>Calls</Label>

<Input
name="calls"
type="number"
value={form.calls}
onChange={handleChange}
/>

</div>


<div>

<Label>Emails</Label>

<Input
name="emails"
type="number"
value={form.emails}
onChange={handleChange}
/>

</div>


<div>

<Label>Next Follow-up</Label>

<Input
name="nextFollowUp"
value={form.nextFollowUp}
onChange={handleChange}
/>

</div>


<div>

<Label>Tags (comma separated)</Label>

<Input
name="tags"
value={form.tags}
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