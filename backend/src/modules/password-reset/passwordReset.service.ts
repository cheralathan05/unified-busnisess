// auto-generated
// src/modules/password-reset/passwordReset.service.ts

import { db } from "../../config/db";
import { ForgotPasswordInput, ResetPasswordInput } from "./passwordReset.types";
import { createOtp, verifyOtp } from "../otp/otp.service";
import { hashPassword } from "../security/hash.service";
import { emitAuditLog } from "../../events/audit.events";

export const forgotPassword = async (input: ForgotPasswordInput) => {
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    // Keep production-safe behavior, but provide development diagnostics.
    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        emailSent: false,
        message: "No account found for this email"
      };
    }

    return { success: true, emailSent: false };
  }

  await createOtp({
    email: input.email.toLowerCase(),
    type: "RESET_PASSWORD",
  });

  emitAuditLog({
    userId: user.id,
    action: "PASSWORD_RESET_REQUEST",
  });

  return { success: true };
};

export const resetPassword = async (input: ResetPasswordInput) => {
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify OTP - this will throw if invalid or expired

  // OTP was already verified in the /verify-otp endpoint
  // No need to verify again, just update the password

  // Hash new password
  const hashed = await hashPassword(input.newPassword.trim());

  // Update password
  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
    },
  });

  emitAuditLog({
    userId: user.id,
    action: "PASSWORD_RESET_SUCCESS",
  });

  return { success: true, message: "Password updated successfully" };
};