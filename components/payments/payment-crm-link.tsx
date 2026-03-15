"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { User, Briefcase, ArrowRight } from "lucide-react"

interface PaymentCRMProps {
  customerName: string
  leadId?: string
  dealId?: string
  dealValue?: number
}

const formatCurrency = (value?: number) =>
  value ? `₹${value.toLocaleString("en-IN")}` : "—"

export default function PaymentCRMLink({
  customerName,
  leadId,
  dealId,
  dealValue,
}: PaymentCRMProps) {
  return (
    <Card className="border-border">

      <CardHeader className="flex flex-row items-center justify-between">

        <CardTitle className="text-sm font-semibold">
          CRM Connection
        </CardTitle>

        <Badge variant="outline">
          Linked
        </Badge>

      </CardHeader>

      <CardContent className="space-y-4">

        {/* CUSTOMER */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            Customer
          </div>

          <span className="font-medium text-foreground">
            {customerName}
          </span>

        </div>

        {/* LEAD */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            Lead
          </div>

          {leadId ? (
            <Link href={`/crm/leads/${leadId}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                {leadId}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}

        </div>

        {/* DEAL */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            Deal
          </div>

          {dealId ? (
            <Link href={`/crm/deals/${dealId}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                {dealId}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}

        </div>

        {/* DEAL VALUE */}

        <div className="flex items-center justify-between border-t border-border pt-3">

          <span className="text-muted-foreground text-sm">
            Deal Value
          </span>

          <span className="font-semibold text-green-500">
            {formatCurrency(dealValue)}
          </span>

        </div>

      </CardContent>

    </Card>
  )
}
