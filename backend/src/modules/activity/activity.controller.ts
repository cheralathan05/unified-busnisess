import { Request, Response } from "express";
import { ActivityService } from "./activity.service";

const service = new ActivityService();

export class ActivityController {
  async create(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.create(req.body, user);
    res.json({ success: true, data });
  }

  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getAll(req.query, user);
    res.json({ success: true, data });
  }

  async getByLead(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getByLead(String(req.params.leadId), user);
    res.json({ success: true, data });
  }
}