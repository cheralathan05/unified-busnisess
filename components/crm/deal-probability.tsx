'use client'

import { Progress } from "@/components/ui/progress"

interface Props{

stage:string

}

function getProbability(stage:string){

switch(stage){

case "NEW":
return 10

case "CONTACTED":
return 30

case "QUALIFIED":
return 70

case "WON":
return 100

case "LOST":
return 0

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