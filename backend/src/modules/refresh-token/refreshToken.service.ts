// auto-generated
// src/modules/refresh-token/refreshToken.service.ts

import { verifyRefreshToken, generateAccessToken } from "../../config/jwt";
import { db } from "../../config/db";
import { RefreshTokenInput } from "./refreshToken.types";
import { emitAuditLog } from "../../events/audit.events";

export const refreshAccessToken = async (input: RefreshTokenInput) => {
  try {
    const decoded: any = verifyRefreshToken(input.refreshToken);

    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      role: user.role || "USER",
    });

    emitAuditLog({
      userId: user.id,
      action: "TOKEN_REFRESHED",
    });

    return {
      accessToken: newAccessToken,
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};