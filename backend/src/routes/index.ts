// src/routes/index.ts

import { Router } from "express";

// ======================
// AUTH MODULES
// ======================
import authRoutes from "../modules/auth/auth.routes";
import refreshRoutes from "../modules/refresh-token/refreshToken.routes";
import passwordResetRoutes from "../modules/password-reset/passwordReset.routes";
import verificationRoutes from "../modules/verification/emailVerification.routes";
import socialRoutes from "../modules/social-auth/socialAuth.routes";
import webauthnRoutes from "../modules/weauthn/weauthn.routes";

// ======================
// ONBOARDING
// ======================
import onboardingRoutes from "../modules/onboarding/onboarding.routes";

// ======================
// CORE CRM MODULES
// ======================
import leadRoutes from "../modules/lead/lead.routes";
import pipelineRoutes from "../modules/pipeline/pipeline.routes";
import activityRoutes from "../modules/activity/activity.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import analyticsRoutes from "../modules/analytics/analytics.routes";
import communicationRoutes from "../modules/communication/communication.routes";
import integrationRoutes from "../modules/communication/integration.routes";
import emailRoutes from "../modules/communication/email.routes";
import whatsappRoutes from "../modules/communication/whatsapp.routes";
import meetingsRoutes from "../modules/communication/meetings.routes";
import dedupRoutes from "../modules/dedup/dedup.routes";
import exportRoutes from "../modules/export/export.routes";
import stageRoutes from "../modules/stage/stage.routes";
import brainRoutes from "../modules/brain/brain.routes";
import clientIntakeRoutes from "../modules/client-intake/client-intake.routes";
import clientIntakeWorkflowRoutes from "../modules/client-intake/client-intake.workflow.routes";
import webhookRoutes from "../modules/notification/webhook.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import docsRoutes from "./openapi.route";

// ======================
// PLATFORM (OPTIONAL WRAPPER)
// ======================
import platformRoutes from "../modules/platform/platform.routes";
import { getAIProvider } from "../modules/ai/ai.provider";

const router = Router();

// ======================
// HEALTH CHECK
// ======================
router.get("/health", (_req, res) => {
  res.json({
    status: "OK 🚀",
    service: "CRM AI API"
  });
});

router.get("/ai/health", async (_req, res) => {
  try {
    const provider = getAIProvider();
    const aiResult = await provider.execute("Respond with a single word: OK");
    const aiUp = aiResult.provider === "ollama";

    res.json({
      success: true,
      data: {
        status: aiUp ? "ok" : "degraded",
        provider: aiResult.provider,
        model: aiResult.model,
        latencyMs: aiResult.latency,
        message: aiUp ? "AI provider is healthy" : "AI provider fallback active"
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: "down",
        provider: "unavailable",
        message: (error as Error).message || "AI health check failed"
      }
    });
  }
});

// ======================
// AUTH ROUTES
// ======================
router.use("/auth", authRoutes);
router.use("/auth", refreshRoutes);
router.use("/auth", passwordResetRoutes);
router.use("/auth", verificationRoutes);
router.use("/auth", socialRoutes);
router.use("/auth", webauthnRoutes);

// ======================
// ONBOARDING
// ======================
router.use("/onboarding", onboardingRoutes);

// ======================
// CRM CORE ROUTES
// ======================
router.use("/leads", leadRoutes);
router.use("/pipeline", pipelineRoutes);
router.use("/activities", activityRoutes);
router.use("/payments", paymentRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/communication", communicationRoutes);
router.use("/integrations", integrationRoutes);
router.use("/dedup", dedupRoutes);
router.use("/export", exportRoutes);
router.use("/stages", stageRoutes);
router.use("/brain", brainRoutes);
router.use("/ai", brainRoutes);
router.use("/client-intake", clientIntakeRoutes);
router.use("/", clientIntakeWorkflowRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/notifications", notificationRoutes);
router.use("/docs", docsRoutes);

// Required API aliases
router.use("/deals", pipelineRoutes);
router.use("/email", emailRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/meetings", meetingsRoutes);
router.use("/invoices", paymentRoutes);

// ======================
// PLATFORM (AGGREGATED / OPTIONAL)
// ======================
router.use("/", platformRoutes);

// ======================
export default router;