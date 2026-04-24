// auto-generated
// src/modules/verification/emailVerification.service.ts

import { db } from "../../config/db";
import { createOtp, verifyOtp } from "../otp/otp.service";
import {
  SendVerificationInput,
  VerifyEmailInput,
} from "./emailVerification.types";
import { emitAuditLog } from "../../events/audit.events";

export const sendVerification = async (input: SendVerificationInput) => {
  const user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if ((user as any).isVerified) {
    return { message: "Already verified" };
  }

  await createOtp({
    email: input.email,
    type: "VERIFY_EMAIL",
  });

  emitAuditLog({
    userId: user.id,
    action: "EMAIL_VERIFICATION_REQUESTED",
  });

  return { success: true };
};

export const verifyEmail = async (input: VerifyEmailInput) => {
  const user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify OTP
  await verifyOtp({
    email: input.email,
    code: input.otp,
    type: "VERIFY_EMAIL",
  });

  await db.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
    },
  });

  emitAuditLog({
    userId: user.id,
    action: "EMAIL_VERIFIED",
  });

  return {
    success: true,
    message: "Email verified successfully",
  };
};