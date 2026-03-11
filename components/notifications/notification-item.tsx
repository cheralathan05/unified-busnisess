'use client'

import { Notification } from "@/hooks/use-notifications"

interface Props {
  notification: Notification
  onClick: () => void
}

export default function NotificationItem({ notification, onClick }: Props) {

  return (

    <div
      onClick={onClick}
      className={`p-3 border-b cursor-pointer hover:bg-muted transition ${
        notification.read ? "opacity-70" : ""
      }`}
    >

      <p className="text-sm font-medium">
        {notification.title}
      </p>

      <p className="text-xs text-muted-foreground">
        {notification.message}
      </p>

      <p className="text-[10px] text-muted-foreground mt-1">
        {notification.createdAt.toLocaleTimeString()}
      </p>

    </div>

  )

}