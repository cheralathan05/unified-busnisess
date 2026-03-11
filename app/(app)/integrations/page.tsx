'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Mail, CreditCard, Database, Plus, Settings, Unlink } from 'lucide-react'

const integrations = [
  {
    id: 1,
    name: 'WhatsApp',
    description: 'Send messages and receive replies',
    icon: MessageSquare,
    status: 'Connected',
    connectedDate: 'Jan 15, 2024',
  },
  {
    id: 2,
    name: 'Gmail',
    description: 'Sync emails and contacts',
    icon: Mail,
    status: 'Connected',
    connectedDate: 'Feb 10, 2024',
  },
  {
    id: 3,
    name: 'Stripe',
    description: 'Process payments and invoices',
    icon: CreditCard,
    status: 'Connected',
    connectedDate: 'Mar 20, 2024',
  },
  {
    id: 4,
    name: 'Google Sheets',
    description: 'Sync data to spreadsheets',
    icon: Database,
    status: 'Not Connected',
    connectedDate: null,
  },
]

export default function IntegrationsPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
            <p className="text-muted-foreground mt-1">Connect your favorite tools and services to Digital Business Brain</p>
          </div>

      {/* Connected Services */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Connected Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const Icon = integration.icon
            const isConnected = integration.status === 'Connected'

            return (
              <Card key={integration.id} className="p-6 hover:shadow-lg transition-all border-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className={isConnected ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-muted/50 text-muted-foreground border border-border/50'}>
                    {integration.status}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1">{integration.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>

                {isConnected && integration.connectedDate && (
                  <p className="text-xs text-muted-foreground mb-4">Connected on {integration.connectedDate}</p>
                )}

                <div className="flex gap-2">
                  {isConnected ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2">
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
                      <Plus className="w-4 h-4" />
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">More Integrations Coming Soon</h2>
        <Card className="p-12 text-center border-border/50">
          <p className="text-muted-foreground">We're constantly adding new integrations. Check back soon for more options.</p>
        </Card>
      </div>
        </div>
      </div>
    </div>
  )
}
