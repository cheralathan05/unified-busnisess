"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Copy, ExternalLink, Link2, Send } from "lucide-react"

interface PaymentLinkProps {
  invoiceId: string
}

export default function PaymentLink({ invoiceId }: PaymentLinkProps) {

  const [copied, setCopied] = useState(false)

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${invoiceId}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)

    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = () => {
    const subject = "Payment Request"
    const body = `Please complete your payment using this link: ${link}`

    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <Card className="border-border">

      <CardContent className="p-4 space-y-3">

        {/* TITLE */}

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="w-4 h-4" />
          Payment Link
        </div>

        {/* LINK */}

        <div className="text-sm text-muted-foreground break-all">
          {link}
        </div>

        {/* ACTIONS */}

        <div className="flex gap-2">

          <Button
            size="sm"
            variant="outline"
            onClick={copyLink}
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(link, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={sendEmail}
          >
            <Send className="w-4 h-4 mr-1" />
            Email
          </Button>

        </div>

      </CardContent>

    </Card>
  )
}
