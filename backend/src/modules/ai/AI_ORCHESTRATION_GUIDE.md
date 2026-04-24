/**
 * 🚀 AI ORCHESTRATION LAYER - INTEGRATION GUIDE
 * Complete wiring instructions to enable the AI brain
 */

import { registerAITriggers } from "./ai.triggers";
import { registerAICronJobs } from "../jobs/aiIntelligence.job";
import { initAIProvider } from "./ai.provider";

/**
 * STEP 1: Initialize AI Provider
 * Call this in app.ts before any AI operations
 */
export function initializeAILayer(): void {
  console.log("\n🧠 ════════════════════════════════════════════════════════");
  console.log("🧠 INITIALIZING AI ORCHESTRATION LAYER");
  console.log("🧠 ════════════════════════════════════════════════════════\n");

  // Initialize AI provider (Ollama -> OpenAI fallback)
  initAIProvider({
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL || "mistral",
    openaiKey: process.env.OPENAI_API_KEY,
    openaiModel: "gpt-4-turbo",
    timeout: 30000
  });
  console.log("✅ AI Provider initialized");

  // Register event-driven triggers
  registerAITriggers();
  console.log("✅ Event triggers registered");

  // Register cron jobs
  registerAICronJobs();
  console.log("✅ Background jobs registered");

  console.log(
    "\n🧠 ════════════════════════════════════════════════════════"
  );
  console.log("🧠 AI ORCHESTRATION LAYER READY");
  console.log("🧠 System is now: AI-native, autonomous, predictive");
  console.log(
    "🧠 ════════════════════════════════════════════════════════\n"
  );
}

/**
 * STEP 2: Add this to app.ts in initialization
 *
 * Example:
 * --------
 *
 * import { initializeAILayer } from "./modules/ai/ai.init";
 *
 * async function main() {
 *   const app = express();
 *
 *   // ... other setup ...
 *
 *   // Initialize AI braininstitution
 *   initializeAILayer();
 *
 *   app.listen(PORT, () => {
 *     console.log(`Server running on port ${PORT}`);
 *   });
 * }
 */

/**
 * STEP 3: Wire Brain Module Feedback
 * When user approves/rejects decision in Brain module, trigger learning
 *
 * Example brain.controller.ts patch:
 * --------
 *
 * import { handleSuggestionApproved, handleSuggestionRejected } from "../ai/ai.feedback";
 *
 * export async function approveSuggestion(req: Request, res: Response) {
 *   const { id } = req.params;
 *   const userId = req.user?.id;
 *   const decision = await db.decision.findUnique({ where: { id } });
 *
 *   if (!decision) return res.status(404).json({ error: "not found" });
 *
 *   // Trigger learning
 *   await handleSuggestionApproved(id, userId, decision.leadId);
 *
 *   // ... rest of logic ...
 * }
 *
 * export async function rejectSuggestion(req: Request, res: Response) {
 *   const { id } = req.params;
 *   const userId = req.user?.id;
 *   const decision = await db.decision.findUnique({ where: { id } });
 *
 *   if (!decision) return res.status(404).json({ error: "not found" });
 *
 *   // Trigger learning
 *   await handleSuggestionRejected(
 *     id,
 *     userId,
 *     decision.leadId,
 *     req.body.reason
 *   );
 *
 *   // ... rest of logic ...
 * }
 */

