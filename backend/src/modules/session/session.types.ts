// auto-generated
// src/modules/session/session.types.ts

export interface CreateSessionInput {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
}

export interface SessionFilter {
  userId: string;
}