import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { authApi, ApiError } from "@/lib/auth-api";
import { getAuthSession, setAuthSession, getDefaultRouteForSession } from "@/lib/auth-store";
import { toast } from "sonner";

export default function CompanySetup() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [companyName, setCompanyName] = useState(session?.companyName ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
    }
  }, [navigate, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyName.trim()) {
      toast.error("Enter your company name.");
      return;
    }

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsSaving(true);
      const submittedCompanyName = companyName.trim();
      await authApi.completeCompanySetup(submittedCompanyName);
      const updatedSession = {
        ...session,
        companyName: submittedCompanyName,
        profileComplete: true,
      };

      setAuthSession(updatedSession);
      toast.success("Company profile saved.");
      navigate(getDefaultRouteForSession(updatedSession), { replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save company profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.04),transparent_40%)]" />
        <div className="relative w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> First login setup
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">Give this workspace a company identity.</h1>
              <p className="text-base text-muted-foreground max-w-xl">
                Your account is secured. Add the company name once, and the dashboard will personalize every view, notification, and future record around that organization.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: CheckCircle2, title: "Secure", text: "Protected by hashed passwords and JWT sessions." },
                { icon: Sparkles, title: "Personalized", text: "Dashboards and sessions stay tied to one company." },
                { icon: Building2, title: "Professional", text: "Polished onboarding with a real first-login step." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
                  <item.icon className="w-5 h-5 text-primary" />
                  <h2 className="mt-3 font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 translate-y-5 scale-[0.98] rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl" />
            <div className="relative rounded-[2rem] border border-border/60 bg-card/85 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Authenticated setup</p>
                  <h2 className="text-xl font-semibold text-foreground">Complete your company profile</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Company name</Label>
                  <Input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Acme Studio Pvt Ltd"
                    className="bg-background/70 border-border/60 h-12"
                    required
                  />
                </div>

                <Button type="submit" disabled={isSaving} className="w-full h-12 gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                  {isSaving ? "Saving..." : "Finish setup"}
                </Button>
              </form>

              <p className="mt-5 text-xs text-muted-foreground leading-6">
                Signed in as {session?.name ?? "your account"}. The company name will appear across the dashboard, headers, and future user-specific records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}