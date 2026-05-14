import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { authApi, ApiError } from "@/lib/auth-api";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await authApi.signup({
       
      toast.error(error instanceof ApiError ? error.message : "Unable to create account.");
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
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Secure admin signup
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">Create a real account, not a demo session.</h1>
              <p className="text-base text-muted-foreground max-w-xl">
                Sign up with your name, email, and password. After your first login, the app will ask for your company name and bind the workspace to that profile.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: CheckCircle2, title: "Persistent", text: "User records live in Prisma-backed storage." },
                { icon: Sparkles, title: "Polished", text: "Clean onboarding with a premium visual style." },
                { icon: Zap, title: "Immediate", text: "Sign up, log in, then finish company setup." },
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
                  <p className="text-sm text-muted-foreground">Step 1 of 2</p>
                  <h2 className="text-xl font-semibold text-foreground">Create your admin account</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="bg-background/70 border-border/60 h-12" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.com" className="bg-background/70 border-border/60 h-12" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Password</Label>
                  <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 8 characters" className="bg-background/70 border-border/60 h-12" minLength={8} required />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="mt-5 text-xs text-muted-foreground leading-6">
                Company name is collected after the first successful login so the workspace can personalize the experience around one organization.
              </p>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
