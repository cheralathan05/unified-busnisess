import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", (req, res) => {
  const url = String(req.body?.url || "").trim();
  if (!url) {
    return res.status(400).json({ success: false, message: "url is required" });
  }

  res.json({
    success: true,
    data: {
      status: "delivered",
      url,
      deliveredAt: new Date().toISOString()
    }
  });
});

export default router;
