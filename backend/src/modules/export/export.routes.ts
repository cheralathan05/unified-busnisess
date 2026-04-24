import { Router } from "express";
import { ExportController } from "./export.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new ExportController();

router.use(authMiddleware);

router.get("/csv", controller.csv);
router.get("/excel", controller.excel);
router.get("/pdf", controller.pdf);

export default router;