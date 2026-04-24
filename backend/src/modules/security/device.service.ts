// auto-generated
// src/modules/security/device.service.ts

export const extractDevice = (req: any) => {
  return {
    userAgent: req.headers["user-agent"] || "unknown",
    ip: req.ip,
  };
};