'use client'

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { X, Plus } from "lucide-react"

import { updateLead } from "@/lib/services/lead.service"

interface Props {

  leadId: string
  tags: string[]
  onUpdated?: () => void

}

export default function LeadTags({

  leadId,
  tags,
  onUpdated

}: Props){

  const [value,setValue] = useState("")
  const [loading,setLoading] = useState(false)

  async function saveTags(newTags:string[]){

    try{

      setLoading(true)

      await updateLead(leadId,{
        tags:newTags
      })

      onUpdated?.()

    }catch(err){

      console.error("Tag update failed",err)

    }finally{

      setLoading(false)

    }

  }

  function addTag(){

    const tag = value.trim()

    if(!tag) return
    if(tags.includes(tag)) return

    saveTags([...tags,tag])

    setValue("")

  }

  function removeTag(tag:string){

    saveTags(tags.filter(t=>t !== tag))

  }

  return(

<div className="space-y-3">

<div className="flex flex-wrap gap-2">

{tags.map((tag)=>(

<Badge
key={tag}
variant="secondary"
className="flex items-center gap-1 px-2 py-1"
>

{tag}

<button
onClick={()=>removeTag(tag)}
className="ml-1 hover:text-red-500"
>

<X className="w-3 h-3"/>

</button>

</Badge>

))}

</div>

<div className="flex gap-2">

<Input
placeholder="Add tag"
value={value}
onChange={(e)=>setValue(e.target.value)}
onKeyDown={(e)=>{

if(e.key==="Enter"){

e.preventDefault()
addTag()

}

}}
/>

<Button
size="icon"
onClick={addTag}
disabled={loading}
>

<Plus className="w-4 h-4"/>

</Button>

</div>

</div>

)

}