'use client'

import { useState, useMemo } from 'react'

import { Input } from '@/components/ui/input'

import PaymentStats from '@/components/payments/payment-stats'
import { PaymentChart } from '@/components/payments/payment-chart'
import PaymentMethodChart from '@/components/payments/payment-method-chart'
import PaymentStatusChart from '@/components/payments/payment-status-chart'

import { PaymentList } from '@/components/payments/payment-list'
import PaymentFilters from '@/components/payments/payment-filters'
import PaymentActivity from '@/components/payments/payment-activity'
import RecordPaymentModal from '@/components/payments/record-payment-modal'

import { useAppState } from '@/hooks/use-app-state'

import { Search } from 'lucide-react'

export default function PaymentsPage() {

  const { payments, getTotalRevenue } = useAppState()

  const [searchTerm, setSearchTerm] = useState('')

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    method: '',
  })

  /* ---------------- STATS ---------------- */

  const totalRevenue = getTotalRevenue()

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  const refundedAmount = payments
    .filter((p) => p.status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0)

  const completedCount = payments.filter(
    (p) => p.status === 'completed'
  ).length

  const pendingCount = payments.filter(
    (p) => p.status === 'pending'
  ).length

  const failedCount = payments.filter(
    (p) => p.status === 'failed'
  ).length

  const refundCount = payments.filter(
    (p) => p.status === 'refunded'
  ).length

  /* ---------------- FILTERS ---------------- */

  const filteredPayments = useMemo(() => {

    return payments.filter((payment) => {

      const matchesSearch =
        !searchTerm ||
        payment.customerId
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesStatus =
        !filters.status ||
        payment.status === filters.status

      const matchesMethod =
        !filters.method ||
        payment.method === filters.method

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      )
    })

  }, [payments, searchTerm, filters])

  /* ---------------- FORMAT FOR TABLE ---------------- */

  const paymentListData = filteredPayments.map((p) => ({
    id: p.id,
    customer: p.customerId,
    amount: p.amount,
    status:
      p.status === 'completed'
        ? 'Paid'
        : p.status === 'pending'
        ? 'Pending'
        : 'Overdue',
    date: new Date(p.date).toLocaleDateString(),
    invoice: p.invoiceId || 'INV-000',
    method: p.method || 'UPI',
  }))

  /* ---------------- ACTION HANDLERS ---------------- */

  const handleDelete = (id: number) => {
    console.log('Delete payment', id)
  }

  const handleMarkPaid = (id: number) => {
    console.log('Mark payment paid', id)
  }

  return (

    <div className="w-full h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">

        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

          {/* HEADER */}

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">
                Payments & Billing
              </h1>

              <p className="text-muted-foreground mt-1">
                Track revenue, invoices and transactions
              </p>

            </div>

            <RecordPaymentModal />

          </div>

          {/* STATS */}

          <PaymentStats
            totalRevenue={totalRevenue}
            pendingAmount={pendingAmount}
            failedCount={failedCount}
            refundedAmount={refundedAmount}
            completedCount={completedCount}
            pendingCount={pendingCount}
            refundCount={refundCount}
          />

          {/* ANALYTICS */}

          <div className="grid gap-6 md:grid-cols-2">

            <PaymentChart />

            <PaymentMethodChart />

          </div>

          <PaymentStatusChart />

          {/* SEARCH + FILTERS */}

          <div className="flex flex-col md:flex-row md:items-center gap-4">

            <div className="relative max-w-md w-full">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search by customer..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10"
              />

            </div>

            <PaymentFilters
              onFilterChange={(data) =>
                setFilters(data)
              }
            />

          </div>

          {/* PAYMENTS TABLE */}

          <PaymentList
            payments={paymentListData}
            onDelete={handleDelete}
            onMarkPaid={handleMarkPaid}
          />

          {/* ACTIVITY */}

          <PaymentActivity />

        </div>

      </div>

    </div>
  )
}
