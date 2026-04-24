import { Search, Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { getAuthSession } from "@/lib/auth-store";

export function Topbar() {
  const session = getAuthSession();
  const companyLabel = session?.companyName?.trim() || session?.email || "Authenticated session";

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border/50 flex items-center justify-between px-4 glass">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="w-64 pl-9 bg-secondary/50 border-border/50 text-sm h-9 focus:ring-primary/30"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </button>
        <button className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-secondary transition-colors">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm text-foreground font-medium leading-none">{session?.name ?? "Admin"}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-none">{companyLabel}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
