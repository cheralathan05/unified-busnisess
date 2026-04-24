// auto-generated
// src/modules/weauthn/weauthn.routes.ts

import { Router } from "express";
import * as controller from "./weauthn.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Register passkey (requires login)
router.post("/webauthn/register/start", authMiddleware, controller.startRegistration);
router.post("/webauthn/register/verify", authMiddleware, controller.verifyRegistration);

// Login with passkey
router.post("/webauthn/login/start", controller.startAuthentication);
router.post("/webauthn/login/verify", controller.verifyAuthentication);

export default router;