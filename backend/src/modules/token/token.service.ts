// auto-generated
// src/modules/token/token.service.ts

import * as repo from "./token.repository";
import { CreateTokenInput } from "./token.types";
import { TOKEN_ERRORS } from "./token.constants";

/**
 * Store refresh token
 */
export const storeToken = async (input: CreateTokenInput) => {
  return repo.createToken(input);
};

/**
 * Validate refresh token (DB + expiry)
 */
export const validateToken = async (token: string) => {
  const record = await repo.findToken(token);

  if (!record) {
    throw new Error(TOKEN_ERRORS.INVALID);
  }

  if (new Date() > record.expiresAt) {
    await repo.deleteToken(token);
    throw new Error(TOKEN_ERRORS.EXPIRED);
  }

  return record;
};

/**
 * Revoke single token
 */
export const revokeToken = async (token: string) => {
  return repo.deleteToken(token);
};

/**
 * Revoke all user tokens (logout all devices)
 */
export const revokeAllUserTokens = async (userId: string) => {
  return repo.deleteTokensByUser(userId);
};