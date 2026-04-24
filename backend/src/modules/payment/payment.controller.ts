import { Request, Response } from "express";
import { PaymentService } from "./payment.service";

const service = new PaymentService();

export class PaymentController {
  async createPayment(req: Request, res: Response) {
    const user = (req as any).user;
    const idempotencyKey = String(req.header("Idempotency-Key") || "").trim();
    const data = await service.createPayment(req.body, user, { idempotencyKey });
    res.json({ success: true, data });
  }

  async createInvoice(req: Request, res: Response) {
    const user = (req as any).user;
    const payload = {
      ...req.body,
      total: req.body?.total ?? req.body?.amount
    };
    const data = await service.createInvoice(payload, user);
    res.json({ success: true, data });
  }

  async sendInvoice(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.sendInvoice(req.body, user);
    res.json({ success: true, data });
  }

  async sendReminder(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.sendReminder(req.body, user);
    res.json({ success: true, data });
  }

  async retryPayment(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.retryPayment(req.body, user);
    res.json({ success: true, data });
  }

  async fraudCheck(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.fraudCheck(req.body, user);
    res.json({ success: true, data });
  }

  async verifyPaymentProof(req: Request, res: Response) {
    const user = (req as any).user;
    const file = (req as any).file;
    const data = await service.verifyPaymentProof(req.body, user, file);
    res.json({ success: true, data });
  }

  async manageSubscription(req: Request, res: Response) {
    const data = await service.manageSubscription(req.body);
    res.json({ success: true, data });
  }

  async updatePayment(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.updatePayment(String(req.params.id), req.body, user);
    res.json({ success: true, data });
  }

  async deletePayment(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.deletePayment(String(req.params.id), user);
    res.json({ success: true, data });
  }

  async getPayments(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getPayments(req.query, user);
    res.json({ success: true, data });
  }

  async getInvoices(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getInvoices(String(req.params.leadId), user);
    res.json({ success: true, data });
  }

  async getSummary(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getSummary(String(req.params.leadId), user);
    res.json({ success: true, data });
  }
}