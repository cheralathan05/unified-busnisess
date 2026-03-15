"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  MoreVertical,
  Download,
  Mail,
  CheckCircle,
  Eye,
  XCircle,
  FileText,
} from "lucide-react"

interface Invoice {
  id: string
  customer: string
  amount: number
  tax?: number
  total: number
  dueDate: string
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled"
}

const statusStyles: Record<Invoice["status"], string> = {
  Draft:
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
  Sent:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  Paid:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  Overdue:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  Cancelled:
    "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function InvoiceTable({
  invoices = [],
}: {
  invoices?: Invoice[]
}) {
  if (!invoices.length) {
    return (
      <div className="mt-6 border border-border rounded-xl p-10 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

        <h3 className="font-semibold text-lg">No Invoices Found</h3>

        <p className="text-muted-foreground text-sm mt-1">
          Create your first invoice to start billing customers
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 border border-border rounded-xl overflow-hidden">

      {/* HEADER */}

      <div className="p-4 border-b border-border font-semibold">
        Invoices
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-muted/40">

            <tr className="text-muted-foreground">

              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>

            </tr>

          </thead>

          <tbody>

            {invoices.map((invoice) => (

              <tr
                key={invoice.id}
                className="border-t border-border hover:bg-muted/30 transition"
              >

                <td className="p-3 font-medium">
                  {invoice.id}
                </td>

                <td className="p-3">
                  {invoice.customer}
                </td>

                <td className="p-3">
                  {formatCurrency(invoice.amount)}
                </td>

                <td className="p-3 font-semibold">
                  {formatCurrency(invoice.total)}
                </td>

                <td className="p-3 text-muted-foreground">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>

                <td className="p-3">

                  <Badge
                    variant="outline"
                    className={statusStyles[invoice.status]}
                  >
                    {invoice.status}
                  </Badge>

                </td>

                {/* ACTION MENU */}

                <td className="p-3 text-right">

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">

                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Invoice
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reminder
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Paid
                      </DropdownMenuItem>

                      <DropdownMenuItem className="text-destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Invoice
                      </DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}
