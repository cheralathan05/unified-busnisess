'use client'

import { useParams, useRouter } from "next/navigation"
import { useAppState } from "@/hooks/use-app-state"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  DollarSign,
  Calendar
} from "lucide-react"


const statusColors: Record<string,string> = {
  New:"bg-blue-500/10 text-blue-400 border border-blue-500/30",
  Contacted:"bg-purple-500/10 text-purple-400 border border-purple-500/30",
  Proposal:"bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  Negotiation:"bg-orange-500/10 text-orange-400 border border-orange-500/30",
  Won:"bg-green-500/10 text-green-400 border border-green-500/30",
  Lost:"bg-red-500/10 text-red-400 border border-red-500/30"
}


export default function LeadProfilePage(){

  const params = useParams()
  const router = useRouter()

  const { leads, deleteLead } = useAppState()

  const leadId = params?.leadId as string

  const lead = leads.find(l => l.id === leadId)


  if(!lead){

    return (

      <div className="p-8 text-center">

        <h2 className="text-xl font-semibold">
          Lead not found
        </h2>

        <p className="text-muted-foreground mt-2">
          The lead you are looking for does not exist.
        </p>

        <Button
          className="mt-4"
          onClick={()=>router.push("/crm")}
        >
          Back to CRM
        </Button>

      </div>

    )

  }


  function handleDelete(){

    const confirmDelete = confirm("Delete this lead?")

    if(!confirmDelete) return

    deleteLead(lead.id)

    router.push("/crm")

  }


  return (

    <div className="w-full h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">

        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* Back Button */}

          <Button
            variant="outline"
            onClick={()=>router.push("/crm")}
          >

            <ArrowLeft className="w-4 h-4 mr-2"/>

            Back to CRM

          </Button>


          {/* Header */}

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">
                {lead.name}
              </h1>

              <p className="text-muted-foreground">
                {lead.company}
              </p>

            </div>

            <Badge className={statusColors[lead.status]}>
              {lead.status}
            </Badge>

          </div>


          {/* Lead Info */}

          <Card className="p-6 space-y-4">

            <h2 className="text-lg font-semibold">
              Lead Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-center gap-2 text-sm">

                <Mail className="w-4 h-4 text-muted-foreground"/>

                {lead.email}

              </div>


              <div className="flex items-center gap-2 text-sm">

                <Phone className="w-4 h-4 text-muted-foreground"/>

                {lead.phone}

              </div>


              <div className="flex items-center gap-2 text-sm">

                <Building className="w-4 h-4 text-muted-foreground"/>

                {lead.company}

              </div>


              <div className="flex items-center gap-2 text-sm font-semibold">

                <DollarSign className="w-4 h-4"/>

                ₹{lead.dealValue.toLocaleString()}

              </div>


              <div className="flex items-center gap-2 text-sm">

                <Calendar className="w-4 h-4 text-muted-foreground"/>

                Created: {new Date(lead.createdAt).toLocaleDateString()}

              </div>

            </div>

          </Card>


          {/* Notes */}

          <Card className="p-6">

            <h2 className="text-lg font-semibold mb-2">
              Notes
            </h2>

            <p className="text-sm text-muted-foreground">

              {lead.notes || "No notes available"}

            </p>

          </Card>


          {/* Actions */}

          <div className="flex gap-3">

            <Button
              onClick={()=>router.push(`/crm/${lead.id}/edit`)}
            >
              Edit Lead
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Lead
            </Button>

          </div>

        </div>

      </div>

    </div>

  )

}