'use client'

import { Button } from "@/components/ui/button"

interface Props{
page:number
setPage:(n:number)=>void
}

export default function LeadPagination({page,setPage}:Props){

return(

<div className="flex gap-2">

<Button
variant="outline"
onClick={()=>setPage(page-1)}
>
Prev
</Button>

<Button
variant="outline"
onClick={()=>setPage(page+1)}
>
Next
</Button>

</div>

)

}