import { Request, Response, NextFunction } from "express";
import * as onboardingService from "./onboarding.service";

// ======================
// STEP 1 → SAVE NAME
// ======================
export const start = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    const result = await onboardingService.saveName(user.id, req.body.name, user.email);

    res.json({
      success: true,
      message: "Onboarding step saved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// STEP 2 → BUSINESS INFO
// ======================
export const business = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    const result = await onboardingService.createBusinessSetup(
      user.id,
      {
        companyName: req.body.companyName || req.body.businessName,
        email: req.body.email,
        name: req.body.name,
      },
      user.email
    );

    res.json({
      success: true,
      message: "Onboarding step saved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// COMPAT MODE → /onboarding
// ======================
export const complete = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    const result = await onboardingService.completeOnboarding(user.id, req.body, user.email);

    res.json({
      success: true,
      message: "Onboarding step saved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};