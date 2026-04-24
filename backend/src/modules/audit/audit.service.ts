// auto-generated
// src/modules/audit/audit.service.ts

import {
  CreateAuditLogInput,
  AuditFilter,
} from "./audit.types";
import * as auditRepo from "./audit.repository";

export const logAudit = async (data: CreateAuditLogInput) => {
  try {
    await auditRepo.createAuditLog(data);
  } catch (error) {
    console.error("❌ Audit log failed:", error);
  }
};

export const fetchAuditLogs = async (filter: AuditFilter) => {
  return auditRepo.getAuditLogs(filter);
};