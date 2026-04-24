import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { authApi, ApiError } from "@/lib/auth-api";
import { setPasswordResetFlow } from "@/lib/auth-store";
import { toast } from "sonner";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.requestPasswordReset(email.trim());
      setPasswordResetFlow({ email: email.trim(), requestedAt: Date.now() });
      toast.success("OTP sent to your email.");
      navigate(`/forgot-password/otp?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background overflow-hidden relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.04),transparent_42%)]" />
        <div className="relative w-full max-w-lg rounded-[2rem] border border-border/60 bg-card/85 p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="text-center space-y-3 mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
            <p className="text-sm text-muted-foreground">Enter your email to receive a six-digit OTP.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="bg-background/70 border-border/60 h-12"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary text-primary-foreground glow-primary hover:opacity-90 h-12">
              {isSubmitting ? "Sending code..." : "Continue"}
            </Button>
          </form>

          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