/**
 * ARCHITECTURE OVERVIEW
 * ═════════════════════════════════════════════════════════════
 *
 * INPUT LAYER (Triggers)
 * ├─ lead.created
 * ├─ lead.updated
 * ├─ activity.created
 * ├─ payment.received
 * ├─ schedule.created
 * └─ ai.manual_trigger (cron jobs)
 *
 * ANALYSIS LAYER (Signal Extraction)
 * ├─ Context Builder (gatherAIContext)
 * │  ├─ Lead details
 * │  ├─ Activities (last 15)
 * │  └─ Payments (last 15)
 * │
 * └─ Signal Detector (extractSignals)
 *    ├─ Urgency (CRITICAL/HIGH/MEDIUM/LOW)
 *    ├─ Deal Health (EXCELLENT/HEALTHY/AT_RISK/STALLED)
 *    ├─ Engagement Score (0-100)
 *    ├─ Close Probability (0-100)
 *    ├─ Inactivity Gap (days)
 *    └─ Deal Velocity (FAST/NORMAL/SLOW/STUCK)
 *
 * AI REASONING LAYER (Multi-Provider)
 * ├─ Prompt Engine (ai.prompts.enhanced)
 * │  ├─ ANALYSIS prompts
 * │  ├─ DECISION prompts
 * │  ├─ GENERATION prompts
 * │  └─ SUMMARY prompts
 * │
 * └─ AI Provider (ai.provider)
 *    ├─ Ollama (local, fast)
 *    ├─ OpenAI (fallback, reliable)
 *    └─ Safe Defaults (final fallback)
 *
 * DECISION LAYER (Rule + AI)
 * ├─ Rule-based Filtering
 * │  ├─ Escalate if value > $100k + CRITICAL
 * │  ├─ Pause if contacted < 1 day ago
 * │  ├─ Immediate followup if stalled + valuable
 * │  └─ Nurture if low engagement
 * │
 * ├─ Decision Engine (ai.decisionEngine)
 * │  └─ Generates: action, priority, channel, confidence
 * │
 * └─ Learning Application (ai.memory)
 *    └─ Personalizes based on user patterns
 *
 * EXECUTION LAYER (Action & Automation)
 * ├─ Brain Module Integration
 * │  ├─ Stores suggestion as Decision
 * │  ├─ Waits for user approval
 * │  └─ Executes action (email, call, etc)
 * │
 * └─ Auto-Action (high confidence)
 *    ├─ Send emails
 *    ├─ Schedule calls
 *    └─ Create tasks
 *
 * LEARNING LAYER (Feedback Loop)
 * ├─ User Feedback (ai.feedback)
 * │  ├─ Approved → Good suggestion
 * │  ├─ Rejected → Bad suggestion
 * │  └─ Modified → Close but needs tweaks
 * │
 * ├─ Pattern Recognition (ai.memory)
 * │  ├─ Channel preferences
 * │  ├─ Optimal contact times
 * │  ├─ Winning signals
 * │  └─ User behavior analysis
 * │
 * └─ Continuous Improvement
 *    ├─ Suppress low-trust decision types
 *    ├─ Boost high-trust channels
 *    └─ Personalize recommendations
 *
 * BACKGROUND LAYER (Timebase AI)
 * ├─ Hourly: Detect inactive leads
 * ├─ 2-hourly: Rescore all leads
 * ├─ 3-hourly: Suggest high-value deals
 * ├─ Hourly: Escalate critical deals
 * └─ Daily: Cleanup stale suggestions
 *
 * ═════════════════════════════════════════════════════════════
 */

/**
 * FILES CREATED
 * ═════════════════════════════════════════════════════════════
 *
 * Core Orchestration:
 * ✅ src/modules/ai/ai.workflow.ts (Main engine - 5 phases)
 * ✅ src/modules/ai/ai.orchestrator.ts (Existing)
 * ✅ src/modules/ai/ai.triggers.ts (Event-driven entry points)
 *
 * Analysis & Reasoning:
 * ✅ src/modules/ai/ai.signals.ts (Urgency, health, engagement)
 * ✅ src/modules/ai/ai.prompts.enhanced.ts (Prompt engineering)
 * ✅ src/modules/ai/ai.context.ts (Existing context builder)
 *
 * AI Providers:
 * ✅ src/modules/ai/ai.provider.ts (Ollama + OpenAI fallback)
 * ✅ src/modules/ai/ai.decisionEngine.ts (Rules + AI parser)
 *
 * Learning:
 * ✅ src/modules/ai/ai.memory.ts (Pattern recognition)
 * ✅ src/modules/ai/ai.feedback.ts (Approval/rejection learning)
 *
 * Background Jobs:
 * ✅ src/jobs/aiIntelligence.job.ts (5 hourly/daily cron tasks)
 *
 * ═════════════════════════════════════════════════════════════
 */

/**
 * QUICK START
 * ═════════════════════════════════════════════════════════════
 *
 * 1. Uncomment this import in src/app.ts:
 *    import { initializeAILayer } from "./modules/ai/ai.init";
 *
 * 2. Call during app initialization:
 *    initializeAILayer();
 *
 * 3. Make sure Ollama is running (or configure OpenAI API key):
 *    OLLAMA_URL=http://localhost:11434 (default)
 *    OLLAMA_MODEL=mistral (or deepseek-coder, neural-chat, etc)
 *    OPENAI_API_KEY=sk-... (for fallback)
 *
 * 4. Watch logs as system processes leads:
 *    🚀 AI WORKFLOW STARTED
 *    📍 [PHASE 1] Gathering context...
 *    📍 [PHASE 2] Extracting signals...
 *    📍 [PHASE 3] Calling AI...
 *    📍 [PHASE 4] Making decision...
 *    ✅ AI WORKFLOW COMPLETED SUCCESSFULLY
 *
 * ═════════════════════════════════════════════════════════════
 */

export { initializeAILayer };
