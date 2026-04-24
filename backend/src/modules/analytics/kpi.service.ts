export function getKPI(leads: any[]) {
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);

  const avgScore =
    leads.length > 0
      ? Math.round(
          leads.reduce((sum, l) => sum + (l.score || 0), 0) /
            leads.length
        )
      : 0;

  const hotLeads = leads.filter(l => l.score > 75).length;

  const wonDeals = leads.filter(l => l.stage === "Closed Won").length;

  const atRisk = leads.filter(
    l => l.score < 40
  ).length;

  return {
    totalValue,
    avgScore,
    hotLeads,
    wonDeals,
    atRisk,
    totalLeads: leads.length
  };
}