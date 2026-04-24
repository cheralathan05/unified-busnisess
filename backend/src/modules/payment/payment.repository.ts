import { db } from "../../config/db";

export class PaymentRepository {
  createPayment(data: any) {
    return db.payment.create({ data });
  }

  createInvoice(data: any) {
    return db.invoice.create({ data });
  }

  getPayments(userId: string, filters: any) {
    return db.payment.findMany({
      where: {
        userId,
        ...(filters.leadId && { leadId: filters.leadId })
      },
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take
    });
  }

  getInvoices(userId: string, leadId?: string) {
    return db.invoice.findMany({
      where: {
        ...(leadId && { leadId }),
        lead: {
          userId
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  getPaymentSummary(leadId: string, userId: string) {
    return db.payment.aggregate({
      where: { leadId, userId },
      _sum: { amount: true }
    });
  }

  findById(id: string, userId: string) {
    return db.payment.findFirst({
      where: { id, userId }
    });
  }

  updatePayment(id: string, userId: string, data: any) {
    return db.payment.updateMany({
      where: { id, userId },
      data
    });
  }

  deletePayment(id: string, userId: string) {
    return db.payment.deleteMany({
      where: { id, userId }
    });
  }
}