// auto-generated
import { Request, Response, NextFunction } from "express";
import { emitAuditLog } from "../events/audit.events";

export const auditMiddleware = (action: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    emitAuditLog({
      userId,
      action,
      meta: {
        method: req.method,
        path: req.originalUrl,
      },
    });

    next();
  };
};