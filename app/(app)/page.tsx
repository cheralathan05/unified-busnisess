'use client';

import React, { useState } from 'react';
import { Brain, TrendingUp, Users, AlertCircle, Zap, MessageSquare, CheckCircle2, BarChart3 } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const { leads, tasks, payments, getTotalRevenue, getOverdueTasks } = useAppState();
  
  const totalRevenue = getTotalRevenue();
  const overdueTasks = getOverdueTasks();
  const activeLeads = leads.filter(l => l.status !== 'won').length;
  const overduePayments = payments.filter(p => p.status === 'failed').length;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-foreground flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
              Digital Business Brain
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">Your AI-powered business operations assistant</p>
          </div>
        </div>

        {/* AI Command Center */}
        <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Zap className="w-7 h-7 text-accent" />
            AI Command Center
          </h2>
          
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground font-semibold">Business Trend</p>
        <p className="text-2xl font-bold text-foreground mt-2">↑ ₹{totalRevenue.toLocaleString()}</p>
      </div>
      <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground font-semibold">Action Needed</p>
        <p className="text-2xl font-bold text-foreground mt-2">{overdueTasks.length} tasks</p>
      </div>
      <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground font-semibold">Payment Alert</p>
        <p className="text-2xl font-bold text-foreground mt-2">{overduePayments > 0 ? `${overduePayments}` : '✓'}</p>
      </div>
    </div>

      <div className="p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-xl border border-primary/20 backdrop-blur-sm">
        <p className="font-semibold text-foreground mb-3 flex items-center gap-2">AI Summary</p>
        <p className="text-muted-foreground leading-relaxed">
          {totalRevenue > 0 ? `Your revenue has reached ₹${totalRevenue.toLocaleString()}.` : 'No revenue recorded yet.'} You have {activeLeads} active leads and {overdueTasks.length} tasks needing attention. {overduePayments > 0 ? `${overduePayments} payments need follow-up.` : 'All payments are on track.'} I recommend prioritizing high-value leads and scheduling follow-ups for any inactive prospects.
        </p>
      </div>
        </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[
        { label: 'Monthly Revenue', value: `₹${totalRevenue.toLocaleString()}`, trend: '+12%', gradient: 'from-emerald-500/10 to-emerald-500/5' },
        { label: 'Active Leads', value: activeLeads.toString(), trend: `+${activeLeads > 0 ? Math.floor(activeLeads / 2) : 0} new`, gradient: 'from-cyan-500/10 to-cyan-500/5' },
        { label: 'Overdue Tasks', value: overdueTasks.length.toString(), trend: 'Need attention', gradient: 'from-amber-500/10 to-amber-500/5' },
        { label: 'Failed Payments', value: overduePayments.toString(), trend: overduePayments > 0 ? '⚠️ Action needed' : 'All good', gradient: 'from-rose-500/10 to-rose-500/5' },
      ].map((kpi, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${kpi.gradient} rounded-xl p-6 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-semibold">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-3">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{kpi.trend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Next Best Actions - Main */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Next Best Actions
            </h3>
            <div className="space-y-3">
              {[
                { action: 'Follow up with Ravi Kumar about website project', priority: 'high', icon: '📞' },
                { action: 'Send payment reminder to XYZ Client (5 days overdue)', priority: 'high', icon: '💰' },
                { action: 'Schedule demo call with TechStart India', priority: 'medium', icon: '📅' },
                { action: 'Review contract for Innovation Labs deal', priority: 'medium', icon: '📄' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all flex items-start gap-3 group"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{item.action}</p>
                    <p className={`text-xs mt-1 ${item.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {item.priority === 'high' ? '🔴 High Priority' : '🟡 Medium Priority'}
                    </p>
                  </div>
                  <div className="text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              AI Alerts
            </h3>
            <div className="space-y-3">
              {[
                { type: 'warning', text: 'Payment overdue - XYZ Client' },
                { type: 'success', text: 'Deal closed with TechStart' },
                { type: 'info', text: '2 leads inactive for 4 days' },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    alert.type === 'warning'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                      : alert.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <p className="font-medium">{alert.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Features */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">AI-Powered Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Smart Data Entry', desc: 'AI auto-fills forms from simple descriptions', icon: '✍️' },
              { title: 'Conversation Intelligence', desc: 'Sentiment analysis & AI-powered replies', icon: '💬' },
              { title: 'Predictive Analytics', desc: 'Forecast deals, revenue & conversions', icon: '🔮' },
              { title: 'Document Reader', desc: 'Extract key info from invoices & contracts', icon: '📄' },
              { title: 'Natural Language Search', desc: 'Find data using plain English questions', icon: '🔍' },
              { title: 'Autonomous Alerts', desc: 'AI detects patterns & important events', icon: '🚨' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
              >
                <p className="text-3xl mb-2">{feature.icon}</p>
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">{feature.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
