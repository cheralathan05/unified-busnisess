// auto-generated
// src/utils/crypto.ts

import crypto from "crypto";

export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashValue = (value: string) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};