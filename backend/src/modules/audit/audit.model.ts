// auto-generated
// src/modules/audit/audit.model.ts

export type Audit = {
  id: string;
  userId?: string;
  action: string;
  meta?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
};