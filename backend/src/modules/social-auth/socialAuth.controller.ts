// auto-generated
// src/modules/social-auth/socialAuth.controller.ts

import { Request, Response } from "express";

export const socialSuccess = (req: Request, res: Response) => {
  const data = req.user as any;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const provider = data?.user?.provider === "github" ? "github" : "google";
  const onboardingRequired = !String(data?.user?.companyName || "").trim();
  const user = encodeURIComponent(
    JSON.stringify({
      ...data.user,
      onboardingRequired
    })
  );

  const callbackUrl = `${frontendUrl}/auth/${provider}/callback` +
    `?accessToken=${encodeURIComponent(data.accessToken)}` +
    `&refreshToken=${encodeURIComponent(data.refreshToken)}` +
    `&onboardingRequired=${onboardingRequired ? "1" : "0"}` +
    `&user=${user}`;

  res.redirect(callbackUrl);
};

export const socialFailure = (_req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/login?error=social_login_failed`);
};