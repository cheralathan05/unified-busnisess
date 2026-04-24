// auto-generated
// src/modules/security/ip.service.ts

export const getIP = (req: any) => {
  return req.ip || req.socket.remoteAddress;
};