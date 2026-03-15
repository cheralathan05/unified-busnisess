"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  Download,
  CreditCard,
  Calendar,
  User,
  Hash
} from "lucide-react"

interface PaymentReceiptProps {
  transactionId: string
  customer: string
  amount: number
  method: string
  date: string
  status: "Paid" | "Pending" | "Refunded"
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function PaymentReceipt({
  transactionId,
  customer,
  amount,
  method,
  date,
  status,
}: PaymentReceiptProps) {

  const downloadReceipt = () => {
    window.print()
  }

  return (
    <Card className="border-border">

      <CardHeader className="flex flex-row items-center justify-between">

        <CardTitle className="text-base">
          Payment Receipt
        </CardTitle>

        <Button
          variant="outline"
          size="sm"
          onClick={downloadReceipt}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>

      </CardHeader>

      <CardContent className="space-y-4">

        {/* TRANSACTION */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="w-4 h-4" />
            Transaction
          </div>

          <span className="font-medium">
            {transactionId}
          </span>

        </div>

        {/* CUSTOMER */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            Customer
          </div>

          <span>{customer}</span>

        </div>

        {/* AMOUNT */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            Amount
          </div>

          <span className="font-semibold text-green-500">
            {formatCurrency(amount)}
          </span>

        </div>

        {/* METHOD */}

        <div className="flex items-center justify-between">

          <span className="text-muted-foreground text-sm">
            Payment Method
          </span>

          <span>{method}</span>

        </div>

        {/* DATE */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Date
          </div>

          <span>
            {new Date(date).toLocaleDateString()}
          </span>

        </div>

        {/* STATUS */}

        <div className="flex items-center justify-between border-t border-border pt-3">

          <span className="text-muted-foreground text-sm">
            Status
          </span>

          <span className="font-medium">
            {status}
          </span>

        </div>

      </CardContent>

    </Card>
  )
}
