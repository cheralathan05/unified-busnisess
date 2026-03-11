'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function LeadNotes(){

const [notes,setNotes] = useState<string[]>([])
const [text,setText] = useState("")

function addNote(){

setNotes([text,...notes])
setText("")

}

return(

<div className="space-y-3">

<h3 className="font-semibold">
Notes
</h3>

<Textarea
value={text}
onChange={(e)=>setText(e.target.value)}
/>

<Button onClick={addNote}>
Add Note
</Button>

<ul className="space-y-2">

{notes.map((n,i)=>(
<li key={i} className="border p-2 rounded">
{n}
</li>
))}

</ul>

</div>

)

}