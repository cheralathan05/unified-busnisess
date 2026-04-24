// auto-generated
// src/modules/token/token.types.ts

export interface CreateTokenInput {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface TokenFilter {
  userId?: string;
  token?: string;
}