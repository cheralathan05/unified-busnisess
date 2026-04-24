// auto-generated
// src/modules/verification/emailVerification.controller.ts

import { Request, Response, NextFunction } from "express";
import * as service from "./emailVerification.service";

export const sendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.sendVerification(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.verifyEmail(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};