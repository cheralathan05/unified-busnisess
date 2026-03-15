"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
  CreditCard,
  FileText,
  Download,
  RefreshCcw,
  User,
  Calendar,
} from "lucide-react"

interface PaymentDetails {
  id: string
  customer: string
  amount: number
  method: string
  status: "Paid" | "Pending" | "Failed" | "Refunded"
  invoice: string
  date: string
}

interface PaymentDetailsDrawerProps {
  open: boolean
  onClose: () => void
  payment: PaymentDetails | null
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function PaymentDetailsDrawer({
  open,
  onClose,
  payment,
}: PaymentDetailsDrawerProps) {
  if (!payment) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:w-[480px]">

        <SheetHeader>
          <SheetTitle>Payment Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">

          {/* STATUS */}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Status
            </span>

            <Badge variant="outline">
              {payment.status}
            </Badge>
          </div>

          <Separator />

          {/* CUSTOMER */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              Customer
            </div>

            <span className="font-medium">
              {payment.customer}
            </span>

          </div>

          {/* AMOUNT */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              Amount
            </div>

            <span className="font-semibold text-green-500">
              {formatCurrency(payment.amount)}
            </span>

          </div>

          {/* METHOD */}

          <div className="flex items-center justify-between">

            <span className="text-muted-foreground text-sm">
              Payment Method
            </span>

            <span>{payment.method}</span>

          </div>

          {/* INVOICE */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              Invoice
            </div>

            <span className="font-medium">
              {payment.invoice}
            </span>

          </div>

          {/* DATE */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Date
            </div>

            <span>
              {new Date(payment.date).toLocaleDateString()}
            </span>

          </div>

          <Separator />

          {/* ACTIONS */}

          <div className="space-y-3">

            <Button className="w-full gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>

            <Button className="w-full gap-2" variant="outline">
              <FileText className="w-4 h-4" />
              View Invoice
            </Button>

            <Button
              variant="destructive"
              className="w-full gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Refund Payment
            </Button>

          </div>

        </div>

      </SheetContent>
    </Sheet>
  )
}
