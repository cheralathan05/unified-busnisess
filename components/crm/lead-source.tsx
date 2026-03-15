'use client'

import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select"

import { updateLead } from "@/lib/services/lead.service"

export type LeadSource =
 | "Website"
 | "Google Ads"
 | "LinkedIn"
 | "Referral"
 | "Cold Call"

interface Props {

 leadId: string
 value?: LeadSource
 onUpdated?: () => void

}

export default function LeadSource({

 leadId,
 value,
 onUpdated

}: Props){

 async function handleChange(source: LeadSource){

  try{

   await updateLead(leadId,{
    source
   })

   onUpdated?.()

  }catch(err){

   console.error("Lead source update failed",err)

  }

 }

 return(

  <Select
   value={value}
   onValueChange={(v)=>handleChange(v as LeadSource)}
  >

   <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Lead Source"/>
   </SelectTrigger>

   <SelectContent>

    <SelectItem value="Website">
     Website
    </SelectItem>

    <SelectItem value="Google Ads">
     Google Ads
    </SelectItem>

    <SelectItem value="LinkedIn">
     LinkedIn
    </SelectItem>

    <SelectItem value="Referral">
     Referral
    </SelectItem>

    <SelectItem value="Cold Call">
     Cold Call
    </SelectItem>

   </SelectContent>

  </Select>

 )

}