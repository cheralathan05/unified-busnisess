// auto-generated
import { Request, Response, NextFunction } from "express";

export const deviceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.ip || req.socket.remoteAddress;

  (req as any).device = {
    userAgent,
    ip,
  };

  next();
};