// auto-generated
// src/modules/otp/otp.repository.ts

import { db } from "../../config/db";

export const createOtp = async (data: any) => {
  return db.otp.create({ data });
};

export const findOtp = async (email: string, type: string) => {
  return db.otp.findFirst({
    where: { email, type },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteOtp = async (id: string) => {
  return db.otp.delete({ where: { id } });
};

export const incrementAttempts = async (id: string) => {
  return db.otp.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
};