'use client'

import { MouseEvent } from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

import LeadPaymentSummary from "@/components/crm/lead-payment-summary"

import { formatCurrency } from "@/lib/utils/currency"
import { formatDate } from "@/lib/utils/date"

import { Lead } from "@/lib/services/lead.service"

import { getStageProbability } from "@/components/crm/pipeline/pipeline-utils"

import {
Mail,
Phone,
PhoneCall,
MailCheck,
Calendar
} from "lucide-react"

interface Props {

lead: Lead
selected?: boolean
onSelect?: () => void
onClick?: () => void

}

const statusColors: Record<string,string> = {

NEW: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
CONTACTED: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
QUALIFIED: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
WON: "bg-green-500/10 text-green-400 border border-green-500/30",
LOST: "bg-red-500/10 text-red-400 border border-red-500/30"

}

export default function LeadCard({

lead,
selected,
onSelect,
onClick

}: Props){

const statusClass =
statusColors[lead.status] ??
"bg-gray-500/10 text-gray-400"

const progress =
getStageProbability(lead.status)

const handleCheckbox = (e: MouseEvent) => {

e.stopPropagation()
onSelect?.()

}

return(

<Card
onClick={onClick}
className="p-4 hover:shadow-lg transition-all border-border/50 cursor-pointer"
>

<div className="flex gap-3">

{/* CHECKBOX */}

{onSelect && (

<Checkbox
checked={selected}
onClick={handleCheckbox}
className="mt-1"
/>

)}

<div className="flex-1">

<div className="flex items-start justify-between gap-4">

{/* LEFT */}

<div className="min-w-0">

<h3 className="text-lg font-semibold truncate">

{lead.name}

</h3>

{lead.source && (

<p className="text-sm text-muted-foreground truncate">

{lead.source}

</p>

)}

{/* CONTACT */}

<div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">

{lead.email && (

<div className="flex items-center gap-1 truncate">

<Mail className="w-4 h-4"/>

<span className="truncate">

{lead.email}

</span>

</div>

)}

{lead.phone && (

<div className="flex items-center gap-1">

<Phone className="w-4 h-4"/>

{lead.phone}

</div>

)}

</div>

</div>

{/* RIGHT */}

<div className="text-right flex-shrink-0 space-y-2">

<p className="font-semibold text-foreground">

{formatCurrency(lead.value ?? 0)}

</p>

<Badge className={statusClass}>

{lead.status}

</Badge>

</div>

</div>

{/* PROGRESS */}

<div className="mt-4">

<Progress
value={progress}
className="h-2"
/>

<p className="text-xs text-muted-foreground mt-1">

Deal probability {progress}%

</p>

</div>

{/* ENGAGEMENT */}

<div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">

<div className="flex items-center gap-1">

<PhoneCall className="w-4 h-4"/>

{lead.calls ?? 0}

</div>

<div className="flex items-center gap-1">

<MailCheck className="w-4 h-4"/>

{lead.emails ?? 0}

</div>

<div className="flex items-center gap-1">

<Calendar className="w-4 h-4"/>

{lead.nextFollowUp
? formatDate(lead.nextFollowUp)
: "No follow-up"}

</div>

</div>

{/* PAYMENT SUMMARY */}

<div className="mt-4">

<LeadPaymentSummary
totalPayments={lead.totalPayments ?? 0}
totalInvoices={lead.totalInvoices ?? 0}
totalRevenue={lead.totalRevenue ?? 0}
/>

</div>

</div>

</div>

</Card>

)

}