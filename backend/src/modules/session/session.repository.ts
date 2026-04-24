// auto-generated
// src/modules/session/session.repository.ts

import { db } from "../../config/db";

export const createSession = async (data: any) => {
  return db.session.create({ data });
};

export const findSessionsByUser = async (userId: string) => {
  return db.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteSession = async (id: string) => {
  return db.session.delete({ where: { id } });
};

export const deleteSessionsByUser = async (userId: string) => {
  return db.session.deleteMany({ where: { userId } });
};