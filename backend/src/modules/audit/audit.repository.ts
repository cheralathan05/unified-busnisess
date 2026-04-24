// auto-generated
// src/modules/audit/audit.repository.ts

import { db } from "../../config/db";
import { CreateAuditLogInput, AuditFilter } from "./audit.types";

export const createAuditLog = async (data: CreateAuditLogInput) => {
  return db.audit.create({
    data: {
      userId: data.userId,
      action: data.action,
      meta: data.meta,
      ip: data.ip,
      userAgent: data.userAgent,
    },
  });
};

export const getAuditLogs = async (filter: AuditFilter) => {
  return db.audit.findMany({
    where: {
      userId: filter.userId,
      action: filter.action,
      createdAt: {
        gte: filter.fromDate,
        lte: filter.toDate,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};