import { Request, Response } from "express";
import { StageService } from "./stage.service";

const service = new StageService();

export class StageController {
  async get(req: Request, res: Response) {
    const user = (req as any).user;
    const data = service.getStages(user);
    res.json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const user = (req as any).user;
    const data = service.updateStages(user, req.body.stages);
    res.json({ success: true, data });
  }

  async add(req: Request, res: Response) {
    const user = (req as any).user;
    const data = service.addStage(user, req.body.stage);
    res.json({ success: true, data });
  }

  async remove(req: Request, res: Response) {
    const user = (req as any).user;
    const data = service.removeStage(user, req.body.stage);
    res.json({ success: true, data });
  }
}