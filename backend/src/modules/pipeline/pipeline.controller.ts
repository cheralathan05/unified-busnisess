import { Request, Response } from "express";
import { PipelineService } from "./pipeline.service";

const service = new PipelineService();

export class PipelineController {
  async getPipeline(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getPipeline(user);

    res.json({ success: true, data });
  }

  async moveLead(req: Request, res: Response) {
    const user = (req as any).user;

    const updated = await service.moveLead(req.body, user);

    res.json({
      success: true,
      data: {
        ...updated,
        leadId: updated.id,
        dealId: updated.id,
        stage: String(updated.stage || "").toLowerCase(),
      },
    });
  }

  async getStage(req: Request, res: Response) {
    const user = (req as any).user;

    const data = await service.getStage(String(req.params.stage), user);

    res.json({ success: true, data });
  }
}