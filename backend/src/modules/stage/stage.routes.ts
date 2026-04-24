import { Router } from "express";
import { StageController } from "./stage.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new StageController();

router.use(authMiddleware);

router.get("/", controller.get);
router.put("/", controller.update);
router.post("/add", controller.add);
router.post("/remove", controller.remove);

export default router;