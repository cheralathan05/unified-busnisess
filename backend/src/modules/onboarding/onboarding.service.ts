import { db } from "../../config/db";
import { BusinessInfoInput } from "./onboarding.types";

const httpError = (status: number, message: string) => {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
};

const canAutoProvisionDevUser =
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

const ensureUserExists = async (userId: string, fallbackEmail?: string) => {
  const existing = await db.user.findUnique({ where: { id: userId } });
  if (existing) {
    return existing;
  }

  if (canAutoProvisionDevUser && fallbackEmail) {
    const existingByEmail = await db.user.findUnique({ where: { email: fallbackEmail } });
    if (existingByEmail) {
      return existingByEmail;
    }

    return db.user.create({
      data: {
        id: userId,
        email: fallbackEmail,
        name: "Dev User",
        role: "USER",
      },
    });
  }

  throw httpError(404, "USER_NOT_FOUND");
};

// ======================
// STEP 1 → SAVE NAME
// ======================
export const saveName = async (userId: string, name: string, email?: string) => {
  const user = await ensureUserExists(userId, email);

  const updated = await db.user.update({
    where: { id: user.id },
    data: { name },
  });

  return {
    userId: updated.id,
    name: updated.name,
  };
};

// ======================
// STEP 2 → BUSINESS SETUP
// ======================
export const createBusinessSetup = async (
  userId: string,
  input: BusinessInfoInput,
  email?: string
) => {
  const userRecord = await ensureUserExists(userId, email);

  const user = await db.user.update({
    where: { id: userRecord.id },
    data: {
      companyName: input.companyName,
    },
  });

  // 🔥 FUTURE AI CONFIG (placeholder)
  // - create default pipeline
  // - create default stages
  // - initialize analytics

  return {
    userId: user.id,
    companyName: user.companyName,
  };
};

export const completeOnboarding = async (
  userId: string,
  input: { name?: string; companyName?: string },
  email?: string
) => {
  const userRecord = await ensureUserExists(userId, email);

  const user = await db.user.update({
    where: { id: userRecord.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.companyName ? { companyName: input.companyName } : {}),
    },
  });

  return {
    userId: user.id,
    name: user.name,
    companyName: user.companyName,
  };
};