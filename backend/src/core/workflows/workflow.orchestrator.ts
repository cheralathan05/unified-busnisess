/**
 * 🧠 WORKFLOW ORCHESTRATOR (MASTER ENGINE)
 * Coordinates all systems: Auth → CRM → AI → Events → Analytics
 * This is the "conductor" that orchestrates the entire SaaS system
 */

import { db } from "../../config/db";
import { eventBus } from "../../core/events/eventBus";
import { translateLeadStage, initializeLead } from "./lead.stateMachine";
import { runAIWorkflow } from "../../modules/ai/ai.workflow";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowContext = {
  userId: string;
  action: string;
  module: "AUTH" | "CRM" | "ACTIVITY" | "PAYMENT" | "ANALYTICS" | "AI";
  timestamp: Date;
  metadata: Record<string, unknown>;
  executionTime?: number;
};

export type WorkflowResult = {
  success: boolean;
  module: string;
  action: string;
  data?: unknown;
  events: string[];
  executionTime: number;
  sideEffects: string[];
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW ORCHESTRATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

class WorkflowOrchestrator {
  private workflows: Map<string, Function> = new Map();
  private middlewares: Array<(ctx: WorkflowContext) => Promise<void>> = [];

  /**
   * Register a workflow handler
   */
  registerWorkflow(key: string, handler: Function) {
    this.workflows.set(key, handler);
    console.log(`✅ Workflow registered: ${key}`);
  }

  /**
   * Add middleware that runs before every workflow
   */
  use(middleware: (ctx: WorkflowContext) => Promise<void>) {
    this.middlewares.push(middleware);
  }

  /**
   * Execute a workflow
   */
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    const start = Date.now();
    const workflowKey = `${context.module}:${context.action}`;

    console.log(`\n🚀 ════════════════════════════════════════════════════════`);
    console.log(`🚀 WORKFLOW STARTED: ${workflowKey}`);
    console.log(`🚀 User: ${context.userId}`);
    console.log(`🚀 ════════════════════════════════════════════════════════\n`);

    try {
      // Run middleware
      for (const middleware of this.middlewares) {
        await middleware(context);
      }

      // Get workflow handler
      const handler = this.workflows.get(workflowKey);
      if (!handler) {
        throw new Error(`No workflow registered for ${workflowKey}`);
      }

      // Execute workflow
      const result = await handler(context);

      const executionTime = Date.now() - start;

      console.log(`\n✅ ════════════════════════════════════════════════════════`);
      console.log(`✅ WORKFLOW COMPLETED: ${workflowKey}`);
      console.log(`✅ Execution Time: ${executionTime}ms`);
      console.log(`✅ Events Emitted: ${result.events?.length || 0}`);
      console.log(`✅ Side Effects: ${result.sideEffects?.length || 0}`);
      console.log(`✅ ════════════════════════════════════════════════════════\n`);

      return {
        success: true,
        module: context.module,
        action: context.action,
        data: result.data,
        events: result.events || [],
        executionTime,
        sideEffects: result.sideEffects || []
      };
    } catch (error) {
      const executionTime = Date.now() - start;

      console.error(`\n❌ ════════════════════════════════════════════════════════`);
      console.error(`❌ WORKFLOW FAILED: ${workflowKey}`);
      console.error(`❌ Error: ${(error as Error).message}`);
      console.error(`❌ Execution Time: ${executionTime}ms`);
      console.error(`❌ ════════════════════════════════════════════════════════\n`);

      throw error;
    }
  }
}

// Singleton instance
export const orchestrator = new WorkflowOrchestrator();

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER CORE WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AUTH: USER REGISTRATION
 */
orchestrator.registerWorkflow("AUTH:REGISTER", async (ctx: WorkflowContext) => {
  const { email, password, name } = ctx.metadata as {
    email: string;
    password: string;
    name: string;
  };

  console.log("📍 Workflow: AUTH:REGISTER");

  // Create user
  const user = await db.user.create({
    data: { email, password, name }
  });

  console.log(`✅ User created: ${user.id}`);

  // Emit event
  eventBus.emit("user.registered", { id: user.id, email });

  return {
    data: user,
    events: ["USER_REGISTERED"],
    sideEffects: ["SEND_WELCOME_EMAIL", "INITIALIZE_ORG"]
  };
});

/**
 * AUTH: LOGIN
 */
