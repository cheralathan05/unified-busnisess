export class PaymentDTO {
  static toResponse(payment: any) {
    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      leadId: payment.leadId,
      createdAt: payment.createdAt
    };
  }

  static toList(payments: any[]) {
    return payments.map(this.toResponse);
  }
}