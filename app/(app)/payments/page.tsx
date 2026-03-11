'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';
import { Plus, Search, DollarSign, Calendar } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  completed: 'bg-green-500/10 text-green-400 border border-green-500/30',
  failed: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

export default function PaymentsPage() {
  const { payments, getTotalRevenue } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');

  const totalRevenue = getTotalRevenue();
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(payment =>
    payment.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground">Payments & Billing</h1>
              <p className="text-muted-foreground mt-1">Track and manage all transactions</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2 flex-shrink-0 ml-4">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Record Payment</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground mt-2">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-3">{payments.filter(p => p.status === 'completed').length} completed</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Pending Payments</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">₹{pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-3">{payments.filter(p => p.status === 'pending').length} pending</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow border-red-500/20 bg-red-500/5">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Failed Payments</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{payments.filter(p => p.status === 'failed').length}</p>
          <p className="text-xs text-muted-foreground mt-3">Needs attention</p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50 rounded-lg"
        />
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No payments found. Record your first payment to get started.</p>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card
              key={payment.id}
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-border/50"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{payment.customerId}</h3>
                      <p className="text-sm text-muted-foreground">{payment.method}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground">₹{payment.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(payment.date).toLocaleDateString()}</p>
                </div>

                <Badge className={statusColors[payment.status]}>
                  {payment.status}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
