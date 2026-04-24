// auto-generated
// src/modules/security/fingerprint.service.ts

import crypto from "crypto";

export const generateFingerprint = (req: any) => {
  const data = `${req.headers["user-agent"]}-${req.ip}`;

  return crypto.createHash("sha256").update(data).digest("hex");
};