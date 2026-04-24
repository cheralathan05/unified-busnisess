import { Request, Response } from "express";
import { DedupService } from "./dedup.service";

const service = new DedupService();

export class DedupController {
  async find(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.findDuplicates(user);
    res.json({ success: true, data });
  }

  async merge(req: Request, res: Response) {
    const user = (req as any).user;

    const body = req.body || {};
    const baseId = typeof body.baseId === "string" ? body.baseId : "";
    const duplicateIds = Array.isArray(body.duplicateIds)
      ? body.duplicateIds
      : Array.isArray(body.duplicates)
      ? body.duplicates
      : [];

    if (!baseId || duplicateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "baseId and duplicateIds are required"
      });
    }

    const uniqueIds: string[] = Array.from(
      new Set(duplicateIds.map((id) => String(id)))
    );

    if (uniqueIds.includes(baseId)) {
      return res.status(400).json({
        success: false,
        message: "baseId cannot be part of duplicateIds"
      });
    }

    const data = await service.mergeDuplicates(
      baseId,
      uniqueIds,
      user
    );

    res.json({ success: true, data });
  }

  async cleanup(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.cleanupAll(user);
    res.json({ success: true, data });
  }
}