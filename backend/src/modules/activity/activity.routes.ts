import { Router } from "express";
import { ActivityController } from "./activity.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new ActivityController();

router.use(authMiddleware);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/lead/:leadId", controller.getByLead);

export default router;