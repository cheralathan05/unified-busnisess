// auto-generated
// src/modules/weauthn/credential.repository.ts

import { db } from "../../config/db";

export const createCredential = async (data: any) => {
  return db.credential.create({ data });
};

export const findCredentialById = async (credentialId: string) => {
  return db.credential.findUnique({
    where: { credentialId },
  });
};