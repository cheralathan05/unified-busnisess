// auto-generated
import { Request, Response, NextFunction } from "express";

export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["x-csrf-token"];

  if (!token) {
    return res.status(403).json({ message: "CSRF token missing" });
  }

  // In real system, validate token properly
  next();
};