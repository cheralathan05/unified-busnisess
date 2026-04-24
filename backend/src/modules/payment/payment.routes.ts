import { Router } from "express";
import multer from "multer";
import { PaymentController } from "./payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new PaymentController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.use(authMiddleware);

router.post("/", controller.createPayment);
router.post("/invoice", controller.createInvoice);
router.post("/invoice/send", controller.sendInvoice);
router.post("/reminder", controller.sendReminder);
router.post("/retry", controller.retryPayment);
router.post("/fraud-check", controller.fraudCheck);
router.post("/proof/verify", upload.single("proof"), controller.verifyPaymentProof);
router.post("/subscription", controller.manageSubscription);
router.get("/", controller.getPayments);
router.get("/invoice/:leadId", controller.getInvoices);
router.get("/summary/:leadId", controller.getSummary);
router.put("/:id", controller.updatePayment);
router.delete("/:id", controller.deletePayment);

export default router;