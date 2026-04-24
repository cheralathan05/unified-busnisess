// auto-generated
// src/modules/password-reset/passwordReset.types.ts

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}