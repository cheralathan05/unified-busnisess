// auto-generated
// src/modules/password-reset/resetPassword.controller.ts

import { Request, Response, NextFunction } from "express";
import * as service from "./passwordReset.service";

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.resetPassword(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};