orchestrator.registerWorkflow("AUTH:LOGIN", async (ctx: WorkflowContext) => {
  const { email, password } = ctx.metadata as {
    email: string;
    password: string;
  };

  console.log("📍 Workflow: AUTH:LOGIN");

  // Find user
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  // NOTE: In production, compare hashed password
  if (user.password !== password) throw new Error("Invalid password");

  console.log(`✅ User logged in: ${user.id}`);

  // Emit event
  eventBus.emit("user.loggedIn", { id: user.id, email });

  return {
    data: { accessToken: "token", refreshToken: "refresh" },
    events: ["USER_LOGGED_IN"],
    sideEffects: ["UPDATE_LAST_LOGIN", "LOG_AUDIT"]
  };
});

/**
 * CRM: CREATE LEAD
 */
orchestrator.registerWorkflow("CRM:CREATE_LEAD", async (ctx: WorkflowContext) => {
  const { name, company, email, value, stage } = ctx.metadata as {
    name: string;
    company: string;
    email: string;
    value: number;
    stage: string;
  };

  console.log("📍 Workflow: CRM:CREATE_LEAD");

  // Initialize lead
  const lead = await db.lead.create({
    data: {
      userId: ctx.userId,
      name,
      company,
      email,
      value,
      stage: translateLeadStage(stage),
      score: initializeLead(stage).score
    }
  });

  console.log(`✅ Lead created: ${lead.id}`);

  // Emit event (triggers AI)
  eventBus.emit("lead.created", { id: lead.id, userId: ctx.userId, value });

  // Trigger AI workflow in background
  await runAIWorkflow({
    event: "lead.created",
    leadId: lead.id,
    userId: ctx.userId
  }).catch((e) => console.warn("AI workflow warning:", e));

  console.log("🤖 AI workflow triggered");

  return {
    data: lead,
    events: ["LEAD_CREATED", "AI_TRIGGERED"],
    sideEffects: ["CALCULATE_SCORE", "GENERATE_SUGGESTION", "UPDATE_ANALYTICS"]
  };
});

/**
 * CRM: UPDATE LEAD
 */
orchestrator.registerWorkflow("CRM:UPDATE_LEAD", async (ctx: WorkflowContext) => {
  const { leadId, updates } = ctx.metadata as {
    leadId: string;
    updates: Record<string, unknown>;
  };

  console.log("📍 Workflow: CRM:UPDATE_LEAD");

  // Verify ownership
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== ctx.userId) {
    throw new Error("Unauthorized");
  }

  // Update lead
  const updated = await db.lead.update({
    where: { id: leadId },
    data: updates
  });

  console.log(`✅ Lead updated: ${leadId}`);

  // Emit event
  eventBus.emit("lead.updated", { id: leadId, userId: ctx.userId, changes: updates });

  // Trigger AI if stage/value changed
  if (updates.stage || updates.value) {
    console.log("🤖 AI re-evaluation triggered");
    eventBus.emit("lead.scoreRecalc", { leadId });
  }

  return {
    data: updated,
    events: ["LEAD_UPDATED"],
    sideEffects: ["RECALCULATE_SCORE", "UPDATE_TIMELINE"]
  };
});

/**
 * ACTIVITY: CREATE ACTIVITY
 */
orchestrator.registerWorkflow("ACTIVITY:CREATE", async (ctx: WorkflowContext) => {
  const { leadId, type, text } = ctx.metadata as {
    leadId: string;
    type: string;
    text?: string;
  };

  console.log("📍 Workflow: ACTIVITY:CREATE");

  // Verify lead ownership
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== ctx.userId) {
    throw new Error("Unauthorized");
  }

  // Create activity
  const activity = await db.activity.create({
    data: {
      userId: ctx.userId,
      leadId,
      type,
      text
    }
  });

  console.log(`✅ Activity created: ${activity.id}`);

  // Emit event (triggers AI engagement update)
  eventBus.emit("activity.created", {
    id: activity.id,
    leadId,
    userId: ctx.userId,
    type
  });

  return {
    data: activity,
    events: ["ACTIVITY_CREATED", "ENGAGEMENT_UPDATED"],
    sideEffects: ["UPDATE_LEAD_ENGAGEMENT", "TRIGGER_AI_ENGAGEMENT_ANALYSIS"]
  };
});

/**
 * PAYMENT: CREATE PAYMENT
 */
