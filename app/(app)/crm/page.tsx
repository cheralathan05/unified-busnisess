'use client'

import { useState, useMemo } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAppState } from "@/hooks/use-app-state"

import LeadCard from "@/components/crm/lead-card"
import LeadSearch from "@/components/crm/lead-search"
import LeadFilters from "@/components/crm/lead-filters"
import LeadPagination from "@/components/crm/lead-pagination"
import BulkActions from "@/components/crm/bulk-actions"
import { CRMInsights } from "@/components/crm/crm-insights"
import { LeadTable } from "@/components/crm/lead-table"

import {
  Plus,
  List,
  Kanban as KanbanIcon,
  BarChart3,
} from "lucide-react"

export default function CRMPage() {

  const { leads } = useAppState()

  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const pageSize = 10

  /* FILTERED LEADS */

  const filteredLeads = useMemo(() => {

    return leads
      .filter((lead) =>
        lead.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
      .filter((lead) =>
        statusFilter === "all"
          ? true
          : lead.status === statusFilter
      )

  }, [leads, searchQuery, statusFilter])

  /* PAGINATION */

  const totalPages =
    Math.ceil(filteredLeads.length / pageSize)

  const paginatedLeads = filteredLeads.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  return (

    <div className="w-full h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">

        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">

          {/* HEADER */}

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">

                CRM & Leads

              </h1>

              <p className="text-muted-foreground mt-1">

                Manage your sales pipeline and customer relationships

              </p>

            </div>

            <Link href="/crm/add-lead">

              <Button className="gap-2">

                <Plus className="w-4 h-4" />

                Add Lead

              </Button>

            </Link>

          </div>

          {/* CRM INSIGHTS */}

          <div>
            <CRMInsights />
          </div>

          {/* SEARCH + FILTER */}

          <div className="flex flex-col md:flex-row gap-4 md:items-center">

            <LeadSearch
              value={searchQuery}
              setValue={(value) => {
                setSearchQuery(value)
                setPage(1)
              }}
            />

            <LeadFilters
              setStatus={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            />

          </div>

          {/* VIEW SWITCH */}

          <Tabs
            value={view}
            onValueChange={(v) => setView(v as any)}
          >

            <TabsList>

              <TabsTrigger value="list">

                <List className="w-4 h-4 mr-2" />

                List

              </TabsTrigger>

              <TabsTrigger value="kanban">

                <KanbanIcon className="w-4 h-4 mr-2" />

                Board

              </TabsTrigger>

            </TabsList>

          </Tabs>

          {/* BULK ACTIONS */}

          {selectedLeads.length > 0 && (

            <BulkActions
              selectedIds={selectedLeads}
              onDelete={() => {}}
            />

          )}

          {/* EMPTY STATE */}

          {filteredLeads.length === 0 && (

            <div className="border rounded-lg p-10 text-center">

              <p className="text-muted-foreground">

                No leads found.

              </p>

            </div>

          )}

          {/* LIST VIEW */}

          {view === "list" && filteredLeads.length > 0 && (

            <div className="space-y-3">

              {paginatedLeads.map((lead) => (

                <LeadCard
                  key={lead.id}
                  lead={lead}
                />

              ))}

            </div>

          )}

          {/* KANBAN VIEW */}

          {view === "kanban" && (

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

              {["New","Contacted","Proposal","Negotiation","Won","Lost"]
                .map((status) => {

                const columnLeads =
                  filteredLeads.filter(
                    l => l.status === status
                  )

                return (

                  <div
                    key={status}
                    className="space-y-3"
                  >

                    <h3 className="font-semibold text-sm">

                      {status} ({columnLeads.length})

                    </h3>

                    {columnLeads.map((lead) => (

                      <LeadCard
                        key={lead.id}
                        lead={lead}
                      />

                    ))}

                  </div>

                )

              })}

            </div>

          )}

          {/* PAGINATION */}

          {view === "list" && totalPages > 1 && (

            <LeadPagination
              page={page}
              totalPages={totalPages}
              setPage={setPage}
            />

          )}

        </div>

      </div>

    </div>

  )

}
