'use client'

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

import { searchLeads } from "@/lib/services/lead.service"
import { Lead } from "@/lib/services/lead.service"

interface Props {
  value: string
  setValue: (v: string) => void
  onResults: (leads: Lead[]) => void
}

export default function LeadSearch({
  value,
  setValue,
  onResults
}: Props) {

  const [loading,setLoading] = useState(false)

  useEffect(()=>{

    if(!value || value.length < 2){
      onResults([])
      return
    }

    const timeout = setTimeout(()=>{

      runSearch()

    },300) // debounce

    return ()=>clearTimeout(timeout)

  },[value])

  async function runSearch(){

    try{

      setLoading(true)

      const res = await searchLeads(value)

      onResults(res.data || [])

    }catch(err){

      console.error("Search failed",err)

    }finally{

      setLoading(false)

    }

  }

  return(

    <div className="relative">

      <Input
        placeholder="Search leads..."
        value={value}
        onChange={(e)=>setValue(e.target.value)}
      />

      {loading && (
        <p className="absolute right-3 top-2 text-xs text-muted-foreground">
          Searching...
        </p>
      )}

    </div>

  )

}