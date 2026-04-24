// auto-generated
// src/modules/password-reset/passwordReset.routes.ts

import { Router } from "express";
import * as controller from "./forgotPassword.controller";
import * as resetController from "./resetPassword.controller";
import * as verifyOtpController from "./verifyOtp.controller";

const router = Router();

// Step 1: Send OTP
router.post("/forgot-password", controller.forgotPassword);

// Step 2a: Verify OTP only
router.post("/verify-otp", verifyOtpController.verifyOtp);

// Step 2b: Verify OTP + Reset password
router.post("/reset-password", resetController.resetPassword);

export default router;