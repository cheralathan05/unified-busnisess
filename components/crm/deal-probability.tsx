'use client'

import { Progress } from "@/components/ui/progress"

interface Props{
stage:string
}

function getProbability(stage:string){

switch(stage){

case "New":
return 10

case "Contacted":
return 30

case "Proposal":
return 60

case "Negotiation":
return 80

case "Won":
return 100

default:
return 0

}

}

export default function DealProbability({stage}:Props){

const probability=getProbability(stage)

return(

<div className="space-y-2">

<div className="flex justify-between text-sm">

<span>Deal Probability</span>

<span>{probability}%</span>

</div>

<Progress value={probability}/>

</div>

)

}