import { db } from "../../config/db";
import { Parser } from "json2csv";

export class ExportService {
  async exportCSV(user: any) {
    const leads = await db.lead.findMany({
      where: { userId: user.id }
    });

    const parser = new Parser({
      fields: ["name", "company", "value", "score", "stage"]
    });

    return parser.parse(leads);
  }

  async exportExcel(user: any) {
    const leads = await db.lead.findMany({
      where: { userId: user.id }
    });

    // simple JSON return (frontend can convert to Excel)
    return leads;
  }

  async exportPDF(user: any) {
    const leads = await db.lead.findMany({
      where: { userId: user.id }
    });

    // simple mock (replace with PDF generator later)
    return {
      title: "CRM Export",
      data: leads
    };
  }
}