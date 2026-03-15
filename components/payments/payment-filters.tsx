"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PaymentFiltersProps {
  onFilterChange?: (filters: {
    search: string
    status: string
    method: string
  }) => void
}

export default function PaymentFilters({ onFilterChange }: PaymentFiltersProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [method, setMethod] = useState("")

  const applyFilters = () => {
    onFilterChange?.({
      search,
      status,
      method,
    })
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("")
    setMethod("")

    onFilterChange?.({
      search: "",
      status: "",
      method: "",
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 mt-4">

      {/* SEARCH */}

      <Input
        placeholder="Search customer or invoice..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full lg:w-72"
      />

      {/* STATUS */}

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border border-border bg-background px-3 py-2 rounded-md"
      >
        <option value="">All Status</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
      </select>

      {/* METHOD */}

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="border border-border bg-background px-3 py-2 rounded-md"
      >
        <option value="">Payment Method</option>
        <option value="upi">UPI</option>
        <option value="card">Card</option>
        <option value="bank">Bank Transfer</option>
        <option value="cash">Cash</option>
        <option value="wallet">Wallet</option>
      </select>

      {/* ACTION BUTTONS */}

      <div className="flex gap-2">

        <Button
          onClick={applyFilters}
          className="px-4"
        >
          Apply
        </Button>

        <Button
          variant="outline"
          onClick={resetFilters}
        >
          Reset
        </Button>

      </div>

    </div>
  )
}
