'use client'

import { Input } from "@/components/ui/input"

export default function DealInfo(){

return(

<div className="space-y-3">

<h3 className="font-semibold">
Deal Information
</h3>

<Input placeholder="Expected Close Date"/>

<Input placeholder="Deal Probability %"/>

<Input placeholder="Deal Stage"/>

</div>

)

}