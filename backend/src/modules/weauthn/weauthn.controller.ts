// auto-generated
// src/modules/weauthn/weauthn.controller.ts

import { Request, Response, NextFunction } from "express";
import * as service from "./weauthn.service";

export const startRegistration = async (req: any, res: Response, next: NextFunction) => {
  try {
    const options = await service.startRegistration(req.user.id);
    res.json(options);
  } catch (error) {
    next(error);
  }
};

export const verifyRegistration = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await service.verifyRegistration(
      req.user.id,
      req.body.credential
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const startAuthentication = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const options = await service.startAuthentication();
    res.json(options);
  } catch (error) {
    next(error);
  }
};

export const verifyAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.verifyAuthentication(req.body.credential);
    res.json(result);
  } catch (error) {
    next(error);
  }
};