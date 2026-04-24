// auto-generated
import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Error:", err);

  const status = err.status || 500;

  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
};