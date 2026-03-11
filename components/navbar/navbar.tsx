'use client'

import { Menu, Bell, User, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import NotificationBell from "@/components/notifications/notification-bell"
import GlobalSearch from "@/components/search/global-search"

interface Props {
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: Props) {

  return (

    <header className="flex items-center justify-between h-16 border-b bg-background px-4 md:px-6">

      {/* LEFT SIDE */}

      <div className="flex items-center gap-3">

        {/* Sidebar Toggle */}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* App Title */}

        <h1 className="font-semibold text-lg hidden md:block">
          CRM Dashboard
        </h1>

      </div>

      {/* CENTER SEARCH */}

      <div className="flex-1 flex justify-center px-6">

        <GlobalSearch />

      </div>

      {/* RIGHT SIDE */}

      <div className="flex items-center gap-3">

        {/* Command Palette Hint */}

        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-2 py-1">

          <Command className="w-3 h-3" />

          Ctrl + K

        </div>

        {/* Notifications */}

        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >

          <Bell className="w-5 h-5" />

          {/* Notification Badge */}

          <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white">

            3

          </span>

        </Button>

        {/* User Avatar */}

        <Button
          variant="ghost"
          size="icon"
        >

          <User className="w-5 h-5" />

        </Button>

      </div>

    </header>

  )

}