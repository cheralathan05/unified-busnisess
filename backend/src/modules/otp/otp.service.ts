// auto-generated
// src/modules/otp/otp.service.ts

import { OTP_CONFIG, OTP_ERRORS } from "./otp.constants";
import * as otpRepo from "./otp.repository";
import { CreateOtpInput, VerifyOtpInput } from "./otp.types";
import { sendNotification } from "../notification/notification.service";

// Generate random OTP
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// CREATE OTP
export const createOtp = async (input: CreateOtpInput) => {
  const code = generateCode();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.EXPIRY_MINUTES);

  const otp = await otpRepo.createOtp({
    email: input.email,
    code,
    type: input.type,
    attempts: 0,
    expiresAt,
  });

  // Send email
  await sendNotification({
    to: input.email,
    subject: "Your OTP Code",
    message: `Your OTP is ${code}`,
    html: `<h2>Your OTP: ${code}</h2>`,
    channel: "EMAIL",
  });

  return { success: true };
};

// VERIFY OTP
export const verifyOtp = async (input: VerifyOtpInput) => {
  const otp = await otpRepo.findOtp(input.email, input.type);

  if (!otp) throw new Error(OTP_ERRORS.INVALID);

  if (otp.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    throw new Error(OTP_ERRORS.MAX_ATTEMPTS);
  }

  if (new Date() > otp.expiresAt) {
    throw new Error(OTP_ERRORS.EXPIRED);
  }

  if (otp.code !== input.code) {
    await otpRepo.incrementAttempts(otp.id);
    throw new Error(OTP_ERRORS.INVALID);
  }

  // success → delete OTP
  await otpRepo.deleteOtp(otp.id);

  return { success: true };
};