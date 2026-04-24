import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { registerSchema, loginSchema } from "./auth.validation";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rateLimiter } from "../../middleware/rateLimiter.middleware";

const router = Router();

// ======================
// PUBLIC ROUTES
// ======================
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", rateLimiter, validate(loginSchema), controller.login);

// ======================
// TOKEN MANAGEMENT
// ======================

// 🔥 Refresh token (should NOT require authMiddleware)
router.post("/refresh", controller.refreshToken);

// ======================
// PROTECTED ROUTES
// ======================

// 🔥 Current user
router.get("/me", authMiddleware, controller.getMe);

// 🔥 Logout (requires auth)
router.post("/logout", authMiddleware, controller.logout);

// ======================
// DEBUG (OPTIONAL)
// ======================
router.get("/check", authMiddleware, (_req, res) => {
  res.json({ success: true, message: "Auth working ✅" });
});

export default router;