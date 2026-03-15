'use client'

import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { MoreVertical } from 'lucide-react'

import { Lead } from '@/lib/services/lead.service'
import { formatDate } from '@/lib/utils/date'

const statusColors: Record<string, string> = {

NEW: 'bg-blue-100 text-blue-700 border-blue-200',
CONTACTED: 'bg-purple-100 text-purple-700 border-purple-200',
QUALIFIED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
WON: 'bg-green-100 text-green-700 border-green-200',
LOST: 'bg-red-100 text-red-700 border-red-200'

}

interface Props {

leads: Lead[]
onSelectLead: (lead: Lead) => void
onDeleteLead?: (id: string) => void
onEditLead?: (id: string) => void

}

export function LeadList({

leads,
onSelectLead,
onDeleteLead,
onEditLead

}: Props) {

if (!leads || leads.length === 0) {

return (

<CardContent className="p-6 text-center">

<p className="text-muted-foreground text-sm">
No leads found
</p>

</CardContent>

)

}

return (

<CardContent className="p-0">

<div className="divide-y divide-border">

{leads.map((lead) => {

const initials = lead.name
?.split(" ")
.map(n => n[0])
.join("")
.slice(0,2)
.toUpperCase() || "LD"

return (

<div
key={lead.id}
className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group flex items-center justify-between"
onClick={() => onSelectLead(lead)}
>

<div className="flex items-center gap-4 flex-1 min-w-0">

{/* Avatar */}

<Avatar>

<AvatarFallback className="text-xs font-semibold">

{initials}

</AvatarFallback>

</Avatar>

{/* Lead Info */}

<div className="flex-1 min-w-0">

<p className="font-medium text-foreground group-hover:text-primary transition-colors">

{lead.name}

</p>

{lead.source && (

<p className="text-xs text-muted-foreground">

{lead.source}

</p>

)}

{lead.email && (

<p className="text-xs text-muted-foreground">

{lead.email}

</p>

)}

</div>

{/* Created Date */}

{lead.createdAt && (

<div className="text-right hidden md:block">

<p className="text-xs text-muted-foreground">

{formatDate(lead.createdAt)}

</p>

</div>

)}

{/* Status */}

<Badge
variant="outline"
className={`${statusColors[lead.status] ?? 'bg-gray-100 text-gray-600'} border`}
>

{lead.status}

</Badge>

</div>

{/* Actions */}

<DropdownMenu>

<DropdownMenuTrigger
asChild
onClick={(e)=>e.stopPropagation()}
>

<Button
variant="ghost"
size="icon"
className="opacity-0 group-hover:opacity-100 transition-opacity"
>

<MoreVertical className="w-4 h-4"/>

</Button>

</DropdownMenuTrigger>

<DropdownMenuContent align="end">

<DropdownMenuItem
onClick={(e)=>{

e.stopPropagation()
onEditLead?.(lead.id)

}}
>

Edit Lead

</DropdownMenuItem>

<DropdownMenuItem
className="text-destructive"
onClick={(e)=>{

e.stopPropagation()
onDeleteLead?.(lead.id)

}}
>

Delete Lead

</DropdownMenuItem>

</DropdownMenuContent>

</DropdownMenu>

</div>

)

})}

</div>

</CardContent>

)

}