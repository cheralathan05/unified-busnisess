'use client'

export default function LeadTimeline(){

const events=[
"Lead created",
"Email sent",
"Call completed"
]

return(

<div className="space-y-2">

<h3 className="font-semibold text-lg">
Activity Timeline
</h3>

<ul className="space-y-1">

{events.map((e,i)=>(
<li key={i} className="text-sm">
{e}
</li>
))}

</ul>

</div>

)

}