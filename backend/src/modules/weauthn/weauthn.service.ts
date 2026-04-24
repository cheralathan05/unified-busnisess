// auto-generated
// src/modules/weauthn/weauthn.service.ts

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import { db } from "../../config/db";
import { webauthnConfig } from "../../config/weauthn";
import * as repo from "./credential.repository";
import { generateAccessToken, generateRefreshToken } from "../../config/jwt";

export const startRegistration = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const options = generateRegistrationOptions({
    rpName: webauthnConfig.rpName,
    rpID: webauthnConfig.rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
  });

  return options;
};

export const verifyRegistration = async (userId: string, credential: any) => {
  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: () => true,
    expectedOrigin: webauthnConfig.origin,
    expectedRPID: webauthnConfig.rpID,
  } as any);

  if (!verification.verified) {
    throw new Error("Verification failed");
  }

  const { registrationInfo } = verification;
  const parsedCredential = registrationInfo?.credential;

  await repo.createCredential({
    userId,
    credentialId: parsedCredential?.id ?? "",
    publicKey: parsedCredential
      ? Buffer.from(parsedCredential.publicKey).toString("base64")
      : "",
    counter: parsedCredential?.counter ?? 0,
  });

  return { success: true };
};

export const startAuthentication = async () => {
  return generateAuthenticationOptions({
    rpID: webauthnConfig.rpID,
  });
};

export const verifyAuthentication = async (credential: any) => {
  const existing = await repo.findCredentialById(credential.id || "");

  if (!existing) {
    throw new Error("Credential not found");
  }

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: () => true,
    expectedOrigin: webauthnConfig.origin,
    expectedRPID: webauthnConfig.rpID,
    credential: {
      id: existing.credentialId,
      publicKey: Buffer.from(existing.publicKey, "base64"),
      counter: existing.counter,
    },
  } as any);

  if (!verification.verified) {
    throw new Error("Authentication failed");
  }

  const user = await db.user.findUnique({
    where: { id: existing.userId },
  });

  const accessToken = generateAccessToken({
    id: user?.id,
    role: user?.role || "USER",
  });

  const refreshToken = generateRefreshToken({
    id: user?.id,
  });

  return {
    accessToken,
    refreshToken,
    user,
  };
};