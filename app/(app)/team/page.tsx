'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreVertical, Trash2, Shield } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const team = [
  {
    id: 1,
    name: 'Amit Patel',
    email: 'amit@business.com',
    role: 'Owner',
    status: 'Active',
    avatar: 'AP',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@business.com',
    role: 'Sales Manager',
    status: 'Active',
    avatar: 'PS',
  },
  {
    id: 3,
    name: 'Rajesh Kumar',
    email: 'rajesh@business.com',
    role: 'Sales Executive',
    status: 'Active',
    avatar: 'RK',
  },
  {
    id: 4,
    name: 'Neha Singh',
    email: 'neha@business.com',
    role: 'Marketing Lead',
    status: 'Active',
    avatar: 'NS',
  },
]

const roleColors: Record<string, string> = {
  Owner: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  'Sales Manager': 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  'Sales Executive': 'bg-green-500/10 text-green-400 border border-green-500/30',
  'Marketing Lead': 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
}

export default function TeamPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground">Team</h1>
              <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2 flex-shrink-0 ml-4">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Invite Member</span>
            </Button>
          </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Total Members</p>
          <p className="text-3xl font-bold text-foreground mt-2">{team.length}</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Active</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{team.filter(m => m.status === 'Active').length}</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Roles</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{new Set(team.map(m => m.role)).size}</p>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {team.map((member) => (
          <Card key={member.id} className="p-4 hover:shadow-lg transition-all border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge className={roleColors[member.role] || 'bg-gray-500/10'}>
                  {member.role}
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border border-green-500/30">
                  {member.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Shield className="w-4 h-4" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
