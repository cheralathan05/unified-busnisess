import { db } from "../../config/db";
import { getKPI } from "./kpi.service";
import { getHeatmap } from "./heatmap.service";

export class AnalyticsService {
  async getDashboard(user: any) {
    const leads = await db.lead.findMany({
      where: { userId: user.id }
    });

    const kpi = getKPI(leads);
    const heatmap = getHeatmap(leads);

    return {
      totalValue: kpi.totalValue,
      avgScore: kpi.avgScore,
      hotLeads: kpi.hotLeads,
      atRisk: kpi.atRisk,
      kpi,
      heatmap
    };
  }
}