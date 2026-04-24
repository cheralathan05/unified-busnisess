// auto-generated
// src/modules/password-reset/verifyOtp.controller.ts

import { Request, Response, NextFunction } from "express";
import * as otpService from "../otp/otp.service";

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    // Verify OTP without resetting password
    await otpService.verifyOtp({
      email: email.toLowerCase(),
      code: otp,
      type: "RESET_PASSWORD",
    });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
};
