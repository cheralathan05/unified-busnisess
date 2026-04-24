import { Request, Response } from "express";
import * as service from "./user.service";

const getUserIdFromRequest = (req: any): string | null => {
  return req?.user?.id ?? null;
};

export const getMe = async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await service.getUserById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ user });
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await service.updateUser(userId, req.body);
  return res.status(200).json({ user });
};

export const deleteMe = async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await service.deleteUser(userId);
  return res.status(200).json({ success: true });
};
