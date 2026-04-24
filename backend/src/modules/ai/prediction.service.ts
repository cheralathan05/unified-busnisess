export function predictCloseProbability(lead: any): number {
  let probability = 0;

  if (lead.stage === "Negotiation") probability += 40;
  if (lead.stage === "Proposal") probability += 25;

  if (lead.value > 50000) probability += 20;

  if (lead.score > 80) probability += 15;

  return Math.min(probability, 100);
}