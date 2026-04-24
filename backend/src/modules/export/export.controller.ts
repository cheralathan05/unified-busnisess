import { Request, Response } from "express";
import { ExportService } from "./export.service";

const service = new ExportService();

export class ExportController {
  async csv(req: Request, res: Response) {
    const user = (req as any).user;

    const data = await service.exportCSV(user);

    res.header("Content-Type", "text/csv");
    res.attachment("leads.csv");

    res.send(data);
  }

  async excel(req: Request, res: Response) {
    const user = (req as any).user;

    const data = await service.exportExcel(user);

    res.json({ success: true, data });
  }

  async pdf(req: Request, res: Response) {
    const user = (req as any).user;

    const data = await service.exportPDF(user);

    res.json({ success: true, data });
  }
}