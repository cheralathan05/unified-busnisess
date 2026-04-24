import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

// ======================
// REGISTER
// ======================
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// LOGIN
// ======================
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];

    const result = await authService.login(req.body, ip, userAgent);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// GET CURRENT USER (FIX FOR /me)
// ======================
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    // req.user comes from authMiddleware
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// LOGOUT
// ======================
export const logout = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    // If you store sessions → delete them here
    await authService.logout(user?.id);

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// REFRESH TOKEN
// ======================
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};