'use client'

import { useEffect, useState } from "react"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
IndianRupee,
FileText,
CreditCard
} from 'lucide-react'

import { formatCurrency } from '@/lib/utils/currency'
import { api } from '@/lib/api'

interface Props{
leadId:string
}

interface BillingSummary{

totalPayments:number
totalInvoices:number
totalRevenue:number

}

export default function LeadPaymentSummary({leadId}:Props){

const [data,setData] = useState<BillingSummary>({
totalPayments:0,
totalInvoices:0,
totalRevenue:0
})

const [loading,setLoading] = useState(true)

async function loadSummary(){

try{

const res = await api.get(`/billing/summary/${leadId}`)

setData(res.data || data)

}catch(err){

console.error("Billing summary error",err)

}finally{

setLoading(false)

}

}

useEffect(()=>{

if(leadId) loadSummary()

},[leadId])

return(

<Card className="mt-3 border-border bg-card">

<CardContent className="p-4">

<div className="flex items-center justify-between mb-3">

<h3 className="text-sm font-semibold text-foreground">

Payment Summary

</h3>

<Badge variant="outline">

Billing

</Badge>

</div>

{loading && (

<p className="text-xs text-muted-foreground">
Loading billing...
</p>

)}

<div className="space-y-3 text-sm">

<div className="flex items-center justify-between">

<div className="flex items-center gap-2 text-muted-foreground">

<CreditCard className="w-4 h-4"/>

Payments

</div>

<span className="font-medium text-foreground">

{data.totalPayments}

</span>

</div>

<div className="flex items-center justify-between">

<div className="flex items-center gap-2 text-muted-foreground">

<FileText className="w-4 h-4"/>

Invoices

</div>

<span className="font-medium text-foreground">

{data.totalInvoices}

</span>

</div>

<div className="flex items-center justify-between">

<div className="flex items-center gap-2 text-muted-foreground">

<IndianRupee className="w-4 h-4"/>

Revenue

</div>

<span className="font-semibold text-green-500">

{formatCurrency(data.totalRevenue)}

</span>

</div>

</div>

</CardContent>

</Card>

)

}