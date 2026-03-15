'use client'

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { deleteLead } from "@/lib/services/lead.service"

interface Lead {

  id:string
  name:string

}

interface Props {

  lead:Lead

}

export default function LeadActions({lead}:Props){

  const router = useRouter()

  async function handleDelete(){

    const confirmDelete = confirm("Delete this lead?")

    if(!confirmDelete) return

    try{

      await deleteLead(lead.id)

      router.refresh()

    }catch(err){

      console.error("Delete failed",err)

      alert("Failed to delete lead")

    }

  }

  return(

    <div className="flex gap-2">

      <Button
        variant="outline"
        onClick={()=>router.push(`/crm/${lead.id}/edit`)}
      >

        Edit

      </Button>

      <Button
        variant="destructive"
        onClick={handleDelete}
      >

        Delete

      </Button>

    </div>

  )

}