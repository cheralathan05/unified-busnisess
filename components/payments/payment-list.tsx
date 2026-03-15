"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  FileText,
  MoreVertical,
  Download,
  Mail,
  Trash2,
  CheckCircle,
} from "lucide-react"

/* ---------------- TYPES ---------------- */

export interface Payment {
  id: number
  customer: string
  amount: number
  status: "Paid" | "Pending" | "Overdue"
  date: string
  invoice: string
  method: string
}

interface PaymentListProps {
  payments: Payment[]
  onDelete?: (id: number) => void
  onMarkPaid?: (id: number) => void
  onRowClick?: (payment: Payment) => void
  loading?: boolean
}

/* ---------------- STATUS COLORS ---------------- */

const statusColors: Record<Payment["status"], string> = {
  Paid:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",

  Pending:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",

  Overdue:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
}

/* ---------------- HELPERS ---------------- */

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

/* ---------------- COMPONENT ---------------- */

export function PaymentList({
  payments,
  onDelete,
  onMarkPaid,
  onRowClick,
  loading = false,
}: PaymentListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Loading payments...
        </CardContent>
      </Card>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mb-3" />

          <h3 className="text-lg font-semibold">No Payments Found</h3>

          <p className="text-sm text-muted-foreground mt-1">
            Record your first payment to start tracking revenue
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">

        <div className="divide-y divide-border overflow-x-auto">

          {/* TABLE HEADER */}

          <div className="px-6 py-3 hidden md:flex items-center gap-4 text-xs font-semibold text-muted-foreground bg-muted/50">

            <div className="flex-1">Customer</div>
            <div className="w-28">Invoice</div>
            <div className="w-32">Amount</div>
            <div className="w-28">Method</div>
            <div className="w-24">Status</div>
            <div className="w-28">Date</div>
            <div className="w-10"></div>

          </div>

          {/* PAYMENT ROWS */}

          {payments.map((payment) => (

            <div
              key={payment.id}
              onClick={() => onRowClick?.(payment)}
              className="px-6 py-4 hover:bg-muted/30 transition flex flex-col md:flex-row md:items-center gap-4 group cursor-pointer"
            >

              {/* CUSTOMER */}

              <div className="flex-1 flex items-center gap-3">

                <FileText className="w-4 h-4 text-muted-foreground" />

                <div>

                  <p className="font-medium text-foreground">
                    {payment.customer}
                  </p>

                  <p className="text-xs text-muted-foreground md:hidden">
                    {payment.invoice}
                  </p>

                </div>

              </div>

              {/* INVOICE */}

              <div className="flex items-center justify-between md:w-28">

                <span className="text-xs text-muted-foreground md:hidden">
                  Invoice
                </span>

                <span className="text-sm font-medium">
                  {payment.invoice}
                </span>

              </div>

              {/* AMOUNT */}

              <div className="flex items-center justify-between md:w-32">

                <span className="text-xs text-muted-foreground md:hidden">
                  Amount
                </span>

                <span className="text-sm font-semibold">
                  {formatCurrency(payment.amount)}
                </span>

              </div>

              {/* METHOD */}

              <div className="hidden md:flex md:w-28 text-sm text-muted-foreground">
                {payment.method}
              </div>

              {/* STATUS */}

              <div className="flex items-center justify-between md:w-24">

                <span className="text-xs text-muted-foreground md:hidden">
                  Status
                </span>

                <Badge
                  variant="outline"
                  className={`${statusColors[payment.status]} border`}
                >
                  {payment.status}
                </Badge>

              </div>

              {/* DATE */}

              <div className="hidden md:flex md:w-28 text-sm text-muted-foreground">
                {payment.date}
              </div>

              {/* ACTION MENU */}

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >

                    <MoreVertical className="w-4 h-4" />

                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

                  <DropdownMenuItem>

                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice

                  </DropdownMenuItem>

                  <DropdownMenuItem>

                    <Mail className="w-4 h-4 mr-2" />
                    Send Reminder

                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onMarkPaid?.(payment.id)}
                  >

                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid

                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(payment.id)}
                  >

                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

            </div>

          ))}

        </div>

      </CardContent>
    </Card>
  )
}
