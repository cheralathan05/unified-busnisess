// auto-generated
// src/modules/token/token.repository.ts

import { db } from "../../config/db";

export const createToken = async (data: any) => {
  return db.token.create({ data });
};

export const findToken = async (token: string) => {
  return db.token.findUnique({
    where: { token },
  });
};

export const deleteToken = async (token: string) => {
  return db.token.delete({
    where: { token },
  });
};

export const deleteTokensByUser = async (userId: string) => {
  return db.token.deleteMany({
    where: { userId },
  });
};