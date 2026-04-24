export interface CreatePaymentInput {
  amount: number;
  leadId: string;
  status?: "pending" | "completed";
}

export interface CreateInvoiceInput {
  total: number;
  leadId: string;
}

export interface PaymentQuery {
  leadId?: string;
  page?: number;
  limit?: number;
}