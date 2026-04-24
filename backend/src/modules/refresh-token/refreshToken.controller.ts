// auto-generated
// src/modules/refresh-token/refreshToken.controller.ts

import { Request, Response, NextFunction } from "express";
import * as service from "./refreshToken.service";

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.refreshAccessToken(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};