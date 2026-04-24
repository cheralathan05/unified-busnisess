import { Router } from "express";
import { z } from "zod";
import { PipelineController } from "./pipeline.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new PipelineController();

const moveLeadSchema = z
	.object({
		leadId: z.string().min(1).optional(),
		dealId: z.string().min(1).optional(),
		stage: z.string().min(1).optional(),
		toStage: z.string().min(1).optional(),
	})
	.refine((body) => Boolean(body.leadId || body.dealId), {
		message: "leadId or dealId is required",
	})
	.refine((body) => Boolean(body.stage || body.toStage), {
		message: "stage is required",
	});

router.use(authMiddleware);

router.get("/", controller.getPipeline);
router.post("/move", (req, res, next) => {
	const parsed = moveLeadSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			message: "Validation error",
			errors: parsed.error.issues,
		});
	}
	req.body = parsed.data;
	return next();
}, controller.moveLead);
router.get("/stage/:stage", controller.getStage);

export default router;