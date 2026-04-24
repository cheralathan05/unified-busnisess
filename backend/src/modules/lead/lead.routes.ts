import { Router } from "express";
import { LeadController } from "./lead.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new LeadController();

router.use(authMiddleware);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.post("/analyze-all", controller.analyzeAll);
router.get("/analyze-all/:jobId", controller.analyzeAllStatus);
router.post("/deduplicate", controller.deduplicate);
router.patch("/:id/stage", controller.updateStage);
router.post("/:id/analyze", controller.analyzeOne);
router.get("/:id/intelligence", controller.getIntelligence);
router.post("/:id/score", controller.scoreLead);
router.post("/:id/predict", controller.predictLead);
router.post("/:id/email", controller.draftEmail);
router.post("/:id/reengage", controller.reengageNow);
router.post("/:id/meeting/transcript", controller.ingestMeetingTranscript);
router.post("/:id/meeting/google/transcript", controller.ingestMeetingTranscript);
router.get("/:id/insights", controller.getInsights);
router.get("/:id/summary", controller.getSummary);
router.get("/:id/action", controller.getAction);
router.get("/:id", controller.getOne);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;