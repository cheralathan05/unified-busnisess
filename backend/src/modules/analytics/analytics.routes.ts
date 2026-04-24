import { Router } from "express";
import { AnalyticsService } from "./analytics.service";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const service = new AnalyticsService();

router.use(authMiddleware);

router.get("/dashboard", async (req, res) => {
  const user = (req as any).user;
  const data = await service.getDashboard(user);
  res.json({ success: true, data });
});

router.get("/", async (req, res) => {
  const user = (req as any).user;
  const data = await service.getDashboard(user);
  res.json({ success: true, data });
});

router.get("/events", async (_req, res) => {
  res.json({ success: true, data: [] });
});

router.get("/revenue", async (req, res) => {
  const user = (req as any).user;
  const data = await service.getDashboard(user);
  res.json({
    success: true,
    data: {
      totalValue: data.totalValue,
      hotLeads: data.hotLeads,
      atRisk: data.atRisk
    }
  });
});

router.get("/team", async (_req, res) => {
  res.json({ success: true, data: {} });
});

export default router;