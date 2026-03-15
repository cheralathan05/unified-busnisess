'use client'

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import {
getNotes,
createNote,
Note
} from "@/lib/services/note.service"

import { formatDate } from "@/lib/utils/date"

interface Props {
leadId: string
}

export default function LeadNotes({ leadId }: Props) {

const [notes,setNotes] = useState<Note[]>([])
const [text,setText] = useState("")
const [loading,setLoading] = useState(false)
const [saving,setSaving] = useState(false)

async function loadNotes(){

try{

setLoading(true)

const res = await getNotes(leadId)

setNotes(res?.data || [])

}catch(err){

console.error("Failed to load notes",err)

}finally{

setLoading(false)

}

}

useEffect(()=>{

if(leadId) loadNotes()

},[leadId])

async function addNote(){

if(!text.trim()) return

try{

setSaving(true)

await createNote({
content:text,
leadId
})

setText("")

await loadNotes()

}catch(err){

console.error("Failed to create note",err)

}finally{

setSaving(false)

}

}

return(

<div className="space-y-4">

<h3 className="font-semibold">
Notes
</h3>

{/* Add Note */}

<div className="space-y-2">

<Textarea
value={text}
onChange={(e)=>setText(e.target.value)}
placeholder="Add note..."
rows={3}
/>

<Button
onClick={addNote}
disabled={saving}
>

{saving ? "Saving..." : "Add Note"}

</Button>

</div>

{/* Notes List */}

{loading && (

<p className="text-sm text-muted-foreground">
Loading notes...
</p>

)}

{!loading && notes.length === 0 && (

<p className="text-sm text-muted-foreground">
No notes yet
</p>

)}

<ul className="space-y-2">

{notes.map((note)=>(

<li
key={note.id}
className="border p-3 rounded text-sm"
>

<p>
{note.content}
</p>

<p className="text-xs text-muted-foreground mt-1">

{formatDate(note.createdAt)}

</p>

</li>

))}

</ul>

</div>

)

}