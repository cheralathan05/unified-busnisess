'use client'

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue
} from "@/components/ui/select"

export type LeadSource =
"Website"
| "Google Ads"
| "LinkedIn"
| "Referral"
| "Cold Call"

interface Props{
value?:LeadSource
onChange:(value:LeadSource)=>void
}

export default function LeadSource({
value,
onChange
}:Props){

return(

<Select
value={value}
onValueChange={(v)=>onChange(v as LeadSource)}
>

<SelectTrigger className="w-[180px]">
<SelectValue placeholder="Lead Source"/>
</SelectTrigger>

<SelectContent>

<SelectItem value="Website">Website</SelectItem>
<SelectItem value="Google Ads">Google Ads</SelectItem>
<SelectItem value="LinkedIn">LinkedIn</SelectItem>
<SelectItem value="Referral">Referral</SelectItem>
<SelectItem value="Cold Call">Cold Call</SelectItem>

</SelectContent>

</Select>

)

}