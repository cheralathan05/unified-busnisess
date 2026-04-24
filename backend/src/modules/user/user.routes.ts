import { Router } from "express";
import * as controller from "./user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateUserSchema } from "./user.validation";

const router = Router();

router.get("/me", authMiddleware, controller.getMe);
router.patch("/me", authMiddleware, validate(updateUserSchema), controller.updateMe);
router.delete("/me", authMiddleware, controller.deleteMe);

export default router;
