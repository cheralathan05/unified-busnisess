'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import { KPICardNew } from '@/components/dashboard/kpi-card-new';
import { RevenueChartEnhanced } from '@/components/dashboard/revenue-chart-enhanced';
import { SalesFunnelChart } from '@/components/dashboard/sales-funnel-chart';
import { CustomerGrowthChart } from '@/components/dashboard/customer-growth-chart';
import { TaskCompletionChart } from '@/components/dashboard/task-completion-chart';
import { PaymentStatusChart } from '@/components/dashboard/payment-status-chart';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { BusinessHealthDashboard } from '@/components/analytics/business-health';
import { TeamPerformanceChart } from '@/components/dashboard/team-performance-chart';
import { ForecastWidget } from '@/components/dashboard/forecast-widget';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { leads, payments, tasks, getTotalRevenue } = useAppState();

  const totalRevenue = getTotalRevenue();
  const activeLeads = leads.filter(l => l.status !== 'won').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const kpis = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      change: '+12%',
      positive: true,
      icon: TrendingUp,
    },
    {
      label: 'Active Leads',
      value: activeLeads.toString(),
      change: `+${Math.floor(activeLeads / 2)} new`,
      positive: true,
      icon: Users,
    },
    {
      label: 'Completed Tasks',
      value: completedTasks.toString(),
      change: `${completedTasks > 0 ? '+' : ''}${completedTasks}`,
      positive: completedTasks > 0,
      icon: Calendar,
    },
    {
      label: 'Pending Payments',
      value: `₹${payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`,
      change: `${pendingPayments} invoices`,
      positive: false,
      icon: CreditCard,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="min-h-0">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <KPICardNew
                  key={idx}
                  label={kpi.label}
                  value={kpi.value}
                  icon={<Icon className="w-5 h-5" />}
                  trend={{
                    value: parseInt(kpi.change.replace(/[^0-9]/g, '')),
                    label: 'from last month',
                  }}
                  changeType={kpi.positive ? 'positive' : 'negative'}
                />
              );
            })}
          </div>

      {/* Quick Actions */}
      <QuickActionsWidget />

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChartEnhanced />
        <SalesFunnelChart />
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerGrowthChart />
        <TaskCompletionChart />
      </div>

      {/* Payment Status */}
      <PaymentStatusChart />

      {/* Team Performance & Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPerformanceChart />
        <ForecastWidget />
      </div>

      {/* Business Health & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Health - takes 2 columns on desktop */}
        <div className="lg:col-span-2">
          <BusinessHealthDashboard />
        </div>

        {/* AI Insights */}
        <Card className="p-6 gradient-primary border-0">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Assistant
          </h2>
          <div className="space-y-3 text-sm text-white/90">
            <p>✓ Your revenue is trending up. Continue focusing on high-value leads to maintain momentum.</p>
            <p>⚠ 3 leads have been inactive for over a week. Consider scheduling follow-up calls.</p>
            <p>✓ Payment collection rate is excellent. Keep up the momentum!</p>
          </div>
          <Button className="w-full mt-6 bg-white text-primary hover:bg-white/90" size="sm">
            View All Insights
          </Button>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { type: 'lead', message: 'New lead from Ravi Kumar', time: '2 minutes ago' },
            { type: 'payment', message: 'Payment received: ₹50,000', time: '15 minutes ago' },
            { type: 'task', message: 'Task completed: Follow-up call', time: '1 hour ago' },
            { type: 'message', message: 'New message from Priya Sharma', time: '3 hours ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            </div>
          ))}
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}
