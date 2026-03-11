'use client'

import { useNotifications } from "@/hooks/use-notifications"
import NotificationItem from "./notification-item"

export default function NotificationPanel() {

  const {
    notifications,
    markAsRead,
    clearNotifications
  } = useNotifications()

  return (

    <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">

      {/* Header */}

      <div className="flex items-center justify-between px-4 py-3 border-b">

        <p className="font-medium text-sm">
          Notifications
        </p>

        <button
          onClick={clearNotifications}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>

      </div>

      {/* List */}

      <div className="max-h-80 overflow-y-auto">

        {notifications.length === 0 && (

          <p className="p-4 text-sm text-muted-foreground text-center">
            No notifications
          </p>

        )}

        {notifications.map((notification) => (

          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => markAsRead(notification.id)}
          />

        ))}

      </div>

    </div>

  )

}