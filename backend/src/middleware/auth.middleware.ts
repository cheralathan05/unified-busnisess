// auto-generated
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../config/jwt";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const allowDevBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_DEV_BYPASS !== "false";

  try {
    const header = String(req.headers.authorization || "").trim();

    // Dev/test bypass for local integration and automated tests.
    if (allowDevBypass) {
      const devUserId = String(req.headers["x-dev-user-id"] || "").trim();
      const devEmail = String(req.headers["x-dev-user-email"] || "").trim();
      const devRole = String(req.headers["x-dev-user-role"] || "").trim();

      if (devRole || devUserId || devEmail) {
        req.user = {
          id: devUserId || "dev-user",
          role: devRole || "USER",
          email: devEmail || "dev@example.com",
        };
        return next();
      }

      // In local/dev, allow protected API exploration without token friction.
      const hasBearer = header.startsWith("Bearer ");
      const bearerToken = hasBearer ? header.slice(7).trim() : "";

      if (!header || (hasBearer && !bearerToken)) {
        req.user = {
          id: "dev-user",
          role: "USER",
          email: "dev@example.com",
        };
        return next();
      }
    }

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    if (allowDevBypass) {
      req.user = {
        id: "dev-user",
        role: "USER",
        email: "dev@example.com",
      };
      return next();
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};