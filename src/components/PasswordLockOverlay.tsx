import { useState, useEffect } from "react";
import { Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface PasswordLockOverlayProps {
  appName?: string;
}

const LOCK_PASSWORD_KEY = "app_lock_password";
const LOCK_STATUS_KEY = "app_lock_status";

export function PasswordLockOverlay({ appName = "Application" }: PasswordLockOverlayProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"set" | "unlock">("set");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Initialize lock state from localStorage
  useEffect(() => {
    const savedLockStatus = localStorage.getItem(LOCK_STATUS_KEY);
    const savedPassword = localStorage.getItem(LOCK_PASSWORD_KEY);

    if (savedLockStatus === "locked" && savedPassword) {
      setIsLocked(true);
    }

    setIsLoading(false);
  }, []);

  const handleLockClick = () => {
    const savedPassword = localStorage.getItem(LOCK_PASSWORD_KEY);

    if (isLocked) {
      // Try to unlock
      setDialogMode("unlock");
      setPasswordInput("");
      setConfirmPassword("");
      setError("");
      setShowPassword(false);
      setShowDialog(true);
    } else {
      // If no password exists yet, ask user to create one first.
      if (!savedPassword) {
        setDialogMode("set");
        setPasswordInput("");
        setConfirmPassword("");
        setError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowDialog(true);
      } else {
        // Password already exists: lock immediately and keep unlock dialog visible
        // so users are not left on a plain black screen.
        localStorage.setItem(LOCK_STATUS_KEY, "locked");
        setIsLocked(true);
        setDialogMode("unlock");
        setPasswordInput("");
        setConfirmPassword("");
        setError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowDialog(true);
        toast({
          title: "🔒 Application Locked",
          description: "Application is locked. Enter your password to unlock.",
          duration: 3000,
        });
      }
    }
  };

  const handleSetPassword = () => {
    if (!passwordInput.trim()) {
      setError("Password cannot be empty");
      return;
    }

    if (passwordInput.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    if (passwordInput !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    localStorage.setItem(LOCK_PASSWORD_KEY, passwordInput);
    localStorage.setItem(LOCK_STATUS_KEY, "locked");
    setIsLocked(true);
    setDialogMode("unlock");
    setPasswordInput("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowDialog(true);
    toast({
      title: "🔒 Application Locked",
      description: "Your application is now password protected. Enter your password to continue.",
      duration: 5000,
    });
  };

  const handleUnlock = () => {
    const savedPassword = localStorage.getItem(LOCK_PASSWORD_KEY);

    if (!savedPassword) {
      setError("No password set");
      return;
    }

    if (passwordInput !== savedPassword) {
      setError("Incorrect password");
      return;
    }

    localStorage.setItem(LOCK_STATUS_KEY, "unlocked");
    setIsLocked(false);
    setShowDialog(false);
    setPasswordInput("");
    toast({
      title: "🔓 Application Unlocked",
      description: "Application is now accessible.",
      duration: 3000,
    });
  };

  const handleDialogSubmit = () => {
    if (dialogMode === "set") {
      handleSetPassword();
    } else {
      handleUnlock();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDialogSubmit();
    }
  };

  const handleRelock = () => {
    localStorage.setItem(LOCK_STATUS_KEY, "locked");
    setIsLocked(true);
    toast({
      title: "🔒 Application Re-locked",
      description: "Application has been locked again.",
      duration: 3000,
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Full Screen Lock Overlay */}
      <AnimatePresence>
        {isLocked && !showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            {/* Lock Screen Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              {/* Lock Icon */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="rounded-full bg-red-500/20 border-2 border-red-500/50 p-6">
                  <Lock className="h-12 w-12 text-red-400" />
                </div>
              </motion.div>

              {/* Text */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {appName} is Locked
                </h1>
                <p className="text-white/60 text-lg">
                  Enter your password to unlock
                </p>
              </div>

              {/* Unlock Button */}
              <Button
                onClick={handleLockClick}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3 text-lg font-semibold"
              >
                <Unlock className="h-5 w-5 mr-2" />
                Unlock Application
              </Button>

              {/* Password Reset Info */}
              <p className="text-xs text-white/40 max-w-xs">
                💡 Tip: If you forgot your password, clear your browser data or use an incognito window.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="border-white/10 bg-black/90 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {dialogMode === "set"
                ? "🔐 Set Application Password"
                : "🔓 Unlock Application"}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm mt-2">
              {dialogMode === "set"
                ? `Create a strong password to lock ${appName}. You'll need this to unlock it later.`
                : `Enter your password to unlock ${appName} and regain access.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Password Input */}
            <div>
              <label className="text-sm font-medium text-white/80 block mb-2">
                {dialogMode === "set" ? "Create Password" : "Password"}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    dialogMode === "set"
                      ? "Enter a strong password (min 4 characters)"
                      : "Enter your password"
                  }
                  className="pr-10 border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (only for set mode) */}
            {dialogMode === "set" && (
              <div>
                <label className="text-sm font-medium text-white/80 block mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Re-enter your password"
                    className="pr-10 border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100"
              >
                ❌ {error}
              </motion.div>
            )}

            {/* Password Requirements */}
            {dialogMode === "set" && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
                <p className="text-xs font-medium text-cyan-100 mb-1">
                  ✓ Password Requirements:
                </p>
                <ul className="space-y-1 text-xs text-cyan-100/70">
                  <li>• At least 4 characters long</li>
                  <li>• Both passwords must match</li>
                  <li>• Keep it secure and memorable</li>
                </ul>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDialogSubmit}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 font-semibold"
              >
                {dialogMode === "set" ? "🔒 Lock Now" : "🔓 Unlock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

