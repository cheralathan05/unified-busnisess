// auto-generated
// src/modules/user/user.repository.ts

import { db } from "../../config/db";
import { UpdateUserInput, UserFilter } from "./user.types";

export const findUser = async (filter: UserFilter) => {
  return db.user.findFirst({
    where: {
      id: filter.id,
      email: filter.email,
    },
  });
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  return db.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string) => {
  return db.user.delete({
    where: { id },
  });
};