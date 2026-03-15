"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, FileText, IndianRupee, TrendingUp } from "lucide-react"

interface LeadPaymentSummaryProps {
  leadName: string
  payments?: number
  invoices?: number
  revenue?: number
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function LeadPaymentSummary({
  leadName,
  payments = 0,
  invoices = 0,
  revenue = 0,
}: LeadPaymentSummaryProps) {
  return (
    <Card className="border-border">

      {/* HEADER */}

      <CardHeader className="flex flex-row items-center justify-between pb-2">

        <CardTitle className="text-sm font-semibold">
          Lead Payment Summary
        </CardTitle>

        <Badge variant="outline">
          {leadName}
        </Badge>

      </CardHeader>

      {/* CONTENT */}

      <CardContent className="space-y-4">

        {/* PAYMENTS */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            Payments
          </div>

          <span className="font-semibold text-foreground">
            {payments}
          </span>

        </div>

        {/* INVOICES */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            Invoices
          </div>

          <span className="font-semibold text-foreground">
            {invoices}
          </span>

        </div>

        {/* REVENUE */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <IndianRupee className="w-4 h-4" />
            Revenue
          </div>

          <span className="font-bold text-green-500">
            {formatCurrency(revenue)}
          </span>

        </div>

        {/* PERFORMANCE */}

        <div className="flex items-center justify-between border-t border-border pt-3">

          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            Conversion
          </div>

          <span className="text-sm text-muted-foreground">
            {payments > 0 ? `${Math.round((payments / invoices) * 100) || 0}%` : "0%"}
          </span>

        </div>

      </CardContent>

    </Card>
  )
}
