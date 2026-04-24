// auto-generated
// src/modules/otp/otp.types.ts

export interface CreateOtpInput {
  email: string;
  type: "VERIFY_EMAIL" | "RESET_PASSWORD";
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  type: "VERIFY_EMAIL" | "RESET_PASSWORD";
}