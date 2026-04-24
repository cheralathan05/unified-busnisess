import { Router } from "express";
import { DedupController } from "./dedup.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new DedupController();

router.use(authMiddleware);

router.get("/", controller.find);
router.post("/merge", controller.merge);
router.post("/cleanup", controller.cleanup);

export default router;