'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
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
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${kpi.positive ? 'text-green-500' : 'text-orange-500'}`}>
                  {kpi.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Health - takes 2 columns on desktop */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Business Health</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Revenue Growth</p>
                <span className="text-sm font-bold text-green-500">+12%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Lead Conversion</p>
                <span className="text-sm font-bold text-blue-500">28%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Team Efficiency</p>
                <span className="text-sm font-bold text-purple-500">85%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-5/6 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <h2 className="text-lg font-bold text-foreground mb-4">AI Insights</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Your revenue is trending up. Continue focusing on high-value leads to maintain momentum.</p>
            <p>3 leads have been inactive for over a week. Consider scheduling follow-up calls.</p>
            <p>Payment collection rate is excellent at 94%. No action needed.</p>
          </div>
          <Button className="w-full mt-6 bg-primary hover:bg-primary/90" size="sm">
            Get More Insights
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
