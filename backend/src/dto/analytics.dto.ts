export class AnalyticsDTO {
  static dashboard(data: any) {
    return {
      kpi: data.kpi,
      heatmap: data.heatmap
    };
  }
}