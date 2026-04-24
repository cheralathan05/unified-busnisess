// auto-generated
// src/modules/security/password.service.ts

export const validatePassword = (password: string) => {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  return true;
};