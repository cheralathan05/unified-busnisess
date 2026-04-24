import { cn } from "@/lib/utils";

type Status = "hot" | "warm" | "cold" | "active" | "completed" | "at-risk" | "pending" | "paid" | "scheduled" | "todo" | "in-progress" | "done" | "blocked";

const statusConfig: Record<Status, { label: string; classes: string }> = {
  hot: { label: "Hot", classes: "bg-destructive/10 text-destructive border-destructive/20" },
  warm: { label: "Warm", classes: "bg-warning/10 text-warning border-warning/20" },
  cold: { label: "Cold", classes: "bg-info/10 text-info border-info/20" },
  active: { label: "Active", classes: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", classes: "bg-success/10 text-success border-success/20" },
  "at-risk": { label: "At Risk", classes: "bg-destructive/10 text-destructive border-destructive/20" },
  pending: { label: "Pending", classes: "bg-warning/10 text-warning border-warning/20" },
  paid: { label: "Paid", classes: "bg-success/10 text-success border-success/20" },
  scheduled: { label: "Scheduled", classes: "bg-info/10 text-info border-info/20" },
  todo: { label: "Todo", classes: "bg-muted text-muted-foreground border-border" },
  "in-progress": { label: "In Progress", classes: "bg-primary/10 text-primary border-primary/20" },
  done: { label: "Done", classes: "bg-success/10 text-success border-success/20" },
  blocked: { label: "Blocked", classes: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.classes, className)}>
      {config.label}
    </span>
  );
}
