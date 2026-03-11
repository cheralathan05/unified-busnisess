'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, X } from 'lucide-react'

interface Props {
  setStatus: (s: string) => void
  onFiltersChange?: (filters: FilterOptions) => void
}

interface FilterOptions {
  status: string
  company?: string
  source?: string
  dealValue?: string
  lastActivity?: string
}

export default function LeadFilters({ setStatus, onFiltersChange }: Props) {
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set())
  const [status, setStatusValue] = useState('all')

  const handleStatusChange = (value: string) => {
    setStatusValue(value)
    setStatus(value)
  }

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(selectedFilters)
    if (newFilters.has(filter)) {
      newFilters.delete(filter)
    } else {
      newFilters.add(filter)
    }
    setSelectedFilters(newFilters)
  }

  const clearFilters = () => {
    setSelectedFilters(new Set())
    setStatusValue('all')
    setStatus('all')
  }

  const hasActiveFilters = selectedFilters.size > 0 || status !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter */}
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="New">New</SelectItem>
          <SelectItem value="Contacted">Contacted</SelectItem>
          <SelectItem value="Proposal">Proposal</SelectItem>
          <SelectItem value="Negotiation">Negotiation</SelectItem>
          <SelectItem value="Won">Won</SelectItem>
          <SelectItem value="Lost">Lost</SelectItem>
        </SelectContent>
      </Select>

      {/* Advanced Filters Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={hasActiveFilters ? 'border-primary text-primary' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            More Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                {selectedFilters.size}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuCheckboxItem
            checked={selectedFilters.has('high-value')}
            onCheckedChange={() => toggleFilter('high-value')}
          >
            High Value Deals (₹50k+)
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={selectedFilters.has('inactive')}
            onCheckedChange={() => toggleFilter('inactive')}
          >
            Inactive (7+ days)
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={selectedFilters.has('follow-up')}
            onCheckedChange={() => toggleFilter('follow-up')}
          >
            Requires Follow-up
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={selectedFilters.has('hot-lead')}
            onCheckedChange={() => toggleFilter('hot-lead')}
          >
            Hot Leads
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          {hasActiveFilters && (
            <div className="px-2 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={clearFilters}
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
