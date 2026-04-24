import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ className, hover = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-card/60 backdrop-blur-xl p-5 transition-all duration-300",
        hover && "hover:bg-card/80 hover:border-white/10 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
