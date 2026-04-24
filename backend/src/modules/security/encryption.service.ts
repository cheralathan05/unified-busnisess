// auto-generated
// src/modules/security/encryption.service.ts

import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const SECRET = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012";

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET), iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decrypt = (text: string) => {
  const [ivHex, encryptedHex] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET),
    iv
  );

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};