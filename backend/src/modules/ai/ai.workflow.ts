/**
 * 🧠 AI WORKFLOW ORCHESTRATOR (MAIN ENGINE)
 * The beating heart of AI orchestration
 * Coordinates: Context -> Signals -> Prompts -> AI -> Decision -> Action
 */

import { gatherAIContext } from "./ai.context";
import { extractSignals } from "./ai.signals";
import { buildPrompt, buildWorkflowPrompts } from "./ai.prompts.enhanced";
import { getAIProvider } from "./ai.provider";
import { makeDecision, storeDecision } from "./ai.decisionEngine";
import { applyLearningToDecision } from "./ai.memory";
import { AITriggerPayload } from "./ai.triggers";
import { calculateScore } from "./scoring.service";
import { db } from "../../config/db";

export interface WorkflowExecutionContext {
  leadId: string;
  userId: string;
  trigger: string;
  contextGathered?: Record<string, unknown>;
  signals?: Record<string, unknown>;
  decision?: Record<string, unknown>;
  executionTime?: number;
}

/**
 * Phase 1: Gather Context
 */
async function phase1_gatherContext(
  workflowContext: WorkflowExecutionContext
): Promise<void> {
  console.log("📍 [PHASE 1] Gathering context...");
  const start = Date.now();

  try {
    const aiContext = await gatherAIContext(workflowContext.leadId);

    if (!aiContext) {
      console.warn("❌ Could not gather context for lead");
      return;
    }

    workflowContext.contextGathered = {
      leadId: aiContext.lead.id,
      company: aiContext.lead.company,
      stage: aiContext.lead.stage,
      value: aiContext.lead.value,
      activities_count: aiContext.activities.length,
      payments_count: aiContext.payments.length
    };

    console.log(`✅ Context gathered in ${Date.now() - start}ms`);
  } catch (error) {
    console.error("❌ Phase 1 error:", error);
    throw error;
  }
}

/**
 * Phase 2: Extract Signals
 */
async function phase2_extractSignals(
  workflowContext: WorkflowExecutionContext
): Promise<void> {
  console.log("📍 [PHASE 2] Extracting signals...");
  const start = Date.now();

  try {
    const context = await gatherAIContext(workflowContext.leadId);
    if (!context) throw new Error("Context required for signals");

    const score = calculateScore(context.lead);
    const signals = await extractSignals(context, score);

    workflowContext.signals = {
      urgency: signals.urgency,
      dealHealth: signals.dealHealth,
      engagement: signals.engagementScore,
      probability: signals.closeProbability,
      inactivity_days: signals.lastActivityGap,
      velocity: signals.dealVelocity
    };

    console.log(`✅ Signals extracted: ${signals.urgency} urgency, ${signals.dealHealth} health`);
    console.log(`   Engagement: ${signals.engagementScore}/100 | Close prob: ${signals.closeProbability}%`);
    console.log(`   Latency: ${Date.now() - start}ms`);
  } catch (error) {
    console.error("❌ Phase 2 error:", error);
    throw error;
  }
}

/**
 * Phase 3: Generate Prompts & Call AI
 */
async function phase3_callAI(
  workflowContext: WorkflowExecutionContext
): Promise<{ analysisOutput: string; decisionOutput: string; latency: number }> {
  console.log("📍 [PHASE 3] Calling AI...");
  const start = Date.now();

  try {
    const context = await gatherAIContext(workflowContext.leadId);
    if (!context) throw new Error("Context required for AI");

    const score = calculateScore(context.lead);
    const signals = await extractSignals(context, score);

    // Build workflow prompts
    const prompts = buildWorkflowPrompts(context, signals);
    const analysisPrompt = prompts.find((p) => p.type === "ANALYSIS");
    const decisionPrompt = prompts.find((p) => p.type === "DECISION");

    if (!analysisPrompt || !decisionPrompt) {
      throw new Error("Missing analysis or decision prompt");
    }

    // Execute against local AI provider (Ollama -> fallback)
    const provider = getAIProvider();
    const [analysisResult, decisionResult] = await Promise.all([
      provider.execute(analysisPrompt.content),
      provider.execute(decisionPrompt.content)
    ]);

    console.log(
      `✅ AI responses received from ${analysisResult.provider} & ${decisionResult.provider}`
    );
    console.log(`   Analysis latency: ${analysisResult.latency}ms`);
    console.log(`   Decision latency: ${decisionResult.latency}ms`);

    return {
      analysisOutput: analysisResult.text,
      decisionOutput: decisionResult.text,
      latency: Date.now() - start
    };
  } catch (error) {
    console.error("❌ Phase 3 error:", error);
    throw error;
  }
}

