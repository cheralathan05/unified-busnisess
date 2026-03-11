'use client'

import { useState } from "react"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import NotificationPanel from "./notification-panel"

import { useNotifications } from "@/hooks/use-notifications"

export default function NotificationBell() {

  const [open, setOpen] = useState(false)

  const { notifications } = useNotifications()

  const unreadCount = notifications.filter(n => !n.read).length

  return (

    <div className="relative">

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
      >

        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (

          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] bg-red-500 text-white flex items-center justify-center">

            {unreadCount}

          </span>

        )}

      </Button>

      {open && <NotificationPanel />}

    </div>

  )

}