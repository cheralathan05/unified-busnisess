"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Link2, Send } from "lucide-react"

interface PaymentLinkGeneratorProps {
  invoiceId?: string
}

export default function PaymentLinkGenerator({ invoiceId }: PaymentLinkGeneratorProps) {
  const [link, setLink] = useState("")

  const generateLink = () => {
    const generated = `${window.location.origin}/pay/${invoiceId || "INV-000"}`
    setLink(generated)
  }

  const copyLink = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
  }

  const sendEmail = () => {
    if (!link) return
    window.location.href = `mailto:?subject=Payment Link&body=Please complete payment using this link: ${link}`
  }

  return (
    <Card className="border-border">

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Payment Link
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* LINK INPUT */}

        <Input
          placeholder="Generate payment link"
          value={link}
          readOnly
        />

        {/* BUTTONS */}

        <div className="flex gap-2">

          <Button onClick={generateLink}>
            Generate Link
          </Button>

          <Button
            variant="outline"
            onClick={copyLink}
            disabled={!link}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>

          <Button
            variant="outline"
            onClick={sendEmail}
            disabled={!link}
          >
            <Send className="w-4 h-4 mr-2" />
            Email
          </Button>

        </div>

      </CardContent>

    </Card>
  )
}
