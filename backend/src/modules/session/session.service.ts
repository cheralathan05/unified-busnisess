// auto-generated
// src/modules/session/session.service.ts

import * as repo from "./session.repository";
import { CreateSessionInput } from "./session.types";
import { SESSION_CONFIG } from "./session.constants";

export const createUserSession = async (input: CreateSessionInput) => {
  const sessions = await repo.findSessionsByUser(input.userId);

  // Limit max sessions
  if (sessions.length >= SESSION_CONFIG.MAX_SESSIONS) {
    const oldest = sessions[sessions.length - 1];
    await repo.deleteSession(oldest.id);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_CONFIG.EXPIRY_DAYS);

  return repo.createSession({
    userId: input.userId,
    refreshToken: input.refreshToken,
    userAgent: input.userAgent,
    ip: input.ip,
    expiresAt,
  });
};

export const getUserSessions = async (userId: string) => {
  return repo.findSessionsByUser(userId);
};

export const logoutSession = async (sessionId: string) => {
  return repo.deleteSession(sessionId);
};

export const logoutAllSessions = async (userId: string) => {
  return repo.deleteSessionsByUser(userId);
};