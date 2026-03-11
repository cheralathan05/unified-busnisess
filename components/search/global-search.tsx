'use client'

import { useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

import { useAppState } from "@/hooks/use-app-state"

import { searchLeads } from "./search-leads"
import { searchTasks } from "./search-tasks"
import { searchPayments } from "./search-payments"

import SearchResults from "./search-results"

export default function GlobalSearch() {

  const { leads, tasks, payments } = useAppState()

  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)

  const leadResults = searchLeads(leads, query)
  const taskResults = searchTasks(tasks, query)
  const paymentResults = searchPayments(payments, query)

  return (

    <div className="relative w-full max-w-md">

      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

      <Input
        placeholder="Search anything..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="pl-9"
      />

      {focused && query.length > 0 && (

        <SearchResults
          leads={leadResults}
          tasks={taskResults}
          payments={paymentResults}
        />

      )}

    </div>

  )

}