orchestrator.registerWorkflow("PAYMENT:CREATE", async (ctx: WorkflowContext) => {
  const { leadId, amount, status } = ctx.metadata as {
    leadId: string;
    amount: number;
    status: string;
  };

  console.log("📍 Workflow: PAYMENT:CREATE");

  // Verify lead ownership
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== ctx.userId) {
    throw new Error("Unauthorized");
  }

  // Create payment
  const payment = await db.payment.create({
    data: {
      userId: ctx.userId,
      leadId,
      amount,
      status
    }
  });

  console.log(`✅ Payment created: ${payment.id} (${amount})`);

  // Emit event (triggers revenue update + close probability)
  eventBus.emit("payment.received", {
    id: payment.id,
    leadId,
    userId: ctx.userId,
    amount
  });

  // Update lead close probability
  eventBus.emit("lead.updateCloseProbability", { leadId, amount });

  return {
    data: payment,
    events: ["PAYMENT_RECEIVED", "REVENUE_UPDATED", "CLOSE_PROBABILITY_UPDATED"],
    sideEffects: ["UPDATE_REVENUE", "UPDATE_FORECAST", "TRIGGER_AI_PROBABILITY"]
  };
});

/**
 * BRAIN: APPROVE SUGGESTION
 */
orchestrator.registerWorkflow("BRAIN:APPROVE", async (ctx: WorkflowContext) => {
  const { decisionId } = ctx.metadata as { decisionId: string };

  console.log("📍 Workflow: BRAIN:APPROVE");

  // Update decision
  const decision = await db.decision.update({
    where: { id: decisionId },
    data: { status: "approved" }
  });

  console.log(`✅ Decision approved: ${decisionId}`);

  // Emit event (triggers learning)
  eventBus.emit("suggestion.approved", {
    decisionId,
    userId: ctx.userId,
    leadId: decision.leadId,
    type: decision.type
  });

  return {
    data: decision,
    events: ["SUGGESTION_APPROVED"],
    sideEffects: ["TRIGGER_ACTION", "STORE_LEARNING", "UPDATE_TRUST_SCORE"]
  };
});

/**
 * DEDUP: MERGE LEADS
 */
orchestrator.registerWorkflow("DEDUP:MERGE", async (ctx: WorkflowContext) => {
  const { baseId, duplicateIds } = ctx.metadata as {
    baseId: string;
    duplicateIds: string[];
  };

  console.log("📍 Workflow: DEDUP:MERGE");

  // Merge leads
  const activities = await db.activity.findMany({
    where: { leadId: { in: duplicateIds } }
  });

  await db.activity.updateMany({
    where: { leadId: { in: duplicateIds } },
    data: { leadId: baseId }
  });

  console.log(`✅ Merged ${duplicateIds.length} duplicates into ${baseId}`);

  // Delete duplicates
  await db.lead.deleteMany({
    where: { id: { in: duplicateIds } }
  });

  // Emit event
  eventBus.emit("leads.merged", {
    baseId,
    mergedCount: duplicateIds.length,
    userId: ctx.userId
  });

  return {
    data: { baseId, mergedCount: duplicateIds.length },
    events: ["LEADS_MERGED"],
    sideEffects: ["CONSOLIDATE_ACTIVITIES", "UPDATE_ANALYTICS", "CLEAN_UP"]
  };
});

/**
 * ANALYTICS: GET DASHBOARD
 */
orchestrator.registerWorkflow(
  "ANALYTICS:DASHBOARD",
  async (ctx: WorkflowContext) => {
    console.log("📍 Workflow: ANALYTICS:DASHBOARD");

    // Fetch all user data
    const [leads, activities, payments] = await Promise.all([
      db.lead.findMany({ where: { userId: ctx.userId } }),
      db.activity.findMany({ where: { userId: ctx.userId } }),
      db.payment.findMany({ where: { userId: ctx.userId } })
    ]);

    // Calculate metrics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgScore = leads.reduce((sum, l) => sum + l.score, 0) / leads.length;
    const hotLeads = leads.filter((l) => l.score > 80).length;
    const atRiskLeads = leads.filter((l) => l.score < 40).length;

    console.log(`✅ Dashboard computed`);

    return {
      data: {
        leads: leads.length,
        totalRevenue,
        avgScore,
        hotLeads,
        atRiskLeads,
        activities: activities.length
      },
      events: ["DASHBOARD_COMPUTED"],
      sideEffects: []
    };
  }
);

export default orchestrator;
