// auto-generated
// src/modules/verification/emailVerification.routes.ts

import { Router } from "express";
import * as controller from "./emailVerification.controller";

const router = Router();

// Send verification OTP
router.post("/send-verification", controller.sendVerification);

// Verify email with OTP
router.post("/verify-email", controller.verifyEmail);

export default router;