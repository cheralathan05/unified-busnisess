"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react"

interface PaymentExportProps {
  payments?: any[]
}

export default function PaymentExport({ payments = [] }: PaymentExportProps) {

  const exportCSV = () => {
    if (!payments.length) return

    const headers = Object.keys(payments[0]).join(",")
    const rows = payments
      .map((p) => Object.values(p).join(","))
      .join("\n")

    const csvContent = `${headers}\n${rows}`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "payments.csv")
    document.body.appendChild(link)

    link.click()
    document.body.removeChild(link)
  }

  const exportExcel = () => {
    if (!payments.length) return

    const headers = Object.keys(payments[0]).join("\t")
    const rows = payments
      .map((p) => Object.values(p).join("\t"))
      .join("\n")

    const excelContent = `${headers}\n${rows}`

    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel",
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "payments.xls")
    document.body.appendChild(link)

    link.click()
    document.body.removeChild(link)
  }

  const printReport = () => {
    window.print()
  }

  return (
    <DropdownMenu>

      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">

        <DropdownMenuItem onClick={exportCSV}>
          <FileText className="w-4 h-4 mr-2" />
          Export CSV
        </DropdownMenuItem>

        <DropdownMenuItem onClick={exportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </DropdownMenuItem>

        <DropdownMenuItem onClick={printReport}>
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>
  )
}
