'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge-enhanced'
import { Calendar, DollarSign, Download, Eye, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface InvoiceCardProps {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  dueDate: Date
  issueDate: Date
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  description?: string
  items?: Array<{ name: string; quantity: number; price: number }>
  onView?: () => void
  onDownload?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

const statusConfig: Record<string, { badge: string; color: string }> = {
  draft: { badge: 'soft', color: 'primary' },
  pending: { badge: 'soft', color: 'warning' },
  paid: { badge: 'soft', color: 'success' },
  overdue: { badge: 'solid', color: 'destructive' },
  cancelled: { badge: 'outline', color: 'muted-foreground' },
}

export function InvoiceCard({
  id,
  invoiceNumber,
  customerName,
  amount,
  dueDate,
  issueDate,
  status,
  description,
  items,
  onView,
  onDownload,
  onEdit,
  onDelete,
  className,
}: InvoiceCardProps) {
  const config = statusConfig[status]
  const daysUntilDue = Math.floor((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysUntilDue < 0 && status !== 'paid'

  return (
    <Card className={cn('overflow-hidden hover:shadow-elevation-2 transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{invoiceNumber}</CardTitle>
            <CardDescription>{customerName}</CardDescription>
          </div>

          <Badge
            variant={config.badge as any}
            color={config.color as any}
            size="sm"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="flex items-baseline justify-between p-3 rounded-lg bg-muted/30">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="text-2xl font-bold">₹{amount.toLocaleString()}</span>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Issued</p>
            <p className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {issueDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Due</p>
            <p
              className={cn(
                'flex items-center gap-1.5 font-medium',
                isOverdue ? 'text-destructive' : daysUntilDue < 3 ? 'text-warning' : '',
              )}
            >
              <Calendar className="w-4 h-4" />
              {dueDate.toLocaleDateString()}
              {isOverdue && <span className="text-xs">OVERDUE</span>}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="text-sm text-muted-foreground border-t border-border/50 pt-3">
            {description}
          </div>
        )}

        {/* Items preview */}
        {items && items.length > 0 && (
          <div className="text-xs border-t border-border/50 pt-3">
            <p className="text-muted-foreground mb-2 font-medium">Items</p>
            <div className="space-y-1">
              {items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">₹{(item.quantity * item.price).toLocaleString()}</span>
                </div>
              ))}
              {items.length > 2 && (
                <p className="text-muted-foreground italic">+{items.length - 2} more items</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border/50">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onView}
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onDownload}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

/* Grid for invoices */
export function InvoiceGrid({
  invoices,
  className,
  children,
}: {
  invoices: InvoiceCardProps[]
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} {...invoice} />
      ))}
      {children}
    </div>
  )
}
