import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { CommunicationController } from "./communication.controller";

const router = Router();
const controller = new CommunicationController();

router.use(authMiddleware);
router.post("/send", controller.sendEmail);
router.post("/opened", controller.markEmailOpened);
router.post("/replied", controller.markEmailReplied);

export default router;
