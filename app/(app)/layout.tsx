'use client'

import { Suspense } from "react"

import { AppShellNew } from "@/components/layout/app-shell-new"

import { CommandProvider } from "@/components/command/command-provider"
import GlobalSearch from "@/components/search/global-search"
import NotificationBell from "@/components/notifications/notification-bell"

interface Props {
  children: React.ReactNode
}

export default function AppLayout({ children }: Props) {

  return (

    <CommandProvider>

      <AppShellNew>

        <div className="flex flex-col w-full h-full">

          {/* Top Toolbar */}

          <div className="flex items-center justify-between px-6 py-3 border-b bg-background">

            {/* Global Search */}

            <div className="w-full max-w-md">
              <GlobalSearch />
            </div>

            {/* Notifications */}

            <div className="flex items-center gap-4">

              <NotificationBell />

            </div>

          </div>

          {/* Main Content */}

          <div className="flex-1 overflow-y-auto">

            <Suspense
              fallback={
                <div className="p-8 text-center text-muted-foreground">
                  Loading...
                </div>
              }
            >

              {children}

            </Suspense>

          </div>

        </div>

      </AppShellNew>

    </CommandProvider>

  )

}