"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, BellRing, RefreshCcw } from "lucide-react"

interface AlertItem {
  id: number
  type: "warning" | "success" | "refund" | "reminder"
  message: string
  time: string
}

const alerts: AlertItem[] = [
  {
    id: 1,
    type: "warning",
    message: "Invoice INV-105 is overdue",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "success",
    message: "Payment of ₹12,000 received from Ravi Kumar",
    time: "Today",
  },
  {
    id: 3,
    type: "refund",
    message: "Refund of ₹2,000 processed",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "reminder",
    message: "Reminder scheduled for INV-110",
    time: "2 days ago",
  },
]

function getIcon(type: AlertItem["type"]) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case "refund":
      return <RefreshCcw className="w-4 h-4 text-red-500" />
    case "reminder":
      return <BellRing className="w-4 h-4 text-blue-500" />
  }
}

export default function PaymentAlerts() {
  return (
    <Card className="mt-6 border-border">

      <CardHeader>
        <CardTitle className="text-base">
          Payment Alerts
        </CardTitle>
      </CardHeader>

      <CardContent>

        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No alerts
          </p>
        ) : (

          <div className="space-y-4">

            {alerts.map((alert) => (

              <div
                key={alert.id}
                className="flex items-start gap-3 border-b border-border pb-3 last:border-none"
              >

                <div className="mt-1">
                  {getIcon(alert.type)}
                </div>

                <div className="flex-1">

                  <p className="text-sm text-foreground">
                    {alert.message}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.time}
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
