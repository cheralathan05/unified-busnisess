// auto-generated
// src/modules/audit/audit.types.ts

export interface CreateAuditLogInput {
  userId?: string;
  action: string;
  meta?: any;
  ip?: string;
  userAgent?: string;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
}