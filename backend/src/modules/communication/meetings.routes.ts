import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { CommunicationController } from "./communication.controller";
import { rbacMiddleware } from "../../middleware/rbac.middleware";

const router = Router();
const controller = new CommunicationController();

router.use(authMiddleware);
router.post(
	"/create",
	rbacMiddleware(["ADMIN", "MANAGER", "SALES_AGENT", "SALES AGENT", "USER"]),
	controller.createMeeting
);
router.post("/schedule", controller.scheduleCall);
router.post("/outcome", controller.markMeetingOutcome);

export default router;
