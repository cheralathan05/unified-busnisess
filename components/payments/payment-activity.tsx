"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CreditCard,
  FileText,
  RefreshCcw,
  Bell
} from "lucide-react"

interface Activity {
  id: number
  type: "payment" | "invoice" | "refund" | "reminder"
  message: string
  time: string
}

const activities: Activity[] = [
  {
    id: 1,
    type: "payment",
    message: "Payment received ₹5,000 from Ravi Kumar",
    time: "2 hours ago"
  },
  {
    id: 2,
    type: "invoice",
    message: "Invoice INV-102 sent to Priya Sharma",
    time: "Yesterday"
  },
  {
    id: 3,
    type: "refund",
    message: "Refund issued ₹1,000",
    time: "2 days ago"
  }
]

function getIcon(type: Activity["type"]) {
  switch (type) {
    case "payment":
      return <CreditCard className="w-4 h-4 text-green-500" />
    case "invoice":
      return <FileText className="w-4 h-4 text-blue-500" />
    case "refund":
      return <RefreshCcw className="w-4 h-4 text-red-500" />
    case "reminder":
      return <Bell className="w-4 h-4 text-yellow-500" />
  }
}

export default function PaymentActivity() {
  return (
    <Card className="mt-6 border-border">

      <CardHeader>
        <CardTitle className="text-base">
          Payment Activity
        </CardTitle>
      </CardHeader>

      <CardContent>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No activity yet
          </p>
        ) : (

          <div className="space-y-4">

            {activities.map((activity) => (

              <div
                key={activity.id}
                className="flex items-start gap-3 border-b border-border pb-3 last:border-none"
              >

                <div className="mt-1">
                  {getIcon(activity.type)}
                </div>

                <div className="flex-1">

                  <p className="text-sm text-foreground">
                    {activity.message}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </CardContent>

    </Card>
  )
}
