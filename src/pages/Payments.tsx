import { CreditCard, Brain } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { AIInsightBox } from "@/components/AIInsightBox";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const payments = [
  { id: 1, project: "E-commerce Website", milestone: "Design Approval", amount: "₹25,000", status: "paid" as const, date: "Mar 20" },
  { id: 2, project: "E-commerce Website", milestone: "Frontend Complete", amount: "₹50,000", status: "pending" as const, date: "Apr 1" },
  { id: 3, project: "E-commerce Website", milestone: "Final Delivery", amount: "₹75,000", status: "pending" as const, date: "Apr 5" },
  { id: 4, project: "Portfolio Website", milestone: "Full Payment", amount: "₹50,000", status: "paid" as const, date: "Mar 22" },
  { id: 5, project: "Mobile App MVP", milestone: "Phase 1", amount: "₹1,00,000", status: "pending" as const, date: "Mar 30" },
];

export default function Payments() {
  const totalPaid = "₹75,000";
  const totalPending = "₹2,25,000";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage milestones & invoices</p>
        </div>

        <AIInsightBox
          insight="₹2.25L pending across 3 milestones. Mobile App Phase 1 is overdue — send payment reminder."
          action="Send Reminders"
          variant="warning"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard>
            <p className="text-xs text-muted-foreground">Total Received</p>
            <p className="text-2xl font-bold text-success mt-1">{totalPaid}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-xs text-muted-foreground">Total Pending</p>
            <p className="text-2xl font-bold text-warning mt-1">{totalPending}</p>
          </GlassCard>
        </div>

        <div className="space-y-3">
          {payments.map((p, i) => (
            <GlassCard key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{p.milestone}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{p.project}</span>
                    <span>·</span>
                    <span>{p.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-foreground">{p.amount}</span>
                  {p.status === "pending" && (
                    <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90 text-xs">
                      Request Payment
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
