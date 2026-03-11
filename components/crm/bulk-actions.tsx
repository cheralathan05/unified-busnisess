'use client'

import { Button } from "@/components/ui/button"
import { Trash2, Download, Tag, User, Mail, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Props {
  selectedIds: string[]
  onDelete: (ids: string[]) => void
  onBulkStatusChange?: (ids: string[], status: string) => void
  onBulkAssign?: (ids: string[], assignee: string) => void
  onBulkTag?: (ids: string[], tags: string[]) => void
  className?: string
}

export default function BulkActions({
  selectedIds,
  onDelete,
  onBulkStatusChange,
  onBulkAssign,
  onBulkTag,
  className,
}: Props) {
  if (selectedIds.length === 0) return null

  const statuses = ['New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost']
  const assignees = ['You', 'Team Member 1', 'Team Member 2']

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex flex-wrap gap-3 items-center p-4 rounded-lg border border-primary/30 bg-primary/5 sticky bottom-4 z-40',
        className,
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium">
          {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Action divider */}
      <div className="w-px h-6 bg-border/50 hidden sm:block" />

      {/* Status change */}
      {onBulkStatusChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onBulkStatusChange(selectedIds, status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Assign */}
      {onBulkAssign && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Assign
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {assignees.map((assignee) => (
              <DropdownMenuItem
                key={assignee}
                onClick={() => onBulkAssign(selectedIds, assignee)}
              >
                {assignee}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Send email */}
      <Button variant="outline" size="sm" className="gap-2">
        <Mail className="w-4 h-4" />
        Send Email
      </Button>

      {/* Export */}
      <Button variant="outline" size="sm" className="gap-2">
        <Download className="w-4 h-4" />
        Export
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(selectedIds)}
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </motion.div>
  )
}
