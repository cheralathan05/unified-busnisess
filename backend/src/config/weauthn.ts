import { env } from "./env";

export const webauthnConfig = {
  rpName: env.WEBAUTHN_RP_NAME,
  rpID: env.WEBAUTHN_RP_ID,
  origin: env.WEBAUTHN_ORIGIN,
  timeout: 60000,
  attestationType: "none",
  authenticatorSelection: {
    residentKey: "preferred",
    userVerification: "preferred",
  },
};