import { LeadRepository } from "./lead.repository";
import { calculateScore } from "../ai/scoring.service";
import { eventBus } from "../../core/events/eventBus";
import { getPagination, getPaginationMeta } from "../../utils/pagination";
import { searchLeads } from "./lead.search";
import { EVENTS } from "../../constants/event.constants";
import { db } from "../../config/db";
import { aiService } from "../ai/ai.service";
import { enrichLeadWithAI } from "../ai/ai.service";

const repo = new LeadRepository();

const canAutoProvisionDevUser =
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

const httpError = (status: number, message: string) => {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const AI_CACHE_TTL_MS = 2 * 60 * 1000;
const aiCache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = aiCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    aiCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function cacheSet<T>(key: string, value: T, ttlMs = AI_CACHE_TTL_MS) {
  aiCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function cleanupCache() {
  if (aiCache.size < 200) return;
  const now = Date.now();
  for (const [key, entry] of aiCache.entries()) {
    if (entry.expiresAt <= now) aiCache.delete(key);
  }
}

async function ensureLeadOwnerUser(user: any) {
  const userId = String(user?.id || "").trim();
  if (!userId) {
    throw httpError(401, "Unauthorized");
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const fallbackEmail = String(user?.email || "").trim();
  if (canAutoProvisionDevUser && fallbackEmail) {
    const existingByEmail = await db.user.findUnique({ where: { email: fallbackEmail } });
    if (existingByEmail) return existingByEmail;

    return db.user.create({
      data: {
        id: userId,
        email: fallbackEmail,
        name: String(user?.name || "Dev User"),
        role: String(user?.role || "USER"),
      },
    });
  }

  throw httpError(404, "USER_NOT_FOUND");
}

function isPlaceholderSummary(summary: unknown): boolean {
  const s = String(summary || "").toLowerCase();
  return !s || s.includes("ai unavailable") || s.includes("summary unavailable");
}

function buildReadableSummary(lead: any): string {
  const stage = String(lead?.stage || "Discovery");
  const company = String(lead?.company || "this company");
  const value = Number(lead?.value || 0);
  const amount = value > 0 ? `$${value.toLocaleString()}` : "not set";
  return `Lead ${lead?.name || "contact"} at ${company} is in ${stage} stage with estimated value ${amount}.`;
}

function normalizeLeadPresentation(lead: any) {
  const fallbackAction = ["Discovery", "Qualified", "New"].includes(String(lead?.stage || ""))
    ? "call"
    : "email";

  return {
    ...lead,
    summary: isPlaceholderSummary(lead?.summary) ? buildReadableSummary(lead) : lead.summary,
    nextAction: !lead?.nextAction || lead.nextAction === "wait" ? fallbackAction : lead.nextAction,
    confidence: typeof lead?.confidence === "number" && lead.confidence > 0 ? lead.confidence : 0.35,
  };
}

export class LeadService {
  private static analyzeAllJobs = new Map<string, {
    jobId: string;
    status: "running" | "completed" | "failed";
    startedAt: string;
    updatedAt: string;
    data?: any;
    error?: string;
  }>();

  private getAnalyzeJobKey(userId: string, jobId: string) {
    return `${userId}:${jobId}`;
  }

  async startAnalyzeAllLeadsJob(user: any) {
    const jobId = `analyze_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();
    const key = this.getAnalyzeJobKey(String(user.id), jobId);

    LeadService.analyzeAllJobs.set(key, {
      jobId,
      status: "running",
      startedAt: nowIso,
      updatedAt: nowIso,
    });

    void (async () => {
      try {
        const data = await this.analyzeAllLeads(user);
        LeadService.analyzeAllJobs.set(key, {
          jobId,
          status: "completed",
          startedAt: nowIso,
          updatedAt: new Date().toISOString(),
          data,
        });
      } catch (error: any) {
        LeadService.analyzeAllJobs.set(key, {
          jobId,
          status: "failed",
          startedAt: nowIso,
          updatedAt: new Date().toISOString(),
          error: error?.message || "analysis_job_failed",
        });
      }
    })();

    return {
      jobId,
      status: "running",
      startedAt: nowIso,
    };
  }

  async getAnalyzeAllLeadsJob(jobId: string, user: any) {
    const key = this.getAnalyzeJobKey(String(user.id), jobId);
    const job = LeadService.analyzeAllJobs.get(key);
    if (!job) {
      throw httpError(404, "analyze_job_not_found");
    }

    return job;
  }

  // ======================
  // CREATE LEAD
  // ======================
  async create(input: any, user: any) {
    const owner = await ensureLeadOwnerUser(user);
    const score = calculateScore(input);
    const stage = String(input?.stage || "Discovery");
    const fallbackAction = ["Discovery", "Qualified", "New"].includes(stage)
      ? "call"
      : "email";

    const seedLead = {
      ...input,
      score,
      userId: owner.id,
      value: typeof input?.value === "number" ? input.value : 0,
      stage,
    };

    const seededSummary = buildReadableSummary(seedLead);

    const email = String(input?.email || "").trim().toLowerCase();
    const phone = String(input?.phone || "").replace(/\D/g, "");
    const company = String(input?.company || "").trim();

    const existingDuplicate = await db.lead.findFirst({
      where: {
        userId: owner.id,
        OR: [
          ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
          ...(phone ? [{ phone: { equals: phone } }] : []),
          ...(company ? [{ company: { equals: company, mode: "insensitive" as const } }] : []),
        ],
      },
    });

    if (existingDuplicate) {
      const mergedValue = Number(existingDuplicate.value || 0) + Number(seedLead.value || 0);
      const updated = await repo.update(existingDuplicate.id, owner.id, {
        value: mergedValue,
        score: Math.max(Number(existingDuplicate.score || 0), Number(seedLead.score || 0)),
        summary: existingDuplicate.summary || seedLead.summary || seededSummary,
        nextAction: existingDuplicate.nextAction || fallbackAction,
        email: existingDuplicate.email || email || null,
        phone: existingDuplicate.phone || (phone ? String(input.phone) : null),
      });

      eventBus.emit(EVENTS.LEAD_UPDATED, updated);
      return normalizeLeadPresentation(updated);
    }

    const lead = await repo.create({
      ...seedLead,
      summary: input?.summary || seededSummary,
      nextAction: input?.nextAction || fallbackAction,
      confidence: typeof input?.confidence === "number" ? input.confidence : 0.35,
      promptVersion: input?.promptVersion || "fallback-v1",
    });

    eventBus.emit(EVENTS.LEAD_CREATED, lead);

    return normalizeLeadPresentation(lead);
  }

  // ======================
  // GET ALL (SEARCH + PAGINATION)
  // ======================
  async getAll(query: any, user: any) {
    // 🔥 Advanced search
    if (
      query.search ||
      query.stage ||
      query.minScore ||
      query.maxScore ||
      query.minValue ||
      query.maxValue
    ) {
      return searchLeads({
        userId: user.id,
        query: query.search,
        stage: query.stage,
        minScore: query.minScore ? Number(query.minScore) : undefined,
        maxScore: query.maxScore ? Number(query.maxScore) : undefined,
        minValue: query.minValue ? Number(query.minValue) : undefined,
        maxValue: query.maxValue ? Number(query.maxValue) : undefined,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10
      });
    }

    // 🔥 Default pagination
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await Promise.all([
      repo.findAll(user.id, { skip, take }),
      repo.count({ userId: user.id })
    ]);

    return {
      data: data.map(normalizeLeadPresentation),
      pagination: getPaginationMeta(total, page, limit)
    };
  }

  // ======================
  // GET ONE
  // ======================
  async getOne(id: string, user: any) {
    const lead = await repo.findById(id, user.id);

    if (!lead) {
      throw new Error("Lead not found");
    }

    return normalizeLeadPresentation(lead);
  }

  async getInsights(id: string, user: any) {
    const lead = await repo.findById(id, user.id);

    if (!lead) {
      throw new Error("Lead not found");
    }

    const normalized = normalizeLeadPresentation(lead);

    return {
      insights: Array.isArray(normalized.insights) ? normalized.insights : [],
      confidence: normalized.confidence ?? 0,
      promptVersion: normalized.promptVersion ?? null,
      priority: normalized.priority || "low"
    };
  }

  async getSummary(id: string, user: any) {
    const lead = await repo.findById(id, user.id);

    if (!lead) {
      throw new Error("Lead not found");
    }

    const normalized = normalizeLeadPresentation(lead);

    return {
      summary: normalized.summary,
      confidence: normalized.confidence ?? 0,
      promptVersion: normalized.promptVersion ?? null
    };
  }

  async getAction(id: string, user: any) {
    const lead = await repo.findById(id, user.id);

    if (!lead) {
      throw new Error("Lead not found");
    }

    const [lastActivities, lastPayments] = await Promise.all([
      db.activity.findMany({
        where: { leadId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { type: true, text: true, createdAt: true }
      }),
      db.payment.findMany({
        where: { leadId: id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { amount: true, status: true, createdAt: true }
      })
    ]);

    const suggestion = await aiService.suggestNextAction({
      lead,
      activities: lastActivities,
      payments: lastPayments
    });

    return {
      nextAction: suggestion.action,
      channel: suggestion.channel,
      message: suggestion.message,
      confidence: suggestion.confidence
    };
  }

  // ======================
  // UPDATE
  // ======================
  async update(id: string, data: any, user: any) {
    const existing = await repo.findById(id, user.id);

    if (!existing) {
      throw new Error("Lead not found");
    }

    // 🔥 Recalculate score based on merged data
    const updatedData = {
      ...existing,
      ...data
    };

    if (
      data.value !== undefined ||
      data.stage !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined
    ) {
      updatedData.score = calculateScore(updatedData);
    }

    const updated = await repo.update(id, user.id, updatedData);

    eventBus.emit(EVENTS.LEAD_UPDATED, updated);

    return updated;
  }

  // ======================
  // DELETE
  // ======================
  async delete(id: string, user: any) {
    const lead = await repo.findById(id, user.id);

    if (!lead) {
      throw new Error("Lead not found");
    }

    await repo.delete(id, user.id);

    eventBus.emit("lead.deleted", {
      id,
      userId: user.id
    });

    return { id };
  }

  async updateStage(id: string, stage: string, user: any) {
    if (!stage || !stage.trim()) {
      throw httpError(400, "stage is required");
    }

    return this.update(id, { stage: stage.trim() }, user);
  }

  async scoreLead(id: string, user: any) {
    cleanupCache();
    const cacheKey = `lead:score:${user.id}:${id}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: {
          ...(cached.meta || {}),
          cache: "hit"
        }
      };
    }

    const startedAt = Date.now();
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const aiScore = await withTimeout(
      aiService.scoreLead(lead),
      5000,
      { score: 0, reasoning: "AI timeout; using deterministic fallback" }
    );
    const heuristicScore = Math.max(20, calculateScore(lead));
    const isFallback = aiScore.score <= 0 || isFallbackText(aiScore.reasoning);
    const score = isFallback ? heuristicScore : aiScore.score;
    await repo.update(id, user.id, { score });

    const response = {
      score,
      reasoning: isFallback
        ? `Lead ${lead.name} (${lead.company}) in ${lead.stage} stage scored ${score}/100 from stage/value/contact signals. Base AI reason: ${aiScore.reasoning}`
        : aiScore.reasoning,
      status: isFallback ? "fallback" : "success",
      meta: {
        source: isFallback ? "heuristic" : "ai",
        cache: "miss",
        processingMs: Date.now() - startedAt
      }
    };

    cacheSet(cacheKey, response);
    return response;
  }

  async predictLead(id: string, input: any, user: any) {
    cleanupCache();
    const inputKey = JSON.stringify(input || {});
    const cacheKey = `lead:predict:${user.id}:${id}:${inputKey}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: {
          ...(cached.meta || {}),
          cache: "hit"
        }
      };
    }

    const startedAt = Date.now();
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const prediction = await withTimeout(
      aiService.predictDeal({
        ...lead,
        ...(input || {})
      }),
      5500,
      {
        probability: 0,
        expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 0,
        riskLevel: "medium" as const,
        riskFactors: [] as string[],
      }
    );

    const fallbackProbability = Math.max(35, Math.min(90, Math.round((lead.score || 50) * 0.9)));
    const useFallback = prediction.confidence <= 0 || prediction.riskFactors.length === 0;

    const response = {
      probability: prediction.probability,
      closeDate: prediction.expectedCloseDate,
      confidence: useFallback ? clampConfidence(lead.confidence, 0.55) : prediction.confidence,
      riskLevel: prediction.riskLevel,
      riskFactors: prediction.riskFactors,
      reasoning: useFallback
        ? `Fallback prediction for ${lead.name} (${lead.company}) based on score ${lead.score}, stage ${lead.stage}, and recent activity trends`
        : "Predicted by local Ollama model",
      status: useFallback ? "fallback" : "success",
      meta: {
        source: useFallback ? "heuristic" : "ai",
        cache: "miss",
        processingMs: Date.now() - startedAt
      }
    };

    if (useFallback) {
      response.probability = fallbackProbability;
      response.riskFactors = response.riskFactors.length > 0
        ? response.riskFactors
        : ["Limited AI confidence; using deterministic lead heuristics"];
    }

    cacheSet(cacheKey, response);
    return response;
  }

  async getIntelligence(id: string, user: any) {
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const [scoreData, predictionData] = await Promise.all([
      this.scoreLead(id, user),
      this.predictLead(id, {}, user),
    ]);

    const refreshed = await repo.findById(id, user.id);
    const liveLead = refreshed || lead;
    const score = Number(scoreData?.score || liveLead.score || 0);
    const stage = String(liveLead.stage || "Discovery").toLowerCase();
    const leadValue = Number(liveLead.value || 0);

    const budgetMatch = leadValue > 0
      ? Math.max(40, Math.min(100, Math.round((leadValue / 300000) * 100)))
      : 40;

    const urgency = ["won", "proposal", "negotiation", "qualified"].includes(stage)
      ? "High"
      : ["discovery", "contacted", "warm"].includes(stage)
        ? "Medium"
        : "Low";

    const industryFit = score >= 85 ? "Strong" : score >= 65 ? "Moderate" : "Developing";
    const communication = score >= 80 ? "Responsive" : score >= 60 ? "Neutral" : "Needs Nurture";
    const decisionPower = score >= 85 ? "High" : score >= 65 ? "Medium" : "Low";

    return {
      score,
      label: score >= 85 ? "Hot Lead" : score >= 65 ? "Warm Lead" : "Cold Lead",
      breakdown: {
        budgetMatch,
        urgency,
        industryFit,
        communication,
        decisionPower,
      },
      prediction: {
        closeProbability: Number(predictionData.probability || 0),
        expectedDealValue: leadValue,
        bestAction: liveLead.nextAction || "Schedule follow-up call",
        closeDate: predictionData.closeDate,
        riskLevel: predictionData.riskLevel,
        riskFactors: predictionData.riskFactors,
      },
      reasoning: scoreData.reasoning,
      confidence: predictionData.confidence,
      provider: "ollama",
      model: process.env.OLLAMA_MODEL_REASONING || process.env.OLLAMA_MODEL || "llama3",
      status: scoreData.status === "fallback" || predictionData.status === "fallback" ? "partial-fallback" : "success",
    };
  }

  async draftEmail(id: string, input: any, user: any) {
    cleanupCache();
    const tone = normalizeTone(input?.tone);
    const contextKey = JSON.stringify({
      leadName: input?.leadName || "",
      context: input?.context || "",
      tone,
    });
    const cacheKey = `lead:email:${user.id}:${id}:${contextKey}`;
    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: {
          ...(cached.meta || {}),
          cache: "hit"
        }
      };
    }

    const startedAt = Date.now();
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const contactName = String(input?.leadName || lead.name || "there");
    const context = String(input?.context || "recent conversation");

    const prompt = [
      "Write a personalized CRM follow-up email.",
      "Return plain text only. No markdown.",
      `Tone: ${tone}`,
      `Lead name: ${contactName}`,
      `Company: ${lead.company}`,
      `Stage: ${lead.stage}`,
      `Context: ${context}`,
      `Score: ${lead.score}`
    ].join("\n");

    const generated = await withTimeout(
      aiService.generateText(prompt),
      6000,
      "AI timeout; using deterministic email fallback"
    );
    const cleanGenerated = generated.trim();
    const fallback = isFallbackText(cleanGenerated);
    const body = cleanGenerated.length > 0 && !fallback
      ? cleanGenerated
      : buildDynamicFallbackEmail(lead, context, tone);

    const response = {
      subject: buildEmailSubject(lead, tone),
      body,
      status: fallback ? "fallback" : "success",
      meta: {
        source: fallback ? "template" : "ai",
        cache: "miss",
        processingMs: Date.now() - startedAt
      }
    };

    cacheSet(cacheKey, response);
    return response;
  }

  async findDuplicateLeadIds(user: any, options?: { purge?: boolean }) {
    const purge = Boolean(options?.purge);

    const leads = await db.lead.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        email: true,
        phone: true,
        company: true,
        value: true,
        score: true,
        confidence: true,
        summary: true,
        nextAction: true,
        insights: true,
        createdAt: true,
      }
    });

    const keyOwner = new Map<string, string>();
    const duplicateToBase = new Map<string, string>();
    const groupsMap = new Map<string, Set<string>>();

    for (const lead of leads) {
      const keys: string[] = [];
      const email = normalizeEmailKey(lead.email);
      const phone = normalizePhoneKey(lead.phone);
      const company = normalizeCompanyKey(lead.company);
      if (email) keys.push(`email:${email}`);
      if (phone) keys.push(`phone:${phone}`);
      if (company) keys.push(`company:${company}`);

      let baseId: string | null = null;
      for (const key of keys) {
        const existing = keyOwner.get(key);
        if (existing) {
          baseId = existing;
          break;
        }
      }

      if (!baseId) {
        for (const key of keys) keyOwner.set(key, lead.id);
        continue;
      }

      duplicateToBase.set(lead.id, baseId);
      const set = groupsMap.get(baseId) || new Set<string>();
      set.add(lead.id);
      groupsMap.set(baseId, set);
      for (const key of keys) keyOwner.set(key, baseId);
    }

    const duplicateIds = Array.from(duplicateToBase.keys());
    const groups = Array.from(groupsMap.entries()).map(([baseId, duplicateSet]) => ({
      baseId,
      duplicates: Array.from(duplicateSet),
    }));

    if (!purge) {
      if (duplicateIds.length > 0) {
        const duplicatedLeads = await db.lead.findMany({
          where: { id: { in: duplicateIds }, userId: user.id },
          select: { id: true, insights: true }
        });

        await Promise.all(
          duplicatedLeads.map((lead) => {
            const existingInsights = normalizeInsightsObject(lead.insights);
            return db.lead.update({
              where: { id: lead.id },
              data: {
                insights: {
                  ...existingInsights,
                  duplicate: true,
                  duplicateDetectedAt: new Date().toISOString()
                }
              }
            });
          })
        );
      }

      return {
        duplicates: duplicateIds,
        groups,
        marked: duplicateIds.length,
        removed: 0,
        mode: "mark"
      };
    }

    let removed = 0;
    for (const group of groups) {
      const base = await db.lead.findFirst({
        where: { id: group.baseId, userId: user.id },
      });
      if (!base) continue;

      let mergedValue = Number(base.value || 0);
      let mergedScore = Number(base.score || 0);
      let mergedConfidence = Number(base.confidence || 0);
      let mergedSummary = String(base.summary || "").trim();
      let mergedNextAction = String(base.nextAction || "").trim();
      let mergedInsights = normalizeInsightsObject(base.insights);

      for (const duplicateId of group.duplicates) {
        const duplicate = await db.lead.findFirst({
          where: { id: duplicateId, userId: user.id },
        });
        if (!duplicate) continue;

        mergedValue += Number(duplicate.value || 0);
        mergedScore = Math.max(mergedScore, Number(duplicate.score || 0));
        mergedConfidence = Math.max(mergedConfidence, Number(duplicate.confidence || 0));
        if (!mergedSummary && duplicate.summary) mergedSummary = String(duplicate.summary);
        if (!mergedNextAction && duplicate.nextAction) mergedNextAction = String(duplicate.nextAction);

        const dupInsights = normalizeInsightsObject(duplicate.insights);
        mergedInsights = {
          ...dupInsights,
          ...mergedInsights,
          duplicateMergedAt: new Date().toISOString(),
          duplicateMergedFrom: Array.from(
            new Set([...(mergedInsights.duplicateMergedFrom || []), duplicateId])
          ),
        };

        await db.activity.updateMany({ where: { leadId: duplicateId }, data: { leadId: group.baseId } });
        await db.payment.updateMany({ where: { leadId: duplicateId }, data: { leadId: group.baseId } });
        await db.invoice.updateMany({ where: { leadId: duplicateId }, data: { leadId: group.baseId } });
        await db.meeting.updateMany({ where: { leadId: duplicateId }, data: { leadId: group.baseId } });
        await db.decision.updateMany({ where: { leadId: duplicateId }, data: { leadId: group.baseId } });
        await db.aILog.updateMany({ where: { leadId: duplicateId }, data: { leadId: group.baseId } });

        await db.lead.delete({ where: { id: duplicateId } });
        removed += 1;
      }

      await db.lead.update({
        where: { id: group.baseId },
        data: {
          value: mergedValue,
          score: mergedScore,
          confidence: mergedConfidence > 0 ? mergedConfidence : base.confidence,
          summary: mergedSummary || base.summary,
          nextAction: mergedNextAction || base.nextAction,
          insights: mergedInsights,
        }
      });
    }

    return {
      duplicates: duplicateIds,
      groups,
      marked: duplicateIds.length,
      removed,
      mode: "purge"
    };
  }

  async reengageNow(id: string, input: any, user: any) {
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const context = String(input?.context || "Lead is inactive or score dropped");

    const [emailDraft, whatsappDraft] = await Promise.all([
      aiService.generateText(
        [
          "Generate a re-engagement email for this lead.",
          "Return plain text only.",
          `Lead: ${lead.name}`,
          `Company: ${lead.company}`,
          `Stage: ${lead.stage}`,
          `Score: ${lead.score}`,
          `Context: ${context}`
        ].join("\n")
      ),
      aiService.generateText(
        [
          "Generate a concise re-engagement WhatsApp message for this lead.",
          "Return plain text only.",
          `Lead: ${lead.name}`,
          `Company: ${lead.company}`,
          `Stage: ${lead.stage}`,
          `Score: ${lead.score}`,
          `Context: ${context}`
        ].join("\n")
      )
    ]);

    return {
      email: emailDraft,
      whatsapp: whatsappDraft
    };
  }

  async analyzeLead(id: string, user: any) {
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const analysis = await enrichLeadWithAI(id);
    const refreshed = await repo.findById(id, user.id);

    return {
      lead: refreshed ? normalizeLeadPresentation(refreshed) : normalizeLeadPresentation(lead),
      analysis,
      provider: "ollama",
      model: process.env.OLLAMA_MODEL_REASONING || process.env.OLLAMA_MODEL || "llama3",
    };
  }

  async analyzeAllLeads(user: any) {
    const startedAt = Date.now();
    const leads = await db.lead.findMany({
      where: { userId: user.id },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    const results: Array<{
      leadId: string;
      success: boolean;
      message?: string;
      lead?: {
        id: string;
        name: string;
        company: string;
        stage: string;
        value: number;
        score: number;
        summary: string | null;
        nextAction: string | null;
        confidence: number | null;
        priority: string;
      };
    }> = [];
    const CONCURRENCY = 2;

    if (leads.length === 0) {
      return {
        total: 0,
        successCount: 0,
        failureCount: 0,
        provider: "ollama",
        model: process.env.OLLAMA_MODEL_REASONING || process.env.OLLAMA_MODEL || "llama3",
        durationMs: Date.now() - startedAt,
        insights: {
          avgScore: 0,
          stageDistribution: { hot: 0, warm: 0, cold: 0 },
          topLeads: [],
        },
        results,
      };
    }

    for (let i = 0; i < leads.length; i += CONCURRENCY) {
      const batch = leads.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (lead) => {
          try {
            await enrichLeadWithAI(lead.id);
            const refreshed = await db.lead.findUnique({
              where: { id: lead.id },
              select: {
                id: true,
                name: true,
                company: true,
                stage: true,
                value: true,
                score: true,
                summary: true,
                nextAction: true,
                confidence: true,
                priority: true,
              }
            });

            if (!refreshed) {
              return { leadId: lead.id, success: false, message: "lead_not_found_after_analysis" };
            }

            return {
              leadId: lead.id,
              success: true,
              lead: refreshed,
            };
          } catch (error: any) {
            return { leadId: lead.id, success: false, message: error?.message || "analysis_failed" };
          }
        })
      );

      results.push(...batchResults);
    }

    const successCount = results.filter((item) => item.success).length;
    const failureCount = results.length - successCount;
    const successfulLeads = results
      .filter((item) => item.success && item.lead)
      .map((item) => item.lead as NonNullable<typeof item.lead>);

    const avgScore = successfulLeads.length
      ? Math.round(successfulLeads.reduce((sum, lead) => sum + Number(lead.score || 0), 0) / successfulLeads.length)
      : 0;

    const stageDistribution = successfulLeads.reduce(
      (acc, lead) => {
        const stage = String(lead.stage || "").toLowerCase();
        if (["won", "proposal", "qualified", "hot"].includes(stage)) {
          acc.hot += 1;
        } else if (["warm", "contacted", "negotiation"].includes(stage)) {
          acc.warm += 1;
        } else {
          acc.cold += 1;
        }
        return acc;
      },
      { hot: 0, warm: 0, cold: 0 }
    );

    const topLeads = [...successfulLeads]
      .sort((a, b) => {
        const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return Number(b.value || 0) - Number(a.value || 0);
      })
      .slice(0, 3);

    return {
      total: results.length,
      successCount,
      failureCount,
      provider: "ollama",
      model: process.env.OLLAMA_MODEL_REASONING || process.env.OLLAMA_MODEL || "llama3",
      durationMs: Date.now() - startedAt,
      insights: {
        avgScore,
        stageDistribution,
        topLeads,
      },
      results,
    };
  }

  async ingestMeetingTranscript(id: string, input: any, user: any) {
    const lead = await repo.findById(id, user.id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const transcript = String(input?.transcript || "").trim();
    if (transcript.length < 40) {
      throw httpError(400, "transcript must be at least 40 characters");
    }

    const meetingTitle = String(input?.meetingTitle || input?.title || "Google Meeting").trim();
    const meetingDate = parseMeetingDate(input?.meetingDate || input?.dateTime || input?.date);
    const attendees = normalizeAttendees(input?.attendees);

    const analysis = await aiService.analyzeMeetingTranscript({
      transcript,
      meetingTitle,
      meetingDate: meetingDate || undefined,
      lead: {
        name: lead.name,
        company: lead.company,
        stage: lead.stage,
        value: lead.value,
        score: lead.score,
      },
    });

    const existingInsights = normalizeInsightsObject(lead.insights);
    const meetingInsight = {
      source: String(input?.source || "google_meet"),
      title: meetingTitle,
      meetingDate,
      attendees,
      processedAt: new Date().toISOString(),
      requirements: analysis.requirements,
      nextAction: analysis.nextAction,
      model: analysis.model,
      provider: "ollama",
      aiSource: analysis.source,
    };

    const updated = await repo.update(id, user.id, {
      summary: analysis.summary || lead.summary || buildReadableSummary(lead),
      nextAction: analysis.nextAction || lead.nextAction || "call",
      confidence: Math.max(Number(lead.confidence || 0.35), Number(analysis.confidence || 0.35)),
      insights: {
        ...existingInsights,
        meeting: meetingInsight,
      },
      promptVersion: analysis.source === "ai" ? "meeting-ollama-v1" : "meeting-fallback-v1",
    });

    await db.activity.create({
      data: {
        userId: user.id,
        leadId: id,
        type: "meeting.analysis",
        text: `${meetingTitle} analyzed with ${analysis.source === "ai" ? "Ollama" : "fallback"} and ${analysis.requirements.length} requirement(s) extracted`,
      },
    });

    eventBus.emit(EVENTS.LEAD_UPDATED, updated);
    eventBus.emit(EVENTS.AI_PROCESSED, {
      leadId: id,
      userId: user.id,
      source: "meeting.transcript",
      provider: "ollama",
      model: analysis.model,
      confidence: analysis.confidence,
    });

    return {
      lead: normalizeLeadPresentation(updated),
      analysis,
    };
  }
}

function isFallbackText(text: unknown): boolean {
  const normalized = String(text || "").toLowerCase();
  return (
    !normalized ||
    normalized.includes("ai unavailable") ||
    normalized.includes("ai timeout") ||
    normalized.includes("fallback-v1") ||
    normalized.includes("\"summary\":\"ai unavailable\"")
  );
}

function clampConfidence(value: unknown, fallback = 0.62) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function normalizeTone(value: unknown): "formal" | "friendly" | "sales" {
  const tone = String(value || "formal").toLowerCase();
  if (tone === "friendly") return "friendly";
  if (tone === "sales") return "sales";
  return "formal";
}

function buildEmailSubject(lead: any, tone: "formal" | "friendly" | "sales") {
  const company = String(lead?.company || "your company");
  if (tone === "sales") return `Proposal to move ${company} forward this week`;
  if (tone === "friendly") return `Quick follow-up for ${company}`;
  return `Follow-up regarding ${company}`;
}

function buildDynamicFallbackEmail(lead: any, context: string, tone: "formal" | "friendly" | "sales") {
  const contactName = String(lead?.name || "there");
  const company = String(lead?.company || "your company");
  const stage = String(lead?.stage || "Discovery");
  const value = Number(lead?.value || 0);
  const valueText = value > 0 ? `$${value.toLocaleString()}` : "this opportunity";

  if (tone === "friendly") {
    return [
      `Hi ${contactName},`,
      "",
      `Thanks again for sharing details about ${company}. I loved the direction for this project.`,
      "",
      `Since we are in ${stage}, I can send a simple plan to move ${valueText} ahead without delays.`,
      "",
      `If you are free this week, we can do a short 15-minute sync and lock next steps.`,
      "",
      "Warm regards"
    ].join("\n");
  }

  if (tone === "sales") {
    return [
      `Hi ${contactName},`,
      "",
      `Great momentum on ${company}. We are in ${stage}, and this is the best time to close scope and start execution quickly.`,
      "",
      `I can share a focused plan to deliver ${valueText} outcomes with clear owners and timeline based on ${context}.`,
      "",
      "If you're available today, I can walk you through the proposal and kickoff path in 15 minutes.",
      "",
      "Best regards"
    ].join("\n");
  }

  return [
    `Hi ${contactName},`,
    "",
    `Great speaking with you about ${company}. Since we are currently in ${stage}, I put together practical next steps to move ${valueText} forward quickly.`,
    "",
    `Based on ${context}, I can share a short execution plan with timeline, owners, and measurable outcomes.`,
    "",
    "Would you prefer a quick 15-minute call this week or a one-page summary by email?",
    "",
    "Best regards"
  ].join("\n");
}

function parseMeetingDate(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeInsightsObject(insights: unknown): Record<string, any> {
  if (insights && typeof insights === "object" && !Array.isArray(insights)) {
    return insights as Record<string, any>;
  }
  return {};
}

function normalizeAttendees(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeEmailKey(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function normalizePhoneKey(phone: unknown): string {
  return String(phone || "").replace(/\D/g, "");
}

function normalizeCompanyKey(company: unknown): string {
  return String(company || "").trim().toLowerCase();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}