import { Brain, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightBoxProps {
  insight: string;
  action?: string;
  onAction?: () => void;
  variant?: "default" | "warning" | "success";
  className?: string;
}

export function AIInsightBox({ insight, action, onAction, variant = "default", className }: AIInsightBoxProps) {
  const variants = {
    default: "border-primary/20 bg-primary/5",
    warning: "border-warning/20 bg-warning/5",
    success: "border-success/20 bg-success/5",
  };
  const iconColors = {
    default: "text-primary",
    warning: "text-warning",
    success: "text-success",
  };

  return (
    <div className={cn("rounded-xl border p-4 flex items-start gap-3 transition-all duration-300 hover:scale-[1.01]", variants[variant], className)}>
      <div className={cn("p-2 rounded-lg bg-background/50 shrink-0", iconColors[variant])}>
        <Brain className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">AI Insight</p>
        <p className="text-sm text-foreground">{insight}</p>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {action} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
