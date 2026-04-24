import { PaymentRepository } from "./payment.repository";
import { eventBus } from "../../core/events/eventBus";
import { db } from "../../config/db";
import { EVENTS } from "../../constants/event.constants";
import { uploadPaymentProof } from "../storage/cloudinary.service";
import { extractTextFromImage } from "./ocr.service";
import { aiService } from "../ai/ai.service";

const repo = new PaymentRepository();

const httpError = (status: number, message: string) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const ALLOWED_PAYMENT_STATUSES = new Set(["pending", "completed", "partial", "failed"]);
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

type InflightRecord = {
  fingerprint: string;
  promise: Promise<any>;
};

type CachedRecord = {
  fingerprint: string;
  payment: any;
  expiresAt: number;
};

const inflightPayments = new Map<string, InflightRecord>();
const cachedPayments = new Map<string, CachedRecord>();

const isPlaceholderLeadId = (leadId: string) => {
  const normalized = leadId.trim().toLowerCase();
  return (
    normalized === "leadid" ||
    normalized === "lead_id" ||
    normalized === "lead-id" ||
    normalized === "{{leadid}}" ||
    normalized === "{{lead_id}}"
  );
};

export class PaymentService {
  async createPayment(input: any, user: any, options?: { idempotencyKey?: string }) {
    if (!input?.leadId || typeof input.leadId !== "string") {
      throw httpError(400, "leadId is required");
    }

    const lead = await this.ensureOwnedLead(input.leadId, user.id);

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw httpError(400, "amount must be a positive number");
    }

    const status = String(input.status || "completed").toLowerCase();
    if (!ALLOWED_PAYMENT_STATUSES.has(status)) {
      throw httpError(400, "status must be either pending or completed");
    }

    const paymentMethod = String(input?.method || input?.paymentMethod || "unknown").toLowerCase();

    const normalizedInput = {
      leadId: lead.id,
      amount,
      userId: user.id,
      status
    };

    eventBus.emit(EVENTS.PAYMENT_INITIATED, {
      leadId: lead.id,
      userId: user.id,
      amount,
      status,
      paymentMethod
    });

    const idempotencyKey = String(options?.idempotencyKey || "").trim();
    if (!idempotencyKey) {
      return this.createAndEmitPayment(normalizedInput);
    }

    this.cleanupExpiredCache();

    const scopedKey = `${user.id}:${idempotencyKey}`;
    const fingerprint = JSON.stringify({
      leadId: normalizedInput.leadId,
      amount: normalizedInput.amount,
      status: normalizedInput.status
    });

