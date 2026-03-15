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

interface RecordPaymentModalProps {
  onSave?: (payment: any) => void
}

export default function RecordPaymentModal({ onSave }: RecordPaymentModalProps) {

  const [customer, setCustomer] = useState("")
  const [invoice, setInvoice] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("UPI")
  const [status, setStatus] = useState("Completed")
  const [transactionId, setTransactionId] = useState("")
  const [notes, setNotes] = useState("")
  const [date, setDate] = useState("")

  const handleSubmit = () => {

    const payment = {
      customer,
      invoice,
      amount: Number(amount),
      method,
      status,
      transactionId,
      notes,
      date,
    }

    onSave?.(payment)

    console.log("Payment Recorded:", payment)

    // reset form
    setCustomer("")
    setInvoice("")
    setAmount("")
    setMethod("UPI")
    setStatus("Completed")
    setTransactionId("")
    setNotes("")
    setDate("")
  }

  return (
    <Dialog>

      {/* TRIGGER BUTTON */}

      <DialogTrigger asChild>

        <Button className="bg-primary hover:bg-primary/90">
          Record Payment
        </Button>

      </DialogTrigger>

      {/* MODAL */}

      <DialogContent className="max-w-md">

        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {/* FORM */}

        <div className="space-y-4">

          <Input
            placeholder="Customer Name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />

          <Input
            placeholder="Invoice ID"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            placeholder="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* METHOD */}

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 rounded-md"
          >
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Wallet">Wallet</option>
          </select>

          {/* STATUS */}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 rounded-md"
          >
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          {/* NOTES */}

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 rounded-md"
          />

        </div>

        {/* FOOTER */}

        <DialogFooter>

          <Button variant="outline">
            Cancel
          </Button>

          <Button onClick={handleSubmit}>
            Save Payment
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}
