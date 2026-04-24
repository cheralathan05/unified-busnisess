export interface AIScoreResult {
  score: number;
  priority: "high" | "medium" | "low";
}

export interface AIPredictionResult {
  probability: number;
}

export interface AISentimentResult {
  sentiment: "positive" | "neutral" | "negative";
}

export interface AIStandardResponse {
  summary: string;
  insights: string[];
  nextAction: string;
  confidence: number;
}