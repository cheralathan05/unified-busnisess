import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/5 bg-card/60 backdrop-blur-xl p-5 space-y-3">
      <Skeleton className="h-4 w-2/3 bg-secondary" />
      <Skeleton className="h-3 w-1/2 bg-secondary" />
      <Skeleton className="h-8 w-24 bg-secondary" />
    </div>
  );
}
