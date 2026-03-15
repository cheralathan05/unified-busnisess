'use client'

import { Button } from "@/components/ui/button"

interface Props {

page:number
pages:number
setPage:(n:number)=>void

}

export default function LeadPagination({

page,
pages,
setPage

}:Props){

if(pages <= 1) return null

return(

<div className="flex items-center justify-between mt-4">

<Button
variant="outline"
disabled={page === 1}
onClick={()=>setPage(page-1)}
>

Prev

</Button>

<span className="text-sm text-muted-foreground">

Page {page} of {pages}

</span>

<Button
variant="outline"
disabled={page === pages}
onClick={()=>setPage(page+1)}
>

Next

</Button>

</div>

)

}