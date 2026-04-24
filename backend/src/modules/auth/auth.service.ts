import { db } from "../../config/db";
import { randomUUID } from "crypto";
import { RegisterInput, LoginInput } from "./auth.types";
import { AUTH_ERRORS } from "./auth.constants";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../../config/jwt";
import { hashPassword, comparePassword } from "../security/hash.service";
import { onUserRegister, onUserLogin } from "./auth.events";

// ======================
// REGISTER
// ======================
export const register = async (input: RegisterInput) => {
  const existing = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new Error(AUTH_ERRORS.USER_EXISTS);
  }

  const hashed = await hashPassword(input.password.trim());

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashed,
      companyName: input.companyName,
    },
  });

  onUserRegister(user);

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: "USER",
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  return {
    accessToken,
    refreshToken,
    user,
  };
};

// ======================
// LOGIN
// ======================
export const login = async (input: LoginInput, ip: string, userAgent?: string) => {
  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  if (!user.password) {
    throw new Error(
      "This account was created via social login. Please use social login or reset your password."
    );
  }

  const isValid = await comparePassword(input.password.trim(), user.password);

  if (!isValid) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: "USER",
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  // 🔥 OPTIONAL: store session (recommended)
  await db.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  onUserLogin(user, ip);

  return {
    accessToken,
    refreshToken,
    user,
  };
};

// ======================
// REFRESH TOKEN (FIXED)
// ======================
export const refreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Refresh token required");
  }

  let decoded: any;

  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new Error("Invalid refresh token");
  }

  // 🔥 Check session exists (important security)
  const session = await db.session.findUnique({
    where: { refreshToken: token },
  });

  if (!session) {
    throw new Error("Session not found or expired");
  }

  const user = await db.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({
    id: user.id,
    nonce: randomUUID(),
  });

  await db.session.update({
    where: { refreshToken: token },
    data: {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// ======================
// LOGOUT
// ======================
export const logout = async (userId: string) => {
  if (!userId) return;

  // delete all sessions (or just one if needed)
  await db.session.deleteMany({
    where: { userId },
  });

  return true;
};