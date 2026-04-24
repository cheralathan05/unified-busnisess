// auto-generated
// src/modules/security/hash.service.ts

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashed: string
) => {
  return bcrypt.compare(password, hashed);
};