/**
 * Phase 4: Make Decision
 */
async function phase4_makeDecision(
  workflowContext: WorkflowExecutionContext,
  aiOutput: { analysisOutput: string; decisionOutput: string }
): Promise<void> {
  console.log("📍 [PHASE 4] Making decision...");
  const start = Date.now();

  try {
    const context = await gatherAIContext(workflowContext.leadId);
    if (!context) throw new Error("Context required for decision");

    const score = calculateScore(context.lead);
    const signals = await extractSignals(context, score);

    // Run decision engine (rules + AI)
    const decision = await makeDecision(context, signals, {
      text: aiOutput.decisionOutput,
      confidence: 0.8
    });

    // Apply learned patterns from user's history
    const personalizedDecision = await applyLearningToDecision(
      workflowContext.userId,
      decision
    );

    // Store decision
    const decisionId = await storeDecision(
      workflowContext.userId,
      workflowContext.leadId,
      personalizedDecision,
      0.8
    );

    workflowContext.decision = {
      id: decisionId,
      action: personalizedDecision.action,
      priority: personalizedDecision.priority,
      confidence: personalizedDecision.confidence,
      channel: personalizedDecision.recommendedChannel
    };

    console.log(`✅ Decision made: ${personalizedDecision.action} (${personalizedDecision.priority})`);
    console.log(`   Latency: ${Date.now() - start}ms`);
  } catch (error) {
    console.error("❌ Phase 4 error:", error);
    throw error;
  }
}

/**
 * Phase 5: Auto-Action Engine (Optional)
 */
async function phase5_autoAction(
  workflowContext: WorkflowExecutionContext,
  autoApprove: boolean = false
): Promise<void> {
  if (!autoApprove) {
    console.log("⏭️  Auto-action disabled, awaiting user approval");
    return;
  }

  console.log("📍 [PHASE 5] Executing auto-action...");
  const start = Date.now();

  try {
    // Only auto-execute if confidence is very high
    const decision = workflowContext.decision;
    if (!decision || (decision as any).confidence < 0.85) {
      console.log("⏭️  Confidence too low for auto-execution");
      return;
    }

    console.log(`⚡ Auto-executing: ${(decision as any).action}`);
    console.log(`   Latency: ${Date.now() - start}ms`);
  } catch (error) {
    console.error("❌ Phase 5 error:", error);
  }
}

/**
 * MAIN ORCHESTRATOR FUNCTION
 * This is the entry point for entire AI workflow
 */
export async function runAIWorkflow(
  trigger: AITriggerPayload,
  autoApprove: boolean = false
): Promise<WorkflowExecutionContext> {
  const workflowStart = Date.now();
  const workflowContext: WorkflowExecutionContext = {
    leadId: trigger.leadId,
    userId: trigger.userId,
    trigger: trigger.event
  };

  console.log(`\n🚀 ══════════════════════════════════════════════════════`);
  console.log(`🚀 AI WORKFLOW STARTED`);
  console.log(`🚀 Lead: ${trigger.leadId} | User: ${trigger.userId}`);
  console.log(`🚀 Trigger: ${trigger.event}`);
  console.log(`🚀 ══════════════════════════════════════════════════════\n`);

  try {
    // Execute workflow phases in sequence
    await phase1_gatherContext(workflowContext);
    await phase2_extractSignals(workflowContext);
    const aiOutput = await phase3_callAI(workflowContext);
    await phase4_makeDecision(workflowContext, aiOutput);
    await phase5_autoAction(workflowContext, autoApprove);

    workflowContext.executionTime = Date.now() - workflowStart;

    console.log(`\n✅ ══════════════════════════════════════════════════════`);
    console.log(`✅ AI WORKFLOW COMPLETED SUCCESSFULLY`);
    console.log(`✅ Total execution time: ${workflowContext.executionTime}ms`);
    console.log(`✅ ══════════════════════════════════════════════════════\n`);

    return workflowContext;
  } catch (error) {
    console.error(`\n❌ ══════════════════════════════════════════════════════`);
    console.error(`❌ AI WORKFLOW FAILED`);
    console.error(`❌ Error: ${(error as Error).message}`);
    console.error(`❌ ══════════════════════════════════════════════════════\n`);

    throw error;
  }
}
