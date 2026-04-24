export function analyzeSentiment(text?: string) {
  if (!text) return "neutral";

  const positiveWords = ["good", "great", "interested", "yes"];
  const negativeWords = ["no", "delay", "not now", "later"];

  const lower = text.toLowerCase();

  if (positiveWords.some(w => lower.includes(w))) return "positive";
  if (negativeWords.some(w => lower.includes(w))) return "negative";

  return "neutral";
}