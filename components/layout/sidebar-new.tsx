'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  CheckSquare,
  Zap,
  BarChart3,
  FileText,
  Users2,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Messaging', href: '/messages', icon: MessageSquare },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Team', href: '/team', icon: Users2 },
  { name: 'Integrations', href: '/integrations', icon: Plug },
];

const bottomItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-card border-r border-border/50 transition-all duration-300 ease-out',
          open ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          {open && (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-sm font-bold text-primary-foreground">DB</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">Digital Brain</p>
                <p className="text-xs text-muted-foreground truncate">Enterprise</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 flex-shrink-0"
          >
            {open ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size={open ? 'default' : 'icon'}
                    className={cn(
                      'w-full justify-start gap-3 transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    title={!open ? item.name : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {open && <span className="truncate">{item.name}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size={open ? 'default' : 'icon'}
                  className={cn(
                    'w-full justify-start gap-3 transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  title={!open ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {open && <span className="truncate">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Footer Card */}
        {open && (
          <div className="p-4 m-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-sm">
            <p className="text-xs font-semibold text-foreground mb-2">Plan Status</p>
            <p className="text-xs text-muted-foreground mb-3">Premium Plan</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border/50 z-40 lg:hidden transition-transform duration-300 ease-out overflow-y-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="px-3 py-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link key={item.href} href={item.href} onClick={onToggle}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50 space-y-2 mt-4">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} onClick={onToggle}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
