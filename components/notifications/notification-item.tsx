'use client'

import { formatDate } from "@/lib/utils/date"

interface Notification {

id: string
title: string
message: string
isRead: boolean
createdAt: string

}

interface Props {

notification: Notification
onClick: () => void

}

export default function NotificationItem({
notification,
onClick
}: Props) {

return (

<div
role="button"
onClick={onClick}
className={`p-3 border-b cursor-pointer hover:bg-muted transition flex gap-2 items-start ${
notification.isRead ? "opacity-70" : "bg-muted/20"
}`}
>

{/* Unread Indicator */}

{!notification.isRead && (
<div className="w-2 h-2 mt-2 rounded-full bg-blue-500"/>
)}

<div className="flex-1">

<p className="text-sm font-medium">
{notification.title}
</p>

<p className="text-xs text-muted-foreground">
{notification.message}
</p>

<p className="text-[10px] text-muted-foreground mt-1">
{formatDate(notification.createdAt)}
</p>

</div>

</div>

)

}