    const cached = cachedPayments.get(scopedKey);
    if (cached) {
      if (cached.fingerprint !== fingerprint) {
        throw httpError(409, "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
      }
      return cached.payment;
    }

    const inflight = inflightPayments.get(scopedKey);
    if (inflight) {
      if (inflight.fingerprint !== fingerprint) {
        throw httpError(409, "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
      }
      return inflight.promise;
    }

    const promise = this.createAndEmitPayment(normalizedInput)
      .then((payment) => {
        cachedPayments.set(scopedKey, {
          fingerprint,
          payment,
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS
        });
        return payment;
      })
      .finally(() => {
        inflightPayments.delete(scopedKey);
      });

    inflightPayments.set(scopedKey, { fingerprint, promise });

    return promise;
  }

  private async createAndEmitPayment(data: any) {
    const payment = await repo.createPayment(data);

    eventBus.emit(EVENTS.PAYMENT_COMPLETED, payment);
    if (payment.status === "completed") {
      eventBus.emit(EVENTS.PAYMENT_SUCCESS, payment);
    } else if (payment.status === "partial") {
      eventBus.emit(EVENTS.PAYMENT_PARTIAL, payment);
    } else if (payment.status === "failed") {
      eventBus.emit(EVENTS.PAYMENT_FAILED, payment);
    }

    // Legacy alias for older trigger wiring.
    eventBus.emit("payment.received", payment);

    return payment;
  }

  private cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cachedPayments.entries()) {
      if (value.expiresAt <= now) {
        cachedPayments.delete(key);
      }
    }
  }

  async createInvoice(input: any, user: any) {
    const lead = await this.resolveLeadForInvoice(input, user.id);

    const total = Number(input.total);
    if (!Number.isFinite(total) || total <= 0) {
      throw httpError(400, "total must be a positive number");
    }

    const dueDate = String(input?.dueDate || "").trim();

    const invoice = await repo.createInvoice({
      leadId: lead.id,
      total,
      status: "pending"
    });

    if (dueDate) {
      await db.activity.create({
        data: {
          userId: user.id,
          leadId: lead.id,
          type: "invoice.dueDate.set",
          text: `Invoice ${invoice.id} due date set to ${dueDate}`
        }
      });
    }

    eventBus.emit(EVENTS.INVOICE_CREATED, invoice);
    return invoice;
  }

  async sendInvoice(input: any, user: any) {
    const invoiceId = String(input?.invoiceId || "").trim();
    if (!invoiceId) throw httpError(400, "invoiceId is required");

    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        lead: { userId: user.id }
      }
    });

    if (!invoice) throw httpError(404, "INVOICE_NOT_FOUND");

    return { status: "sent", invoiceId, channel: String(input?.channel || "email") };
  }

  async sendReminder(input: any, user: any) {
    const invoiceId = String(input?.invoiceId || "").trim();
    if (!invoiceId) throw httpError(400, "invoiceId is required");

    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        lead: { userId: user.id }
      }
    });

    if (!invoice) throw httpError(404, "INVOICE_NOT_FOUND");

    return { sent: true, invoiceId };
  }

  async retryPayment(input: any, user: any) {
    const id = String(input?.id || "").trim();
    if (!id) throw httpError(400, "id is required");

    const payment = await repo.findById(id, user.id);
    if (!payment) throw httpError(404, "PAYMENT_NOT_FOUND");

    await repo.updatePayment(id, user.id, { status: "pending" });
    return { status: "pending", id };
  }

  async fraudCheck(input: any, user: any) {
    const transactionId = String(input?.transactionId || input?.id || "").trim();
    if (!transactionId) throw httpError(400, "transactionId is required");

    const payment = await repo.findById(transactionId, user.id);
    if (!payment) throw httpError(404, "PAYMENT_NOT_FOUND");

    const amount = Number(input?.amount ?? payment.amount ?? 0);
    if (!Number.isFinite(amount)) throw httpError(400, "amount must be numeric");

    const risk = amount >= 20000 ? "medium" : "low";
    return {
      risk,
      reasoning: risk === "medium" ? "Amount above normal range" : "Transaction pattern appears normal"
    };
  }

  async verifyPaymentProof(input: any, user: any, file?: any) {
    const paymentId = String(input?.paymentId || input?.id || "").trim();
    if (!paymentId) throw httpError(400, "paymentId is required");

    const payment = await repo.findById(paymentId, user.id);
    if (!payment) throw httpError(404, "PAYMENT_NOT_FOUND");

    const invoice = await db.invoice.findFirst({
      where: { leadId: payment.leadId },
      orderBy: { createdAt: "desc" }
    });

    const paidAggregate = await repo.getPaymentSummary(payment.leadId, user.id);
    const paidAmount = Number(paidAggregate?._sum?.amount || 0);
    const invoiceTotal = Number(invoice?.total || 0);
    const outstandingBalance = Math.max(0, invoiceTotal - paidAmount);

    const upload = file
      ? await uploadPaymentProof({
          userId: user.id,
          paymentId: payment.id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          body: file.buffer
        })
      : {
          key: `payment-proofs/${user.id}/${payment.id}/manual-input.txt`,
          url: "",
          mocked: true
        };

    const expectedAmount = Number(input?.amount || payment.amount || 0);
    const extractedText = String(input?.ocrText || input?.extractedText || input?.text || "").trim()
      || (file ? await extractTextFromImage({ buffer: file.buffer }) : "");

    const aiValidation = await aiService.validatePaymentProof({
      extractedText,
      expectedAmount,
      invoiceId: invoice?.id,
      paymentId: payment.id
    });

    const verificationStatus = aiValidation.status;
    const amountMatches = aiValidation.amountMatches;
    const transactionIdValid = aiValidation.transactionIdValid;
    const detectedAmount = aiValidation.detectedAmount;
    const transactionId = aiValidation.transactionId || "";

    await db.activity.create({
      data: {
        userId: user.id,
        leadId: payment.leadId,
        type: "payment.proof.verified",
        text: `Payment proof ${verificationStatus}. payment=${payment.id} tx=${transactionId || "na"}`
      }
    });

    const verificationPayload = {
      paymentId: payment.id,
      leadId: payment.leadId,
      userId: user.id,
      invoiceId: invoice?.id,
      verificationStatus,
      extracted: {
        detectedAmount: Number.isFinite(detectedAmount as number) ? Number(detectedAmount) : null,
        transactionId: transactionId || null
      },
      validation: {
        expectedAmount,
        amountMatches,
        transactionIdValid
      },
      aiReasoning: aiValidation.reasoning,
      proof: {
        url: upload.url,
        key: upload.key,
        mockedStorage: upload.mocked
      },
      paymentMethod: String(input?.paymentMethod || "unknown"),
      paidAmount,
      remainingBalance: outstandingBalance
    };

    eventBus.emit(EVENTS.PAYMENT_PROOF_UPLOADED, {
      ...verificationPayload,
      fileName: file?.originalname,
      mimeType: file?.mimetype
    });

    eventBus.emit(EVENTS.PAYMENT_VERIFICATION_COMPLETED, verificationPayload);

    eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
      leadId: payment.leadId,
      userId: user.id,
      reason: "payment.proof.verified"
    });

    eventBus.emit(EVENTS.DASHBOARD_REFRESH_REQUESTED, {
      userId: user.id,
      leadId: payment.leadId,
      reason: "payment.proof.verified"
    });

    eventBus.emit(EVENTS.NOTIFICATION_REQUESTED, {
      userId: user.id,
      channel: "EMAIL",
      title: "Payment receipt",
      message: `Payment ${payment.id} ${verificationStatus}. Paid: ${paidAmount}. Remaining: ${outstandingBalance}.`,
      meta: verificationPayload
    });

    eventBus.emit(EVENTS.NOTIFICATION_REQUESTED, {
      userId: user.id,
      channel: "SMS",
      title: "Payment receipt",
      message: `Payment ${payment.id}: ${verificationStatus}. Remaining balance: ${outstandingBalance}.`,
      meta: verificationPayload
    });

    return verificationPayload;
  }

  async manageSubscription(input: any) {
    return {
      status: String(input?.action || "active"),
      plan: String(input?.plan || "default")
    };
  }

  async updatePayment(id: string, input: any, user: any) {
    const payment = await repo.findById(id, user.id);
    if (!payment) throw httpError(404, "PAYMENT_NOT_FOUND");

    const patch: any = {};
    if (input?.status) {
      const status = String(input.status).toLowerCase();
      if (!ALLOWED_PAYMENT_STATUSES.has(status)) {
        throw httpError(400, "status must be either pending, completed, partial, or failed");
      }
      patch.status = status;
    }

    if (input?.amount !== undefined) {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw httpError(400, "amount must be a positive number");
      }
      patch.amount = amount;
    }

    await repo.updatePayment(id, user.id, patch);
    const updated = await repo.findById(id, user.id);

    if (updated?.status === "completed") {
      eventBus.emit(EVENTS.PAYMENT_SUCCESS, updated);
    } else if (updated?.status === "partial") {
      eventBus.emit(EVENTS.PAYMENT_PARTIAL, updated);
    } else if (updated?.status === "failed") {
      eventBus.emit(EVENTS.PAYMENT_FAILED, updated);
    }

    if (updated?.leadId && updated?.userId) {
      eventBus.emit(EVENTS.AI_RECALCULATION_REQUESTED, {
        leadId: updated.leadId,
        userId: updated.userId,
        reason: "payment.updated"
      });
    }

    return updated;
  }

  async deletePayment(id: string, user: any) {
    const payment = await repo.findById(id, user.id);
    if (!payment) throw httpError(404, "PAYMENT_NOT_FOUND");

    await repo.deletePayment(id, user.id);
    return { id };
  }

  async getPayments(query: any, user: any) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);

    if (!Number.isInteger(page) || page < 1) {
      throw httpError(400, "page must be a positive integer");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw httpError(400, "limit must be an integer between 1 and 100");
    }

    if (query.leadId) {
      if (typeof query.leadId !== "string") {
        throw httpError(400, "leadId must be a string");
      }

      await this.ensureOwnedLead(query.leadId, user.id);
    }

    return repo.getPayments(user.id, {
      ...query,
      skip: (page - 1) * limit,
      take: limit
    });
  }

  async getInvoices(leadId: string, user: any) {
    await this.ensureOwnedLead(leadId, user.id);
    return repo.getInvoices(user.id, leadId);
  }

  async getSummary(leadId: string, user: any) {
    await this.ensureOwnedLead(leadId, user.id);

    const total = await repo.getPaymentSummary(leadId, user.id);

    const paid = total._sum.amount || 0;

    return {
      total: paid,
      paid,
      outstanding: 0,
      status: paid > 0 ? "paid" : "pending"
    };
  }

  private async ensureOwnedLead(leadId: string, userId: string) {
    if (isPlaceholderLeadId(leadId)) {
      throw httpError(400, "Invalid leadId. Use real lead UUID from create lead response");
    }

    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: { id: true, userId: true }
    });

    if (!lead) {
      throw httpError(404, "LEAD_NOT_FOUND");
    }

    if (lead.userId !== userId) {
      throw httpError(403, "NOT_OWNER");
    }

    return lead;
  }

  private async resolveLeadForInvoice(input: any, userId: string) {
    if (typeof input?.leadId === "string" && input.leadId.trim()) {
      return this.ensureOwnedLead(input.leadId, userId);
    }

    const client = String(input?.client || "").trim();
    if (!client) {
      throw httpError(400, "leadId or client is required");
    }

    const lead = await db.lead.findFirst({
      where: {
        userId,
        OR: [
          { company: { equals: client, mode: "insensitive" } },
          { name: { equals: client, mode: "insensitive" } }
        ]
      },
      select: { id: true, userId: true }
    });

    if (lead) {
      return lead;
    }

    const seeded = await db.lead.create({
      data: {
        userId,
        name: client,
        company: client,
        value: Number(input?.total || input?.amount || 0) || 0,
        score: 45,
        stage: "Discovery",
        summary: `Auto-created from invoice flow for ${client}`,
        nextAction: "email",
        confidence: 0.3,
        promptVersion: "invoice-seed-v1"
      },
      select: { id: true, userId: true }
    });

    return seeded;
  }
}