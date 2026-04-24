import { Users, FolderKanban, CreditCard, AlertTriangle, ArrowRight, TrendingUp, Clock, Brain } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { AIInsightBox } from "@/components/AIInsightBox";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth-store";

const stats = [
  { label: "Active Leads", value: "12", change: "+3 today", icon: Users, color: "text-primary" },
  { label: "Projects", value: "8", change: "2 at risk", icon: FolderKanban, color: "text-accent" },
  { label: "Revenue", value: "₹4.2L", change: "+18% this month", icon: TrendingUp, color: "text-success" },
  { label: "Pending", value: "₹85K", change: "3 invoices", icon: CreditCard, color: "text-warning" },
];

const urgentItems = [
  { title: "E-commerce Project", client: "Rahul Enterprises", status: "at-risk" as const, insight: "Backend delayed by 2 days", action: "Add Developer" },
  { title: "Portfolio Website", client: "Priya Design", status: "active" as const, insight: "Client waiting for approval", action: "Send Proposal" },
  { title: "Mobile App MVP", client: "TechStart Inc", status: "pending" as const, insight: "Payment overdue by 5 days", action: "Send Reminder" },
];

const recentActivity = [
  { text: "New lead: Healthcare App", time: "2 min ago", icon: Users },
  { text: "Design approved: E-commerce", time: "1 hr ago", icon: FolderKanban },
  { text: "Payment received: ₹25,000", time: "3 hrs ago", icon: CreditCard },
  { text: "Task completed: API integration", time: "5 hrs ago", icon: Clock },
];

export default function Dashboard() {
  const session = getAuthSession();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {session?.name ? `Welcome back, ${session.name}` : "Your AI-powered command center"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {session?.companyName ? `Company: ${session.companyName}` : session?.email ?? "Secure authenticated workspace"}
            </p>
          </div>
          <Button className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
            <Brain className="w-4 h-4 mr-2" /> AI Summary
          </Button>
        </div>

        {/* AI Insight */}
        <AIInsightBox
          insight="3 leads need immediate attention. E-commerce project has a backend delay risk. Suggest adding one more developer."
          action="View Details"
          variant="warning"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <GlassCard key={s.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
                </div>
                <div className={`p-2 rounded-lg bg-secondary ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Needs Attention
            </h2>
            {urgentItems.map((item) => (
              <GlassCard key={item.title}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.client}</p>
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <Brain className="w-3 h-3" /> {item.insight}
                    </div>
                  </div>
                  <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90 shrink-0">
                    {item.action} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <GlassCard hover={false} className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-secondary shrink-0">
                    <a.icon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </GlassCard>

            <h2 className="text-lg font-semibold text-foreground">Project Progress</h2>
            <GlassCard hover={false} className="space-y-4">
              <ProgressBar value={75} label="E-commerce Site" />
              <ProgressBar value={45} label="Mobile App MVP" />
              <ProgressBar value={90} label="Portfolio Website" />
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
