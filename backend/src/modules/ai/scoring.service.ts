export function calculateScore(lead: any): number {
  let score = 0;

  if (lead.value > 50000) score += 30;
  if (lead.stage === "Negotiation") score += 25;
  if (lead.stage === "Proposal") score += 15;

  if (lead.email) score += 10;
  if (lead.phone) score += 10;

  return Math.min(score, 100);
}

export function getPriority(score: number) {
  if (score > 80) return "hot";
  if (score > 50) return "warm";
  return "cold";
}