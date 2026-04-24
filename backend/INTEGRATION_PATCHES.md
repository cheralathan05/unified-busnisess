/**
 * 🧠 INTEGRATION PATCH FILES
 * Copy-paste these code snippets into your existing files
 */

// ═════════════════════════════════════════════════════════════════════════
// FILE 1: src/app.ts (or wherever you initialize the app)
// ═════════════════════════════════════════════════════════════════════════

/*
Add these imports at the top of src/app.ts:

import { registerAITriggers } from "./modules/ai/ai.triggers";
import { registerAICronJobs } from "./jobs/aiIntelligence.job";
import { initAIProvider } from "./modules/ai/ai.provider";

Then in your app initialization function, add after other setup (like DB connection):

// Initialize AI orchestration layer
initAIProvider({
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "mistral",
  openaiKey: process.env.OPENAI_API_KEY,
  openaiModel: "gpt-4-turbo",
  timeout: 30000
});

registerAITriggers();
registerAICronJobs();

console.log("🧠 AI Orchestration Layer initialized");
*/

// ═════════════════════════════════════════════════════════════════════════
// FILE 2: src/modules/brain/brain.controller.ts (Feedback wiring)
// ═════════════════════════════════════════════════════════════════════════

/*
Add this import at the top:

import { 
  handleSuggestionApproved, 
  handleSuggestionRejected 
} from "../ai/ai.feedback";

Then find the "approve suggestion" endpoint and add feedback call:

export async function approveSuggestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const decision = await db.decision.findUnique({
      where: { id }
    });
    
    if (!decision) {
      return res.status(404).json({ error: "Decision not found" });
    }
    
    // ➕ ADD THIS LINE:
    await handleSuggestionApproved(id, userId, decision.leadId);
    
    // ... rest of your existing code ...
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Approval error:", error);
    return res.status(500).json({ error: "Failed to approve" });
  }
}

And for rejection endpoint:

export async function rejectSuggestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const decision = await db.decision.findUnique({
      where: { id }
    });
    
    if (!decision) {
      return res.status(404).json({ error: "Decision not found" });
    }
    
    // ➕ ADD THIS LINE:
    await handleSuggestionRejected(id, userId, decision.leadId, reason);
    
    // ... rest of your existing code ...
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Rejection error:", error);
    return res.status(500).json({ error: "Failed to reject" });
  }
}
*/

// ═════════════════════════════════════════════════════════════════════════
// FILE 3: .env.example (Environment configuration)
// ═════════════════════════════════════════════════════════════════════════

/*
Add these to your .env or .env.example:

# ═════════════════════════════════════════════════════════════════════
# AI ORCHESTRATION LAYER CONFIGURATION
# ═════════════════════════════════════════════════════════════════════

# Option A: Use Ollama (local, free)
# Make sure Ollama is running: ollama serve
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
# Other models: deepseek-coder, neural-chat, llama2, etc.

# Option B: Use OpenAI (cloud, more reliable)
# Uncomment if you only want to use OpenAI (or as fallback)
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_MODEL=gpt-4-turbo

# AI Provider timeout (milliseconds)
AI_PROVIDER_TIMEOUT=30000

# Background job intervals (milliseconds)
AI_JOB_INACTIVE_DETECTION=3600000      # 1 hour
AI_JOB_RESCORE=7200000                 # 2 hours
AI_JOB_HIGH_VALUE_SUGGESTIONS=10800000 # 3 hours
AI_JOB_ESCALATION=3600000              # 1 hour
AI_JOB_CLEANUP=86400000                # 24 hours

# Enable/disable specific features
AI_ENABLE_AUTO_ACTION=false            # Auto-execute when confidence > 85%
AI_ENABLE_BACKGROUND_JOBS=true         # Run hourly/daily tasks
AI_ENABLE_LEARNING=true                # Learn from user feedback
*/

// ═════════════════════════════════════════════════════════════════════════
// FILE 4: package.json (Additional scripts - optional but recommended)
// ═════════════════════════════════════════════════════════════════════════

/*
Add these scripts to your package.json "scripts" section:

"ai:test": "npm run test:e2e -- ai.orchestration.test.ts",
"ai:verify": "bash ENABLE_AI_ORCHESTRATION.sh",
"ai:logs": "tail -f logs/ai.log | grep -E '(🧠|📍|✅|❌|⚡|🔔|💾|📊)'",
"ai:jobs:now": "npm run test:e2e -- ai.orchestration.test.ts --reporter=verbose",
*/

// ═════════════════════════════════════════════════════════════════════════
// VERIFICATION CHECKLIST
// ═════════════════════════════════════════════════════════════════════════

/*
After making these changes, run:

1. npm run build
   → Should compile with 0 errors

2. npm run test:e2e -- ai.orchestration.test.ts
   → Should pass all AI orchestration tests

3. Check logs for initialization:
   → Look for "🧠 AI ORCHESTRATION LAYER READY"
   → Look for "✅ Event triggers registered"
   → Look for "✅ AI cron jobs registered"

4. Create a test lead and watch logs:
   → You should see: "🚀 AI WORKFLOW STARTED"
   → Followed by: "📍 [PHASE 1] Gathering context..."
   → And finally: "✅ AI WORKFLOW COMPLETED SUCCESSFULLY"

If you see those logs, the system is working!
*/

export {};
