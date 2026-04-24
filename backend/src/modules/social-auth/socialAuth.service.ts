// auto-generated
// src/modules/social-auth/socialAuth.service.ts

import { db } from "../../config/db";
import { generateAccessToken, generateRefreshToken } from "../../config/jwt";
import { createUserSession } from "../session/session.service";

interface SocialLoginInput {
  email: string;
  name: string;
  provider: string;
  providerId: string;
}

export const handleSocialLogin = async (input: SocialLoginInput) => {
  let user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        provider: input.provider,
        providerId: input.providerId,
      },
    });
  }

  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role || "USER",
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  await createUserSession({
    userId: user.id,
    refreshToken,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};