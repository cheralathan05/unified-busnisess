// auto-generated
// src/modules/rbac/rbac.middleware.ts

import { Request, Response, NextFunction } from "express";
import { hasPermission } from "./rbac.service";

export const requirePermission = (permission: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowed = hasPermission(user.role, permission);

    if (!allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};