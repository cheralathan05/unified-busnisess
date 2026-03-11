'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import {
  Plus,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Edit2,
} from 'lucide-react'

const automations = [
  {
    id: 1,
    name: 'Payment Confirmation',
    trigger: 'Payment received',
    action: 'Send confirmation message',
    active: true,
    runsThisWeek: 8,
  },
  {
    id: 2,
    name: 'Lead Follow-up',
    trigger: 'New lead created',
    action: 'Create follow-up task after 2 days',
    active: true,
    runsThisWeek: 5,
  },
  {
    id: 3,
    name: 'Overdue Invoice Alert',
    trigger: 'Invoice unpaid after 7 days',
    action: 'Send reminder message',
    active: true,
    runsThisWeek: 2,
  },
  {
    id: 4,
    name: 'Auto-Tag High-Value',
    trigger: 'Deal value > ₹2,00,000',
    action: 'Add premium tag',
    active: false,
    runsThisWeek: 0,
  },
]

export default function AutomationsPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground">Automations</h1>
              <p className="text-muted-foreground mt-1">Automate repetitive tasks and workflows</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2 flex-shrink-0 ml-4">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Automation</span>
            </Button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Active Automations</p>
          <p className="text-3xl font-bold text-foreground mt-2">{automations.filter(a => a.active).length}</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Runs This Week</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{automations.reduce((sum, a) => sum + a.runsThisWeek, 0)}</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Total Automations</p>
          <p className="text-3xl font-bold text-primary mt-2">{automations.length}</p>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-3">
        {automations.map((automation) => (
          <Card key={automation.id} className="p-4 hover:shadow-lg transition-all border-border/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{automation.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{automation.trigger}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{automation.action}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-sm font-semibold text-foreground">{automation.runsThisWeek} runs</p>
                </div>
                <Toggle
                  pressed={automation.active}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
        </div>
      </div>
    </div>
  )
}
