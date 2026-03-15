'use client'

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface Metrics {
  totalLeads: number
  totalDeals: number
  revenue: number
  pipelineValue: number
  wonDeals: number
  hotLeads: number
}

export default function DashboardMetrics() {

  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  async function fetchMetrics() {

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      )

      const data = await res.json()

      setMetrics(data.data)

    } catch (err) {

      console.error("Dashboard metrics error", err)

    } finally {

      setLoading(false)

    }

  }

  if (loading) {

    return <p className="text-sm text-muted-foreground">Loading metrics...</p>

  }

  if (!metrics) return null

  return (

    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Total Leads</p>
        <p className="text-2xl font-bold">{metrics.totalLeads}</p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Total Deals</p>
        <p className="text-2xl font-bold">{metrics.totalDeals}</p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Revenue</p>
        <p className="text-2xl font-bold">
          ₹{metrics.revenue.toLocaleString()}
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Pipeline Value</p>
        <p className="text-2xl font-bold">
          ₹{metrics.pipelineValue.toLocaleString()}
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Won Deals</p>
        <p className="text-2xl font-bold">{metrics.wonDeals}</p>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Hot Leads</p>
        <p className="text-2xl font-bold">{metrics.hotLeads}</p>
      </Card>

    </div>

  )
}