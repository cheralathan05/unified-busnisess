import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  showPercent?: boolean;
}

export function ProgressBar({ value, max = 100, label, className, showPercent = true }: ProgressBarProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercent && <span className="text-foreground font-medium">{pct}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
