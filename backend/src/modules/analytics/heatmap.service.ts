export function getHeatmap(leads: any[]) {
  return leads.map(l => ({
    id: l.id,
    company: l.company,
    score: l.score,
    stage: l.stage,
    label:
      l.score > 80
        ? "hot"
        : l.score > 50
        ? "warm"
        : "cold"
  }));
}