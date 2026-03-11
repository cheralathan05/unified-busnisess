'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, Checkbox } from 'lucide-react'
import { motion } from 'framer-motion'

export interface ColumnDef<T> {
  id: string
  header: string
  accessor: (row: T) => React.ReactNode
  width?: string
  sortable?: boolean
  filterable?: boolean
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (row: T) => void
  onSelectRows?: (rows: T[]) => void
  striped?: boolean
  hoverable?: boolean
  selectable?: boolean
  className?: string
  emptyState?: React.ReactNode
  loading?: boolean
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  onRowClick,
  onSelectRows,
  striped = true,
  hoverable = true,
  selectable = false,
  className,
  emptyState,
  loading = false,
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnId)
      setSortOrder('asc')
    }
  }

  const toggleRowSelection = (rowId: string | number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId)
    } else {
      newSelected.add(rowId)
    }
    setSelectedRows(newSelected)
    onSelectRows?.(data.filter(row => newSelected.has(row.id)))
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
      onSelectRows?.([])
    } else {
      const allIds = new Set(data.map(row => row.id))
      setSelectedRows(allIds)
      onSelectRows?.(data)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        {emptyState || (
          <div>
            <p className="text-muted-foreground">No data to display</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b border-border/50 bg-muted/20">
            {selectable && (
              <th className="px-4 py-3 w-12">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={toggleAllSelection}
                  className="cursor-pointer"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left',
                  column.width,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer hover:text-foreground transition-colors',
                )}
                onClick={() => column.sortable && handleSort(column.id)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && sortBy === column.id && (
                    <>
                      {sortOrder === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, idx) => (
            <motion.tr
              key={row.id || idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border/30 transition-colors',
                striped && idx % 2 === 0 && 'bg-muted/10',
                hoverable && 'hover:bg-muted/30 cursor-pointer',
                selectedRows.has(row.id) && 'bg-primary/10',
              )}
            >
              {selectable && (
                <td className="px-4 py-3 w-12">
                  <Checkbox
                    checked={selectedRows.has(row.id)}
                    onChange={() => toggleRowSelection(row.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={`${row.id}-${column.id}`}
                  className={cn(
                    'px-4 py-3 text-sm',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.width,
                  )}
                >
                  {column.accessor(row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
