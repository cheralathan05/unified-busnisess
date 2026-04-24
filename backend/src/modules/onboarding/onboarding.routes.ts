import { Router } from "express";
import * as controller from "./onboarding.controller";
import { validate } from "../../middleware/validate.middleware";
import { startSchema, businessSchema, completeSchema } from "./onboarding.validation";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// ======================
// COMPAT MODE → SINGLE ENDPOINT
// ======================
router.post(
  "/",
  authMiddleware,
  validate(completeSchema),
  controller.complete
);

// ======================
// STEP 1 → NAME
// ======================
router.post(
  "/start",
  authMiddleware,
  validate(startSchema),
  controller.start
);

// ======================
// STEP 2 → BUSINESS INFO
// ======================
router.post(
  "/business",
  authMiddleware,
  validate(businessSchema),
  controller.business
);

export default router;