'use client'

import { useState } from "react"

export default function LeadAttachments(){

const [files,setFiles] = useState<File[]>([])

function upload(e:any){

setFiles([...files,...e.target.files])

}

return(

<div>

<h3 className="font-semibold mb-3">
Attachments
</h3>

<input
type="file"
multiple
onChange={upload}
/>

<ul className="mt-3">

{files.map((f,i)=>(
<li key={i}>
{f.name}
</li>
))}

</ul>

</div>

)

}