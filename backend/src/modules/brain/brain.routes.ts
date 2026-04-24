import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { BrainController } from "./brain.controller";

const router = Router();
const controller = new BrainController();

router.use(authMiddleware);

router.get("/suggestions", controller.getSuggestions);
router.post("/:id/approve", controller.approveDecision);
router.post("/:id/reject", controller.rejectDecision);

export default router;
