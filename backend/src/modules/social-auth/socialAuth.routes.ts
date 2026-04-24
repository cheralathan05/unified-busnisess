// auto-generated
// src/modules/social-auth/socialAuth.routes.ts

import { Router } from "express";
import passport from "passport";
import "./google.strategy";
import "./github.strategy";
import * as controller from "./socialAuth.controller";

const router = Router();

// GOOGLE
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  controller.socialSuccess
);

// GITHUB
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  controller.socialSuccess
);

// FAILURE
router.get("/failure", controller.socialFailure);

export default router;