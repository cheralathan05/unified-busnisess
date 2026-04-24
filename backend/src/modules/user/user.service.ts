// auto-generated
// src/modules/user/user.service.ts

import * as repo from "./user.repository";
import { UpdateUserInput } from "./user.types";
import { emitAuditLog } from "../../events/audit.events";

export const getUserById = async (id: string) => {
  return repo.findUser({ id });
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const user = await repo.updateUser(id, data);

  emitAuditLog({
    userId: id,
    action: "USER_UPDATED",
  });

  return user;
};

export const deleteUser = async (id: string) => {
  await repo.deleteUser(id);

  emitAuditLog({
    userId: id,
    action: "USER_DELETED",
  });

  return { success: true };
};