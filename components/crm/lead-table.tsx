'use client'

import React, { useState } from 'react'
import { Lead } from '@/hooks/use-app-state'
import { DataTable, ColumnDef } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge-enhanced'
import { StatusIndicator } from '@/components/crm/status-indicator'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface LeadTableProps {
  leads: Lead[]
  onSelectLeads?: (leads: Lead[]) => void
  onDelete?: (lead: Lead) => void
  selectable?: boolean
  className?: string
}

export function LeadTable({
  leads,
  onSelectLeads,
  onDelete,
  selectable = true,
  className,
}: LeadTableProps) {
  const columns: ColumnDef<Lead>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: (lead) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{lead.name}</p>
            <p className="text-xs text-muted-foreground">{lead.email}</p>
          </div>
        </div>
      ),
      width: '280px',
      sortable: true,
    },
    {
      id: 'company',
      header: 'Company',
      accessor: (lead) => (
        <p className="font-medium">{lead.company || '-'}</p>
      ),
      width: '150px',
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (lead) => (
        <StatusIndicator status={lead.status} showLabel={true} />
      ),
      width: '140px',
      sortable: true,
    },
    {
      id: 'value',
      header: 'Deal Value',
      accessor: (lead) => (
        <p className={cn(
          'font-semibold',
          lead.dealValue > 100000 ? 'text-success' : lead.dealValue > 50000 ? 'text-primary' : ''
        )}>
          ₹{lead.dealValue.toLocaleString()}
        </p>
      ),
      width: '130px',
      align: 'right',
      sortable: true,
    },
    {
      id: 'created',
      header: 'Created',
      accessor: (lead) => (
        <p className="text-sm text-muted-foreground">
          {new Date(lead.createdAt).toLocaleDateString()}
        </p>
      ),
      width: '110px',
      sortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (lead) => (
        <div className="flex items-center gap-1">
          <Link href={`/crm/${lead.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/crm/${lead.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:text-destructive"
              onClick={() => onDelete(lead)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      width: '100px',
      align: 'center',
    },
  ]

  return (
    <DataTable<Lead>
      data={leads}
      columns={columns}
      selectable={selectable}
      onSelectRows={onSelectLeads}
      hoverable
      striped
      className={className}
      emptyState={
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No leads found</p>
          <Link href="/crm/add-lead">
            <Button>Add Your First Lead</Button>
          </Link>
        </div>
      }
    />
  )
}
