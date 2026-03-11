'use client'

import { Button } from "@/components/ui/button"
import { Trash2,Download } from "lucide-react"

interface Props{

selectedIds:string[]
onDelete:(ids:string[])=>void

}

export default function BulkActions({
selectedIds,
onDelete
}:Props){

if(selectedIds.length===0)return null

return(

<div className="flex gap-3 items-center p-3 bg-muted rounded">

<span className="text-sm">
{selectedIds.length} selected
</span>

<Button
variant="destructive"
size="sm"
onClick={()=>onDelete(selectedIds)}
>

<Trash2 className="w-4 h-4 mr-1"/>

Delete

</Button>

<Button
variant="outline"
size="sm"
>

<Download className="w-4 h-4 mr-1"/>

Export CSV

</Button>

</div>

)

}