import { Request, Response } from "express";
import { LeadService } from "./lead.service";
import { ingestMeetingTranscriptSchema } from "./lead.validation";

const service = new LeadService();

export class LeadController {
  async create(req: Request, res: Response) {
    const user = (req as any).user;
    const lead = await service.create(req.body, user);
    res.json({ success: true, data: lead });
  }

  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    const leads = await service.getAll(req.query, user);
    res.json({ success: true, data: leads });
  }

  async getOne(req: Request, res: Response) {
    const user = (req as any).user;
    const lead = await service.getOne(String(req.params.id), user);
    res.json({ success: true, data: lead });
  }

  async getInsights(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getInsights(String(req.params.id), user);
    res.json({ success: true, data });
  }

  async getSummary(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getSummary(String(req.params.id), user);
    res.json({ success: true, data });
  }

  async getAction(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getAction(String(req.params.id), user);
    res.json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const user = (req as any).user;
    const lead = await service.update(String(req.params.id), req.body, user);
    res.json({ success: true, data: lead });
  }

  async updateStage(req: Request, res: Response) {
    const user = (req as any).user;
    const lead = await service.updateStage(String(req.params.id), String(req.body?.stage || ""), user);
    res.json({ success: true, data: lead });
  }

  async scoreLead(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.scoreLead(String(req.params.id), user);
    res.json({
      success: true,
      status: data.status,
      data,
      meta: data.meta
    });
  }

  async predictLead(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.predictLead(String(req.params.id), req.body, user);
    res.json({
      success: true,
      status: data.status,
      data,
      meta: data.meta
    });
  }

  async getIntelligence(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getIntelligence(String(req.params.id), user);
    res.json({ success: true, data });
  }

  async draftEmail(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.draftEmail(String(req.params.id), req.body, user);
    res.json({
      success: true,
      status: data.status,
      data,
      meta: data.meta
    });
  }

  async deduplicate(req: Request, res: Response) {
    const user = (req as any).user;
    const purge = Boolean(req.body?.purge || req.body?.remove || req.query?.purge === "true");
    const data = await service.findDuplicateLeadIds(user, { purge });
    res.json({ success: true, data });
  }

  async reengageNow(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.reengageNow(String(req.params.id), req.body, user);
    res.json({ success: true, data });
  }

  async analyzeOne(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.analyzeLead(String(req.params.id), user);
    res.json({ success: true, data });
  }

  async analyzeAll(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.startAnalyzeAllLeadsJob(user);
    res.json({ success: true, data });
  }

  async analyzeAllStatus(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await service.getAnalyzeAllLeadsJob(String(req.params.jobId), user);
    res.json({ success: true, data });
  }

  async ingestMeetingTranscript(req: Request, res: Response) {
    const user = (req as any).user;
    const parsed = ingestMeetingTranscriptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.issues,
      });
    }

    const payload = parsed.data;
    const data = await service.ingestMeetingTranscript(String(req.params.id), payload, user);
    res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const user = (req as any).user;
    await service.delete(String(req.params.id), user);
    res.json({ success: true });
  }
}