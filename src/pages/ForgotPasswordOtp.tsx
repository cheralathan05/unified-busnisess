import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PageTransition } from "@/components/PageTransition";
import { authApi, ApiError } from "@/lib/auth-api";
import { getPasswordResetFlow, setPasswordResetFlow } from "@/lib/auth-store";
import { toast } from "sonner";

export default function ForgotPasswordOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState("");
  const email = searchParams.get("email") ?? getPasswordResetFlow()?.email ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the six-digit code.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.verifyResetOtp(email, otp);
      setPasswordResetFlow({
        email,
        otp,
        requestedAt: Date.now(),
      });
      toast.success("Code verified.");
      navigate(`/forgot-password/new-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "OTP verification failed.");
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
            <h1 className="text-2xl font-bold text-foreground">Verify OTP</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code we sent{email ? ` to ${email}` : " to your email"}.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} pattern="^[0-9]+$">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" disabled={isSubmitting || otp.length !== 6} className="w-full gradient-primary text-primary-foreground glow-primary hover:opacity-90 h-12">
              {isSubmitting ? "Verifying..." : "Verify code"}
            </Button>
          </form>

          <Link
            to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}