'use client'

import { useEffect, useState } from "react"

import {
CommandDialog,
CommandInput,
CommandList,
CommandItem
} from "@/components/ui/command"

import { useRouter } from "next/navigation"

export default function CommandPalette(){

const [open,setOpen] = useState(false)

const router = useRouter()

useEffect(()=>{

const down = (e:KeyboardEvent)=>{

if((e.ctrlKey || e.metaKey) && e.key === "k"){

e.preventDefault()
setOpen((prev)=>!prev)

}

}

document.addEventListener("keydown",down)

return ()=>document.removeEventListener("keydown",down)

},[])

return(

<CommandDialog open={open} onOpenChange={setOpen}>

<CommandInput placeholder="Search CRM..." />

<CommandList>

<CommandItem
onSelect={()=>router.push("/crm")}

>

Open CRM </CommandItem>

<CommandItem
onSelect={()=>router.push("/crm/add-lead")}

>

Create Lead </CommandItem>

<CommandItem
onSelect={()=>router.push("/crm/pipeline")}

>

Open Pipeline </CommandItem>

</CommandList>

</CommandDialog>

)

}
