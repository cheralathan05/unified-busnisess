import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { CommunicationController } from "./communication.controller";

const router = Router();
const controller = new CommunicationController();

router.use(authMiddleware);
router.post("/draft", controller.generateWhatsApp);
router.post("/send", controller.sendWhatsApp);
router.post("/replied", controller.markWhatsappReplied);

export default router;
