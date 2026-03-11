'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Search,
  Plus,
  HelpCircle,
  User,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

export function TopNavbar({
  onOpenAI,
  sidebarOpen,
  onSidebarToggle,
}: {
  onOpenAI: () => void
  sidebarOpen: boolean
  onSidebarToggle: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="hidden sm:flex lg:hidden text-foreground/70 hover:text-foreground hover:bg-muted/50"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="⌘K Search leads, payments, tasks..."
            className="pl-10 h-10 bg-muted/50 border border-border/50 focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-sm"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-lg p-2 z-50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground px-2 py-1">
                Quick search coming soon...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="gap-2 hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>New Lead</DropdownMenuItem>
            <DropdownMenuItem>New Task</DropdownMenuItem>
            <DropdownMenuItem>New Message</DropdownMenuItem>
            <DropdownMenuItem>New Automation</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Assistant */}
        <Button
          size="icon"
          onClick={onOpenAI}
          className="bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors"
          title="Open AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="icon" 
              className="bg-muted/50 hover:bg-muted/70 text-foreground rounded-lg relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl mt-2">
            <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <div className="px-3 py-3 text-sm hover:bg-muted/50 rounded-lg cursor-pointer transition-colors m-1">
                <p className="font-medium text-foreground">New lead from Ravi Kumar</p>
                <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
              </div>
              <div className="px-3 py-3 text-sm hover:bg-muted/50 rounded-lg cursor-pointer transition-colors m-1">
                <p className="font-medium text-foreground">Payment received: ₹50,000</p>
                <p className="text-xs text-muted-foreground mt-1">15 minutes ago</p>
              </div>
              <div className="px-3 py-3 text-sm hover:bg-muted/50 rounded-lg cursor-pointer transition-colors m-1">
                <p className="font-medium text-foreground">Task overdue: Follow-up call</p>
                <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View All Notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button
          size="icon"
          className="hidden md:flex bg-muted/50 hover:bg-muted/70 text-foreground rounded-lg transition-colors"
          title="Help Center"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon"
                className="bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 text-foreground rounded-lg transition-colors border border-primary/30"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl mt-2">
              <DropdownMenuLabel>
                <div className="py-2">
                  <p className="font-semibold text-base">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 rounded-lg" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
