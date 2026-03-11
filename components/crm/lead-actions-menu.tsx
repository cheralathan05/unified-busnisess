'use client'

import { Lead, useAppState } from "@/hooks/use-app-state"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"

import { useRouter } from "next/navigation"

interface Props {
  lead: Lead
}

export default function LeadActionsMenu({ lead }: Props) {

  const router = useRouter()
  const { deleteLead } = useAppState()

  const handleDelete = () => {

    if (confirm("Delete this lead?")) {
      deleteLead(lead.id)
    }

  }

  return (

    <DropdownMenu>

      <DropdownMenuTrigger asChild>

        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>

      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">

        <DropdownMenuItem
          onClick={() => router.push(`/crm/${lead.id}`)}
        >
          View Lead
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push(`/crm/${lead.id}/edit`)}
        >
          Edit Lead
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.location.href = `mailto:${lead.email}`}
        >
          Send Email
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.location.href = `tel:${lead.phone}`}
        >
          Call
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-500"
          onClick={handleDelete}
        >
          Delete
        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>

  )

}