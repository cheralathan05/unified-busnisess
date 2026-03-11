import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, MoreVertical, Download, Mail } from 'lucide-react'

interface Payment {
  id: number
  customer: string
  amount: string
  status: 'Paid' | 'Pending' | 'Overdue'
  date: string
  invoice: string
  method: string
}

const statusColors: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  Overdue: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

export function PaymentList({ payments }: { payments: Payment[] }) {
  return (
    <CardContent className="p-0">
      <div className="divide-y divide-border overflow-x-auto">
        <div className="px-6 py-3 flex items-center gap-4 text-xs font-semibold text-muted-foreground bg-muted/50 hidden md:flex">
          <div className="flex-1">Customer</div>
          <div className="w-24">Invoice</div>
          <div className="w-32">Amount</div>
          <div className="w-24">Method</div>
          <div className="w-20">Status</div>
          <div className="w-20">Date</div>
          <div className="w-10"></div>
        </div>

        {payments.map((payment) => (
          <div
            key={payment.id}
            className="px-6 py-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center gap-4 group"
          >
            <div className="flex-1 flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{payment.customer}</p>
                <p className="text-xs text-muted-foreground md:hidden">
                  {payment.invoice}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:w-24 gap-2">
              <p className="text-xs text-muted-foreground md:hidden">Invoice:</p>
              <p className="text-sm font-medium text-foreground">{payment.invoice}</p>
            </div>

            <div className="flex items-center justify-between md:w-32 gap-2">
              <p className="text-xs text-muted-foreground md:hidden">Amount:</p>
              <p className="text-sm font-semibold text-foreground">{payment.amount}</p>
            </div>

            <div className="hidden md:flex md:w-24">
              <p className="text-sm text-muted-foreground">{payment.method}</p>
            </div>

            <div className="flex items-center justify-between md:w-20 gap-2">
              <p className="text-xs text-muted-foreground md:hidden">Status:</p>
              <Badge
                variant="outline"
                className={`${statusColors[payment.status]} border`}
              >
                {payment.status}
              </Badge>
            </div>

            <div className="hidden md:flex md:w-20">
              <p className="text-sm text-muted-foreground">{payment.date}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity md:w-10 md:h-10"
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
                <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </CardContent>
  )
}
