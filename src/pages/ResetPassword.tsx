import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/PageTransition";
import { authApi, ApiError } from "@/lib/auth-api";
import { clearPasswordResetFlow, getPasswordResetFlow } from "@/lib/auth-store";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const resetFlow = getPasswordResetFlow();
  const email = searchParams.get("email") ?? resetFlow?.email ?? "";
  const otp = resetFlow?.otp ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [confirmPassword, password],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || passwordMismatch) {
      toast.error("Please enter matching passwords.");
      return;
    }

    if (!otp || !email) {
      toast.error("Your reset session has expired. Start again.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.resetPassword(email, otp, password);
      clearPasswordResetFlow();
      toast.success("Password updated. You can sign in now.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to reset password.");
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
            <h1 className="text-2xl font-bold text-foreground">Create new password</h1>
            <p className="text-sm text-muted-foreground">
              {email ? `Set a new password for ${email}` : "Set a secure new password for your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">New password</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="bg-background/70 border-border/60 h-12"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Confirm password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                className="bg-background/70 border-border/60 h-12"
                minLength={8}
                required
              />
              {passwordMismatch ? <p className="text-xs text-destructive">Passwords do not match.</p> : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword || passwordMismatch}
              className="w-full gradient-primary text-primary-foreground glow-primary hover:opacity-90 h-12"
            >
              {isSubmitting ? "Saving..." : "Save new password"}
            </Button>
          </form>

          <Link
            to={`/forgot-password/otp${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}