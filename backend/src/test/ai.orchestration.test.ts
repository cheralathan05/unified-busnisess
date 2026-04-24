/**
 * 🧪 AI ORCHESTRATION LAYER - COMPREHENSIVE E2E TESTS
 * Tests the complete workflow: trigger -> context -> signals -> AI -> decision -> learning
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "../config/db";
import { runAIWorkflow } from "../modules/ai/ai.workflow";
import { extractSignals } from "../modules/ai/ai.signals";
import { gatherAIContext } from "../modules/ai/ai.context";
import { calculateScore } from "../modules/ai/scoring.service";
import {
  buildPrompt,
  buildWorkflowPrompts
} from "../modules/ai/ai.prompts.enhanced";
import { makeDecision } from "../modules/ai/ai.decisionEngine";
import {
  analyzeChannelPreference,
  analyzeOptimalContactTime,
  identifyWinningSignals
} from "../modules/ai/ai.memory";
import {
  handleSuggestionApproved,
  handleSuggestionRejected,
  getDecisionMetrics,
  getTrustedDecisionTypes
} from "../modules/ai/ai.feedback";

describe("🧠 AI ORCHESTRATION LAYER", () => {
  let testUserId: string;
  let testLeadId: string;

  beforeAll(async () => {
    // Setup: Create test user and lead
    const user = await db.user.create({
      data: {
        email: `aitest-${Date.now()}@test.com`,
        password: "hashed",
        name: "AI Test User"
      }
    });
    testUserId = user.id;

    const lead = await db.lead.create({
      data: {
        userId: user.id,
        name: "Test Lead",
        company: "Acme Corp",
        email: "lead@acme.com",
        stage: "Proposal",
        value: 75000,
        score: 65
      }
    });
    testLeadId = lead.id;

    // Add some activities
    await db.activity.createMany({
      data: [
        {
          userId: user.id,
          leadId: lead.id,
          type: "email",
          text: "Sent proposal"
        },
        {
          userId: user.id,
          leadId: lead.id,
          type: "call",
          text: "Call discussion"
        },
        {
          userId: user.id,
          leadId: lead.id,
          type: "email",
          text: "Followup email"
        }
      ]
    });

    // Add a payment
    await db.payment.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        amount: 10000,
        status: "completed"
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await db.activity.deleteMany({ where: { leadId: testLeadId } });
    await db.payment.deleteMany({ where: { leadId: testLeadId } });
    await db.decision.deleteMany({ where: { leadId: testLeadId } });
    await db.lead.delete({ where: { id: testLeadId } });
    await db.user.delete({ where: { id: testUserId } });
  });

  describe("Phase 1: Context Gathering", () => {
    it("should gather complete context for lead", async () => {
      const context = await gatherAIContext(testLeadId);

      expect(context).toBeDefined();
      expect(context!.lead.id).toBe(testLeadId);
      expect(context!.lead.company).toBe("Acme Corp");
      expect(context!.activities.length).toBeGreaterThan(0);
      expect(context!.payments.length).toBeGreaterThan(0);
    });

    it("should return null for non-existent lead", async () => {
      const context = await gatherAIContext("non-existent-id");
      expect(context).toBeNull();
    });
  });

  describe("Phase 2: Signal Extraction", () => {
    it("should extract all required signals", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      expect(signals.urgency).toMatch(/CRITICAL|HIGH|MEDIUM|LOW/);
      expect(signals.dealHealth).toMatch(/EXCELLENT|HEALTHY|AT_RISK|STALLED/);
      expect(signals.engagementScore).toBeGreaterThanOrEqual(0);
      expect(signals.engagementScore).toBeLessThanOrEqual(100);
      expect(signals.closeProbability).toBeGreaterThanOrEqual(0);
      expect(signals.closeProbability).toBeLessThanOrEqual(100);
      expect(signals.lastActivityGap).toBeGreaterThanOrEqual(0);
      expect(signals.dealVelocity).toMatch(/FAST|NORMAL|SLOW|STUCK/);
    });

    it("should calculate engagement score based on activity recency", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      // With recent activities, engagement should be good
      expect(signals.engagementScore).toBeGreaterThan(40);
    });

    it("should calculate close probability from multiple factors", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      // Lead has activities + payments = decent probability
      expect(signals.closeProbability).toBeGreaterThan(30);
    });
  });

  describe("Phase 3: Prompt Engineering", () => {
    it("should build analysis prompt", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const prompt = buildPrompt("ANALYSIS", context!, signals);

      expect(prompt.type).toBe("ANALYSIS");
      expect(prompt.content).toContain(context!.lead.company);
      expect(prompt.content).toContain(context!.lead.stage);
      expect(prompt.expectedOutput).toBeDefined();
    });

    it("should build decision prompt", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const prompt = buildPrompt("DECISION", context!, signals);

      expect(prompt.type).toBe("DECISION");
      expect(prompt.content).toContain("recommended");
      expect(prompt.expectedOutput).toContain("action");
    });

    it("should build generation prompts for different channels", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const emailPrompt = buildPrompt("GENERATION", context!, signals, "EMAIL");
      const whatsappPrompt = buildPrompt("GENERATION", context!, signals, "WHATSAPP");

      expect(emailPrompt.content).toContain("email");
      expect(whatsappPrompt.content).toContain("WhatsApp");
    });

    it("should build workflow of multiple prompts", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const prompts = buildWorkflowPrompts(context!, signals);

      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts.map((p) => p.type)).toContain("ANALYSIS");
      expect(prompts.map((p) => p.type)).toContain("DECISION");
    });
  });

  describe("Phase 4: Decision Engine", () => {
    it("should make decision from context and signals", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const decision = await makeDecision(context!, signals, {
        text: JSON.stringify({
          action: "SCHEDULE_CALL",
          reason: "Active engagement",
          confidence: 0.85
        }),
        confidence: 0.8
      });

      expect(decision.action).toBeDefined();
      expect(decision.priority).toMatch(/CRITICAL|HIGH|MEDIUM|LOW/);
      expect(decision.recommendedChannel).toMatch(/EMAIL|CALL|WHATSAPP|LINKEDIN/);
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });

    it("should apply rule-based decisions", async () => {
      // Create a high-value critical deal
      const criticalLead = await db.lead.create({
        data: {
          userId: testUserId,
          name: "Critical Lead",
          company: "BigCorp",
          email: "big@corp.com",
          stage: "Proposal",
          value: 150000,
          score: 20 // Low score = critical
        }
      });

      const context = await gatherAIContext(criticalLead.id);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const decision = await makeDecision(context!, signals);

      // High value + critical urgency should trigger escalation rule
      expect(decision.priority).toBe("CRITICAL");

      await db.lead.delete({ where: { id: criticalLead.id } });
    });
  });

  describe("Phase 5: Complete Workflow", () => {
    it("should run complete workflow end-to-end", async () => {
      const result = await runAIWorkflow({
        event: "lead.updated",
        leadId: testLeadId,
        userId: testUserId
      });

      expect(result.leadId).toBe(testLeadId);
      expect(result.userId).toBe(testUserId);
      expect(result.contextGathered).toBeDefined();
      expect(result.signals).toBeDefined();
      expect(result.decision).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it("should create decision record in database", async () => {
      await runAIWorkflow({
        event: "lead.updated",
        leadId: testLeadId,
        userId: testUserId
      });

      const decision = await db.decision.findFirst({
        where: { leadId: testLeadId },
        orderBy: { createdAt: "desc" }
      });

      expect(decision).toBeDefined();
      expect(decision!.status).toBe("suggested");
      expect(decision!.userId).toBe(testUserId);
    });
  });

  describe("Learning Layer", () => {
    it("should store feedback when suggestion approved", async () => {
      // Create a decision first
      const decision = await db.decision.create({
        data: {
          userId: testUserId,
          leadId: testLeadId,
          type: "email_followup",
          input: JSON.stringify({}),
          recommendation: JSON.stringify({}),
          confidence: 0.8,
          status: "suggested"
        }
      });

      await handleSuggestionApproved(decision.id, testUserId, testLeadId);

      const updated = await db.decision.findUnique({
        where: { id: decision.id }
      });

      expect(updated!.status).toBe("approved");
    });

    it("should store feedback when suggestion rejected", async () => {
      const decision = await db.decision.create({
        data: {
          userId: testUserId,
          leadId: testLeadId,
          type: "call_schedule",
          input: JSON.stringify({}),
          recommendation: JSON.stringify({}),
          confidence: 0.8,
          status: "suggested"
        }
      });

      await handleSuggestionRejected(
        decision.id,
        testUserId,
        testLeadId,
        "Not the right time"
      );

      const updated = await db.decision.findUnique({
        where: { id: decision.id }
      });

      expect(updated!.status).toBe("rejected");
    });

    it("should calculate decision metrics", async () => {
      const metrics = await getDecisionMetrics(testUserId);

      expect(metrics.totalSuggestions).toBeGreaterThanOrEqual(0);
      expect(metrics.approved).toBeGreaterThanOrEqual(0);
      expect(metrics.rejected).toBeGreaterThanOrEqual(0);
      expect(metrics.approvalRate).toBeLessThanOrEqual(100);
    });

    it("should identify trusted decision types", async () => {
      const trustedTypes = await getTrustedDecisionTypes(testUserId);

      expect(Array.isArray(trustedTypes)).toBe(true);
    });
  });

  describe("Memory & Patterns", () => {
    it("should analyze channel preferences", async () => {
      const prefs = await analyzeChannelPreference(testUserId);

      expect(prefs).toBeDefined();
      Object.values(prefs).forEach((pref) => {
        expect(pref).toBeGreaterThanOrEqual(0);
        expect(pref).toBeLessThanOrEqual(100);
      });
    });

    it("should identify optimal contact time", async () => {
      const timing = await analyzeOptimalContactTime(testUserId);

      expect(timing.bestDay).toMatch(
        /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/
      );
      expect(timing.bestHour).toBeGreaterThanOrEqual(0);
      expect(timing.bestHour).toBeLessThanOrEqual(23);
    });

    it("should identify winning signals", async () => {
      const signals = await identifyWinningSignals(testUserId);

      expect(signals).toBeDefined();
      expect(signals.avgDealSize).toBeGreaterThanOrEqual(0);
      expect(signals.avgClosureTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing context gracefully", async () => {
      const result = await runAIWorkflow({
        event: "lead.updated",
        leadId: "non-existent",
        userId: testUserId
      });

      // Should not throw, but workflow may fail phases
      expect(result).toBeDefined();
    });

    it("should handle malformed AI output", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);
      const signals = await extractSignals(context!, score);

      const decision = await makeDecision(context!, signals, {
        text: "Not valid JSON",
        confidence: 0.1
      });

      expect(decision).toBeDefined();
      expect(decision.action).toBe("NO_ACTION");
    });
  });

  describe("Performance", () => {
    it("should complete workflow within reasonable time", async () => {
      const start = Date.now();

      await runAIWorkflow({
        event: "lead.updated",
        leadId: testLeadId,
        userId: testUserId
      });

      const duration = Date.now() - start;

      // Should complete within 30 seconds (generous for DB calls)
      expect(duration).toBeLessThan(30000);
    });

    it("should extract signals quickly", async () => {
      const context = await gatherAIContext(testLeadId);
      const score = calculateScore(context!.lead);

      const start = Date.now();
      await extractSignals(context!, score);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
