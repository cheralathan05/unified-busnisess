import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/PageTransition";
import { getAllClientAccess } from "@/lib/collaboration-store";
import { setAuthSession } from "@/lib/auth-store";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [accessId, setAccessId] = useState("");
  const accesses = useMemo(() => getAllClientAccess(), []);

  const openPortal = (id: string) => {
    if (!id.trim()) return;
    setAuthSession({
      role: "client",
      clientAccessId: id.trim(),
      profileComplete: true,
      createdAt: Date.now(),
    });
    navigate(`/client/portal/${encodeURIComponent(id.trim())}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Client Portal Login</h1>
            <p className="text-sm text-muted-foreground">Track project progress, approvals, timeline, and payments.</p>
          </div>

          <GlassCard className="space-y-4">
            <p className="text-sm font-medium text-foreground">Enter access code</p>
            <div className="flex gap-2">
              <Input value={accessId} onChange={(e) => setAccessId(e.target.value)} placeholder="client-1-..." className="bg-card/60 border-border/50" />
              <Button onClick={() => openPortal(accessId)}>Open</Button>
            </div>
          </GlassCard>

          <GlassCard className="space-y-3">
            <p className="text-sm font-medium text-foreground">Recent client links</p>
            <div className="grid gap-2">
              {accesses.map((item) => (
                <button key={item.id} onClick={() => openPortal(item.id)} className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-left hover:bg-secondary/35 transition-colors">
                  <p className="text-sm font-medium text-foreground">{item.clientName}</p>
                  <p className="text-xs text-muted-foreground">{item.email} · {item.id}</p>
                </button>
              ))}
              {!accesses.length ? <p className="text-sm text-muted-foreground">No client links generated yet.</p> : null}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}
