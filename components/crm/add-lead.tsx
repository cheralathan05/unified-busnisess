'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/hooks/use-app-state"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { ArrowLeft } from "lucide-react"

export default function AddLead() {

  const router = useRouter()

  const { addLead } = useAppState()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    dealValue: "",
    notes: ""
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    addLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      dealValue: Number(formData.dealValue),
      status: "New",
      notes: formData.notes
    })

    router.push("/crm")
  }

  return (

    <div className="w-full h-full flex justify-center p-6">

      <Card className="w-full max-w-xl p-6 space-y-6">

        <div className="flex items-center gap-3">

          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/crm")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <h1 className="text-2xl font-bold">
            Add New Lead
          </h1>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label>Lead Name *</Label>
            <Input
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              name="phone"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Company</Label>
            <Input
              name="company"
              placeholder="Company Name"
              value={formData.company}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Deal Value (₹)</Label>
            <Input
              name="dealValue"
              type="number"
              placeholder="50000"
              value={formData.dealValue}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              name="notes"
              placeholder="Additional details about this lead..."
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full">
            Save Lead
          </Button>

        </form>

      </Card>

    </div>
  )
}