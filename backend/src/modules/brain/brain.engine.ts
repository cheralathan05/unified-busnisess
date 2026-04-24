import { BrainDecisionResult, DecisionContext } from "./brain.types";
import { evaluateBrainPolicy } from "./brain.policy";

export function runBrainEngine(context: DecisionContext): BrainDecisionResult | null {
  return evaluateBrainPolicy(context);
}
