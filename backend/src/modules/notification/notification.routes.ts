import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { sendNotification } from "./notification.service";

const router = Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  const channel = String(req.body?.channel || "IN_APP").toUpperCase();
  const input = {
    to: String(req.body?.to || req.body?.email || "system"),
    subject: req.body?.subject,
    message: String(req.body?.message || ""),
    html: req.body?.html,
    channel: channel as "EMAIL" | "SMS" | "IN_APP"
  };

  const result = await sendNotification(input);
  return res.json({ success: true, data: result });
});

export default router;
