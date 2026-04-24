import { Router } from "express";
import { CommunicationController } from "./communication.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new CommunicationController();

// ======================
// PUBLIC AI EMAIL GENERATION
// ======================
router.post("/ai-email", controller.generateEmail);
// Compatibility alias for common typo.
router.post("/ai-emai", controller.generateEmail);
router.post("/ai-whatsapp", controller.generateWhatsApp);

// ======================
// PROTECT ALL ROUTES
// ======================
router.use(authMiddleware);

// ======================
// EMAIL
// ======================
router.post("/email", controller.sendEmail);
router.post("/send", controller.sendEmail);
router.post("/email/opened", controller.markEmailOpened);
router.post("/email/replied", controller.markEmailReplied);

// ======================
// WHATSAPP
// ======================
router.post("/whatsapp", controller.sendWhatsApp);
router.post("/send-whatsapp", controller.sendWhatsApp);
router.post("/whatsapp/replied", controller.markWhatsappReplied);

// ======================
// CALL SCHEDULING
// ======================
router.post("/meeting/create", controller.createMeeting);
router.post("/schedule", controller.scheduleCall);
router.post("/meeting/outcome", controller.markMeetingOutcome);

// ======================
// (OPTIONAL FUTURE)
// ======================
// router.post("/cancel", controller.cancelCall);
// router.post("/reschedule", controller.rescheduleCall);

export default router;