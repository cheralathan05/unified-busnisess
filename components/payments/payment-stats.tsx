"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  IndianRupee,
  Clock,
  AlertCircle,
  RefreshCcw
} from "lucide-react"

interface PaymentStatsProps {
  totalRevenue?: number
  pendingAmount?: number
  failedCount?: number
  refundedAmount?: number
  completedCount?: number
  pendingCount?: number
  refundCount?: number
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`

export default function PaymentStats({
  totalRevenue = 0,
  pendingAmount = 0,
  failedCount = 0,
  refundedAmount = 0,
  completedCount = 0,
  pendingCount = 0,
  refundCount = 0,
}: PaymentStatsProps) {

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      subtitle: `${completedCount} completed`,
      icon: <IndianRupee className="w-4 h-4 text-green-500" />,
      border: "border-green-500/30",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(pendingAmount),
      subtitle: `${pendingCount} pending`,
      icon: <Clock className="w-4 h-4 text-yellow-500" />,
      border: "border-yellow-500/30",
    },
    {
      title: "Failed Payments",
      value: failedCount.toString(),
      subtitle: "Needs attention",
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      border: "border-red-500/30",
    },
    {
      title: "Refunded",
      value: formatCurrency(refundedAmount),
      subtitle: `${refundCount} refunds`,
      icon: <RefreshCcw className="w-4 h-4 text-blue-500" />,
      border: "border-blue-500/30",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

      {stats.map((stat, index) => (

        <Card
          key={index}
          className={`border ${stat.border}`}
        >

          <CardContent className="p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-muted-foreground">
                {stat.title}
              </p>

              {stat.icon}

            </div>

            <h2 className="text-2xl font-bold mt-2">
              {stat.value}
            </h2>

            <p className="text-xs text-muted-foreground mt-1">
              {stat.subtitle}
            </p>

          </CardContent>

        </Card>

      ))}

    </div>
  )
}
