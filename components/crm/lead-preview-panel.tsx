'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { getLeadById, deleteLead } from "@/lib/services/lead.service"
import { getLeadActivities } from "@/lib/services/activity.service"

import { formatCurrency } from "@/lib/utils/currency"
import { formatDate } from "@/lib/utils/date"

interface Props {
  leadId: string
  onClose: () => void
}

interface Activity {
  id: string
  description: string
  createdAt: string
}

export default function LeadPreviewPanel({ leadId, onClose }: Props) {

  const router = useRouter()

  const [lead, setLead] = useState<any>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLead()
  }, [leadId])

  async function loadLead() {

    try {

      const res = await getLeadById(leadId)

      setLead(res.data)

      const act = await getLeadActivities(leadId)

      setActivities(act.data || [])

    } catch (err) {

      console.error("Lead preview load error", err)

    } finally {

      setLoading(false)

    }

  }

  async function handleDelete() {

    const confirmDelete = confirm("Delete this lead?")

    if (!confirmDelete) return

    try {

      await deleteLead(leadId)

      router.refresh()
      onClose()

    } catch (err) {

      console.error("Delete failed", err)

    }

  }

  if (loading) {

    return (
      <div className="w-[420px] border-l p-6">
        Loading...
      </div>
    )

  }

  if (!lead) return null

  return (

    <div className="w-[420px] border-l bg-background p-6 space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          {lead.name}
        </h2>

        <Button
          variant="ghost"
          onClick={onClose}
        >
          Close
        </Button>

      </div>

      {/* COMPANY + CONTACT */}

      <div className="space-y-2">

        {lead.company && (

          <p className="text-sm text-muted-foreground">
            {lead.company}
          </p>

        )}

        {lead.email && (
          <p>📧 {lead.email}</p>
        )}

        {lead.phone && (
          <p>📞 {lead.phone}</p>
        )}

      </div>

      {/* DEAL VALUE */}

      <div className="space-y-2">

        <p className="font-medium">
          Deal Value
        </p>

        <p>
          {formatCurrency(lead.value || 0)}
        </p>

      </div>

      {/* STATUS */}

      <div className="space-y-2">

        <p className="font-medium">
          Status
        </p>

        <p className="text-sm">
          {lead.status}
        </p>

      </div>

      {/* ACTIVITY */}

      <div>

        <p className="font-medium mb-2">
          Activity
        </p>

        {activities.length === 0 && (

          <p className="text-sm text-muted-foreground">
            No activity yet
          </p>

        )}

        <ul className="text-sm space-y-2">

          {activities.slice(0, 5).map((a) => (

            <li key={a.id}>

              {a.description}

              <span className="block text-xs text-muted-foreground">

                {formatDate(a.createdAt)}

              </span>

            </li>

          ))}

        </ul>

      </div>

      {/* ACTION BUTTONS */}

      <div className="flex gap-2 pt-4">

        <Button
          variant="outline"
          onClick={() => router.push(`/crm/${lead.id}`)}
        >
          Open
        </Button>

        <Button
          onClick={() => router.push(`/crm/${lead.id}/edit`)}
        >
          Edit
        </Button>

        <Button
          variant="destructive"
          onClick={handleDelete}
        >
          Delete
        </Button>

      </div>

    </div>

  )

}