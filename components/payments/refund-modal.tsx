"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

interface RefundModalProps {
  paymentId?: number
  onRefund?: (data: any) => void
}

export default function RefundModal({ paymentId, onRefund }: RefundModalProps) {

  const [refundType, setRefundType] = useState("partial")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [date, setDate] = useState("")

  const handleRefund = () => {

    const refundData = {
      paymentId,
      refundType,
      amount: Number(amount),
      reason,
      date,
    }

    console.log("Refund issued:", refundData)

    onRefund?.(refundData)

    setAmount("")
    setReason("")
    setDate("")
  }

  return (

    <Dialog>

      {/* OPEN BUTTON */}

      <DialogTrigger asChild>

        <Button variant="destructive" size="sm">
          Refund
        </Button>

      </DialogTrigger>

      {/* MODAL */}

      <DialogContent className="max-w-sm">

        <DialogHeader>
          <DialogTitle>Refund Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* REFUND TYPE */}

          <select
            value={refundType}
            onChange={(e) => setRefundType(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 rounded-md"
          >
            <option value="full">Full Refund</option>
            <option value="partial">Partial Refund</option>
          </select>

          {/* AMOUNT */}

          <Input
            type="number"
            placeholder="Refund Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {/* DATE */}

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* REASON */}

          <textarea
            placeholder="Refund reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 rounded-md"
          />

        </div>

        {/* FOOTER */}

        <DialogFooter>

          <Button variant="outline">
            Cancel
          </Button>

          <Button variant="destructive" onClick={handleRefund}>
            Confirm Refund
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  )
}
