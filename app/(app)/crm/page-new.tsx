'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useAppState } from '@/hooks/use-app-state'

import {
  Plus,
  Search,
  List,
  Kanban as KanbanIcon,
  Mail,
  Phone
} from 'lucide-react'

const statuses = [
  "New",
  "Contacted",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost"
] as const

const statusColors: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  Contacted: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  Proposal: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  Negotiation: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
  Won: 'bg-green-500/10 text-green-400 border border-green-500/30',
  Lost: 'bg-red-500/10 text-red-400 border border-red-500/30'
}

export default function CRMPage() {

  const { leads } = useAppState()

  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  /* Filter Leads */

  const filteredLeads = useMemo(() => {

    return leads.filter((lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

  }, [leads, searchQuery])

  /* Group Leads for Kanban */

  const leadsByStatus = useMemo(() => {

    const grouped: Record<string, typeof leads> = {}

    statuses.forEach(status => {
      grouped[status] = filteredLeads.filter(l => l.status === status)
    })

    return grouped

  }, [filteredLeads])

  return (

    <div className="w-full h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

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

                <Plus className="w-5 h-5" />

                Add Lead

              </Button>

            </Link>

          </div>

          {/* SEARCH + VIEW */}

          <div className="flex items-center gap-4 flex-wrap">

            <div className="relative flex-1 max-w-md">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />

            </div>

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

          </div>

          {/* LIST VIEW */}

          {view === 'list' && (

            <div className="space-y-3">

              {filteredLeads.length === 0 ? (

                <Card className="p-12 text-center">

                  <p className="text-muted-foreground">
                    No leads found. Add a new lead to get started.
                  </p>

                </Card>

              ) : (

                filteredLeads.map((lead) => (

                  <Link
                    key={lead.id}
                    href={`/crm/${lead.id}`}
                  >

                    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">

                      <div className="flex justify-between gap-4">

                        <div className="flex-1">

                          <h3 className="font-semibold text-lg">
                            {lead.name}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {lead.company}
                          </p>

                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">

                            {lead.email && (

                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {lead.email}
                              </div>

                            )}

                            {lead.phone && (

                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {lead.phone}
                              </div>

                            )}

                          </div>

                        </div>

                        <div className="text-right">

                          <p className="font-semibold">
                            ₹{lead.dealValue?.toLocaleString() || 0}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </p>

                          <Badge className={statusColors[lead.status]}>
                            {lead.status}
                          </Badge>

                        </div>

                      </div>

                    </Card>

                  </Link>

                ))

              )}

            </div>

          )}

          {/* KANBAN VIEW */}

          {view === 'kanban' && (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">

              {statuses.map((status) => (

                <div key={status} className="space-y-3">

                  <div className="flex items-center justify-between px-2">

                    <h3 className="font-semibold text-sm">
                      {status}
                    </h3>

                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {leadsByStatus[status].length}
                    </span>

                  </div>

                  <div className="space-y-2">

                    {leadsByStatus[status].map((lead) => (

                      <Link
                        key={lead.id}
                        href={`/crm/${lead.id}`}
                      >

                        <Card className="p-3 hover:shadow-md cursor-pointer">

                          <h4 className="font-medium text-sm">
                            {lead.name}
                          </h4>

                          <p className="text-xs text-muted-foreground">
                            {lead.company}
                          </p>

                          <p className="text-sm font-semibold mt-2">
                            ₹{lead.dealValue?.toLocaleString() || 0}
                          </p>

                        </Card>

                      </Link>

                    ))}

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>

  )

}