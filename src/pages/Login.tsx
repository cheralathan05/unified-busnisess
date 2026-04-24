import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { getProjects } from "@/lib/project-store";
import { toast } from "sonner";
import { authApi, ApiError } from "@/lib/auth-api";
import { getAuthSession, getDefaultRouteForSession, setAuthSession } from "@/lib/auth-store";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefEmail = (location.state as { email?: string } | null)?.email ?? new URLSearchParams(location.search).get("email") ?? "";
  const [email, setEmail] = useState(prefEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employees = useMemo(() => {
    const names = new Set<string>();
    getProjects().forEach((project) => {
      project.tasks.forEach((task) => names.add(task.assignee));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, []);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      navigate(getDefaultRouteForSession(session), { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Enter email and password");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.login({
        email: email.trim(),
        password,
        role,
      });

      const nextSession = {
        role: role,
        token: response.accessToken,
        userId: response.user.id,
        email: response.user.email,
        name: response.user.name,
        companyName: response.user.companyName ?? undefined,
        profileComplete: response.user.profileComplete ?? !response.needsCompanySetup,
        createdAt: Date.now(),
      };

      setAuthSession(nextSession);
      if (response.needsCompanySetup) {
        toast.success("Welcome back. Complete your company profile first.");
        navigate("/company-setup", { replace: true });
        return;
      }

      toast.success("Login successful");
      navigate(getDefaultRouteForSession(nextSession), { replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background overflow-hidden relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.04),transparent_42%)]" />
        <div className="relative w-full max-w-5xl grid lg:grid-cols-[0.95fr_1.05fr] gap-6 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Secure sign in
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">Sign in with the same email and password you created.</h1>
              <p className="text-base text-muted-foreground max-w-xl">
                Existing accounts are validated by the backend. If this is the first login, you will be taken to a company setup screen before the dashboard opens.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: CheckCircle2, title: "Backend-backed", text: "Password checks and sessions come from the API." },
                { icon: Sparkles, title: "Company setup", text: "The first sign in asks for your company name." },
                { icon: Zap, title: "Fast", text: "Email and password are enough to open the workspace." },
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
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Step 2 of 2</p>
                  <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
                </div>
              </div>

              <div className="mb-4 flex gap-2">
                <Button type="button" variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")} className="flex-1 h-11">
                  Admin
                </Button>
                <Button type="button" variant={role === "employee" ? "default" : "outline"} onClick={() => setRole("employee")} className="flex-1 h-11">
                  Employee
                </Button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.com" className="bg-background/70 border-border/60 h-12" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Password</Label>
                  <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 8 characters" className="bg-background/70 border-border/60 h-12" minLength={8} required />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Role hint: {role}</span>
                  <Link to="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
