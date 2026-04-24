// auto-generated
// src/modules/password-reset/forgotPassword.controller.ts

import { Request, Response, NextFunction } from "express";
import * as service from "./passwordReset.service";

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.forgotPassword(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};