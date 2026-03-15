'use client'

import { Button } from "@/components/ui/button"
import { Trash2, Download } from "lucide-react"

import { deleteLead } from "@/lib/services/lead.service"

interface Lead {

  id: string
  name: string
  email?: string
  phone?: string
  company?: string

}

interface Props {

  selectedLeads: Lead[]
  refreshLeads: () => void

}

export default function BulkActions({

  selectedLeads,
  refreshLeads

}: Props) {

  if (selectedLeads.length === 0) return null

  async function handleDelete() {

    const confirmDelete = confirm(
      `Delete ${selectedLeads.length} leads?`
    )

    if (!confirmDelete) return

    try {

      await Promise.all(
        selectedLeads.map((lead) =>
          deleteLead(lead.id)
        )
      )

      refreshLeads()

    } catch (err) {

      console.error("Bulk delete failed", err)

    }

  }

  function exportCSV(){

    const rows = selectedLeads.map((lead)=>({

      name:lead.name,
      email:lead.email ?? "",
      phone:lead.phone ?? "",
      company:lead.company ?? ""

    }))

    const header = "Name,Email,Phone,Company\n"

    const body = rows
      .map(r =>
        `${r.name},${r.email},${r.phone},${r.company}`
      )
      .join("\n")

    const csv = header + body

    const blob = new Blob([csv],{type:"text/csv"})

    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")

    a.href = url
    a.download = "leads-export.csv"
    a.click()

    URL.revokeObjectURL(url)

  }

  return (

    <div className="flex gap-3 items-center p-3 bg-muted rounded">

      <span className="text-sm font-medium">

        {selectedLeads.length} selected

      </span>

      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
      >

        <Trash2 className="w-4 h-4 mr-1"/>

        Delete

      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={exportCSV}
      >

        <Download className="w-4 h-4 mr-1"/>

        Export CSV

      </Button>

    </div>

  )

}