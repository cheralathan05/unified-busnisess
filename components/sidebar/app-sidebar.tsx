'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronRight,
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  CheckSquare,
  Zap,
  BarChart3,
  FileText,
  Users2,
  Settings,
  Plug2,
  ChevronLeft,
  Home,
} from 'lucide-react'

const sidebarItems = [
  {
    category: 'MAIN',
    items: [
      { icon: Home, label: 'Dashboard', href: '/', badge: null },
    ],
  },
  {
    category: 'BUSINESS',
    items: [
      { icon: Users, label: 'CRM & Leads', href: '/crm', badge: null },
      { icon: CreditCard, label: 'Payments', href: '/payments', badge: '2' },
      { icon: MessageSquare, label: 'Messaging', href: '/messages', badge: null },
      { icon: CheckSquare, label: 'Tasks', href: '/tasks', badge: '5' },
    ],
  },
  {
    category: 'AUTOMATION',
    items: [
      { icon: Zap, label: 'Automations', href: '/automations', badge: null },
      { icon: BarChart3, label: 'Analytics', href: '/analytics', badge: null },
    ],
  },
  {
    category: 'ORGANIZATION',
    items: [
      { icon: FileText, label: 'Documents', href: '/documents', badge: null },
      { icon: Users2, label: 'Team', href: '/team', badge: null },
      { icon: Plug2, label: 'Integrations', href: '/integrations', badge: null },
    ],
  },
  {
    category: 'SETTINGS',
    items: [
      { icon: Settings, label: 'Settings', href: '/settings', badge: null },
    ],
  },
]

export function AppSidebar({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean
  onToggle: () => void 
}) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-out',
        isOpen ? 'w-72' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
        {isOpen && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-primary-foreground">DB</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground block">Digital Brain</span>
              <span className="text-xs text-muted-foreground">Enterprise</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-5 space-y-6">
          {sidebarItems.map((section) => (
            <div key={section.category}>
              {isOpen && (
                <h3 className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {section.category}
                </h3>
              )}
              <div className="space-y-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        size={isOpen ? 'sm' : 'icon'}
                        className={cn(
                          'w-full justify-start transition-all duration-200 text-sm font-500',
                          isActive
                            ? 'bg-primary/10 text-primary hover:bg-primary/15 border-l-2 border-primary'
                            : 'text-foreground/70 hover:text-foreground hover:bg-muted/30'
                        )}
                        title={!isOpen ? item.label : ''}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left ml-3">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-primary/20 text-primary">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Business Info Card */}
      {isOpen && (
        <div className="p-4 border-t border-border/50">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold text-foreground mb-2">
              Your Business
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Premium Plan</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">68%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
