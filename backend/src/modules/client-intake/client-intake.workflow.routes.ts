import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Router, Request, Response } from "express";
import { db } from "../../config/db";
import { authMiddleware } from "../../middleware/auth.middleware";
import { EmailService } from "../communication/email.service";
import { logAudit } from "../audit/audit.service";
import { getAIProvider } from "../ai/ai.provider";

const router = Router();
const emailService = new EmailService();
const LOCK_PASSWORD_LENGTH = 4;
const MAX_UNLOCK_ATTEMPTS = 3;
const UNLOCK_BLOCK_MINUTES = 5;

let tablesEnsured = false;

type IntakeFile = {
  name: string;
  size?: number;
  type?: string;
  previewUrl?: string;
  isImage?: boolean;
};

type IntakePayload = {
  leadId?: string | number;
  businessName?: string;
  industry?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  features?: string[];
  ideaDescription?: string;
  budget?: number;
  deadline?: string;
  selectedPackage?: string;
  uploadedFiles?: IntakeFile[];
  meetingSlot?: string;
  estimatedPrice?: number;
};

type LockRequestPayload = {
  password?: unknown;
  confirmPassword?: unknown;
  override?: unknown;
  intake?: IntakePayload;
};

function normalizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function computeCompletion(intake: IntakePayload, hasMeeting: boolean) {
  const checks = {
    clientInfo: Boolean(intake.contactName && intake.email && intake.phone),
    requirements: Boolean(intake.ideaDescription && normalizeArray(intake.features, []).length > 0),
    budget: Boolean(toSafeNumber(intake.budget) > 0),
    files: normalizeArray(intake.uploadedFiles, []).length > 0,
    meeting: hasMeeting || Boolean(intake.meetingSlot),
  };

  const completed = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    percent: Math.round((completed / 5) * 100),
  };
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]) as T;
    return parsed;
  } catch {
    return fallback;
  }
}

function fallbackSuggestions(projectType: string, currentFeatures: string[]) {
  const suggestions: Record<string, string[]> = {
    Website: ["Dashboard", "Admin Panel", "Analytics", "API Integration"],
    App: ["Login/Auth", "Mobile Responsive", "Notifications", "Analytics"],
    AI: ["AI Assistant", "API Integration", "Dashboard", "Analytics"],
    CRM: ["Login/Auth", "Dashboard", "Admin Panel", "API Integration"],
    Other: ["Login/Auth", "Dashboard", "Analytics", "Mobile Responsive"],
  };

  const recommended = (suggestions[projectType] || suggestions.Other)
    .filter((item) => !currentFeatures.includes(item))
    .slice(0, 4);

  return {
    suggestions: recommended,
    reasoning: `Suggested based on ${projectType} scope and selected features.`,
  };
}

function fallbackAnalysis(projectType: string, featureCount: number, budget: number, daysToDeadline: number) {
  let score = 50;
  if (featureCount > 0) score += 15;
  if (budget > 100000) score += 15;
  if (daysToDeadline > 30) score += 10;

  return {
    completionScore: Math.min(100, score),
    insights: [
      `Good foundation for a ${projectType} project`,
      "Scope and delivery context captured",
      featureCount > 0 ? "Feature selection is clear" : "Add more features for precision",
    ],
    risks: daysToDeadline < 21 ? ["Tight timeline may require phased delivery"] : ["Standard delivery risks apply"],
    recommendations: ["Run discovery with stakeholders", "Freeze scope before build start"],
  };
}

function fallbackSummary(businessName: string, projectType: string, features: string[]) {
  const preview = features.length > 0 ? ` featuring ${features.slice(0, 3).join(", ")}` : "";
  return `${businessName} is planning a ${projectType} product${preview} to accelerate business growth and user outcomes. The initiative is positioned as a high-impact delivery with clear execution priorities.`;
}

function buildRequirementAnalysis(intake: IntakePayload) {
  const features = normalizeArray(intake.features, []);
  const summary = `${toSafeString(intake.businessName, "Client")} needs a ${toSafeString(intake.projectType, "digital")} solution focused on ${
    features.length ? features.join(", ") : "core business goals"
  }.`;

  const modules = [
    "Discovery & UX",
    "Frontend Experience",
    "Backend Services",
    features.some((item) => /payment/i.test(item)) ? "Payment Integration" : "3rd Party Integrations",
    "QA & Launch",
  ];

  const structuredItems = features.map((feature) => {
    const lower = feature.toLowerCase();
    const bucket = /dashboard|landing|responsive|ui|frontend/.test(lower)
      ? "Frontend"
      : /api|auth|admin|backend|database/.test(lower)
      ? "Backend"
      : /payment|gateway|integration|webhook/.test(lower)
      ? "API"
      : "General";

    return {
      label: `[${bucket}] ${feature}`,
      bucket,
      text: feature,
    };
  });

  const analysis = {
    budget: toSafeNumber(intake.budget, toSafeNumber(intake.estimatedPrice)),
    timeline: toSafeString(intake.deadline, "To be finalized"),
    package: toSafeString(intake.selectedPackage, "growth"),
    risk: structuredItems.length >= 6 ? "medium" : "low",
  };

  return {
    summary,
    features,
    modules,
    analysis,
    items: structuredItems,
  };
}

function isAdminRole(role: unknown) {
  return String(role || "").toLowerCase() === "admin";
}

function getRequestActor(req: Request) {
  const user = (req as any).user || {};
  return {
    id: toSafeString(user.id, "system") || "system",
    role: String(user.role || "USER"),
    email: toSafeString(user.email, ""),
    isAdmin: isAdminRole(user.role),
  };
}

function toJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeLockIssues(intake: any, requirement: any) {
  const features = normalizeArray<string>(intake?.features, []);
  const modules = normalizeArray<string>(requirement?.modules, []);
  const summary = toSafeString(requirement?.summary, "").toLowerCase();
  const analysisText = JSON.stringify(requirement?.analysis || {}).toLowerCase();
  const scopeText = `${features.join(" ")} ${modules.join(" ")} ${summary} ${analysisText}`;

  const missing: string[] = [];
  const completion = computeCompletion(intake || {}, Boolean(intake?.meeting_slot));

  if (!completion.checks.clientInfo) missing.push("Client contact details");
  if (!completion.checks.requirements) missing.push("Requirements scope");
  if (!completion.checks.budget) missing.push("Budget details");
  if (!completion.checks.files) missing.push("Uploaded assets");
  if (!completion.checks.meeting) missing.push("Meeting context");
  if (!/api|integration|webhook|payment/.test(scopeText)) missing.push("API details");
  if (!modules.length) missing.push("Modules and user flow");

  const normalizedMissing = Array.from(new Set(missing));
  const lockScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completion.percent +
          (features.length ? 8 : 0) +
          (modules.length ? 8 : 0) +
          (/api|integration|webhook|payment/.test(scopeText) ? 12 : -10) -
          normalizedMissing.length * 7,
      ),
    ),
  );

  return {
    missing: normalizedMissing,
    lockScore,
    readyToLock: normalizedMissing.length === 0 && lockScore >= 80,
    completionPercent: completion.percent,
  };
}

function buildRequirementLockSnapshot(row: any, intake: any, meetingPresent: boolean) {
  const validation = normalizeLockIssues(intake, row);

  return {
    locked: Boolean(row?.locked),
    lockedAt: row?.locked_at || null,
    lockedBy: row?.locked_by || null,
    lockedByRole: row?.locked_by_role || null,
    lockedVersion: row?.lock_version ?? row?.version ?? 1,
    lockPasswordSet: Boolean(row?.lock_password_hash),
    lockScore: row?.lock_score ?? validation.lockScore,
    lockMissing: toJsonArray(row?.lock_missing).length ? toJsonArray(row?.lock_missing) : validation.missing,
    readyToLock: row?.locked ? true : validation.readyToLock,
    completionPercent: validation.completionPercent,
    unlockFailedAttempts: Number(row?.unlock_failed_attempts || 0),
    unlockBlockedUntil: row?.unlock_blocked_until || null,
    meetingPresent,
  };
}

async function ensureTables() {
  if (tablesEnsured) return;

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS client_links (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      sent_to_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS intake_submissions (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL UNIQUE,
      business_name TEXT,
      industry TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      project_type TEXT,
      features JSONB NOT NULL DEFAULT '[]'::jsonb,
      description TEXT,
      budget DOUBLE PRECISION,
      timeline TEXT,
      package TEXT,
      files JSONB NOT NULL DEFAULT '[]'::jsonb,
      meeting_slot TEXT,
      source TEXT NOT NULL DEFAULT 'client_link_form',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      features JSONB NOT NULL DEFAULT '[]'::jsonb,
      modules JSONB NOT NULL DEFAULT '[]'::jsonb,
      analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      locked BOOLEAN NOT NULL DEFAULT false,
      lock_password_hash TEXT,
      locked_at TIMESTAMPTZ,
      locked_by TEXT,
      locked_by_role TEXT,
      lock_version INTEGER,
      lock_score INTEGER,
      lock_missing JSONB NOT NULL DEFAULT '[]'::jsonb,
      unlock_failed_attempts INTEGER NOT NULL DEFAULT 0,
      unlock_blocked_until TIMESTAMPTZ,
      unlocked_at TIMESTAMPTZ,
      unlocked_by TEXT,
      unlocked_by_role TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS lock_password_hash TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS locked_by TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS locked_by_role TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS lock_version INTEGER;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS lock_score INTEGER;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS lock_missing JSONB NOT NULL DEFAULT '[]'::jsonb;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS unlock_failed_attempts INTEGER NOT NULL DEFAULT 0;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS unlock_blocked_until TIMESTAMPTZ;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS unlocked_by TEXT;`);
  await db.$executeRawUnsafe(`ALTER TABLE requirements ADD COLUMN IF NOT EXISTS unlocked_by_role TEXT;`);

  tablesEnsured = true;
}

router.get("/intake/ai/health", async (_req: Request, res: Response) => {
  try {
    const provider = getAIProvider();
    const result = await provider.execute("Respond with: OK");
    const isLive = result.provider === "ollama";

    return res.json({
      success: true,
      data: {
        available: isLive,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latency,
      },
    });
  } catch {
    return res.json({
      success: true,
      data: {
        available: false,
        provider: "fallback",
        model: "local-fallback",
        latencyMs: 0,
      },
    });
  }
});

router.post("/intake/ai/suggest", async (req: Request, res: Response) => {
  const projectType = toSafeString(req.body?.projectType, "Other");
  const description = toSafeString(req.body?.description);
  const currentFeatures = normalizeArray<string>(req.body?.currentFeatures, []);

  const fallback = fallbackSuggestions(projectType, currentFeatures);

  try {
    const provider = getAIProvider();
    const prompt = `You are a product strategy expert.\nProject type: ${projectType}\nDescription: ${description}\nCurrent features: ${currentFeatures.join(", ") || "None"}\nReturn ONLY JSON: {\"suggestions\":[...],\"reasoning\":\"...\"}. Suggest 2-4 features not already present.`;
    const result = await provider.execute(prompt);
    const parsed = safeJsonParse<{ suggestions?: string[]; reasoning?: string }>(result.text, {});

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item) => typeof item === "string" && !currentFeatures.includes(item)).slice(0, 4)
      : fallback.suggestions;

    return res.json({
      success: true,
      data: {
        suggestions,
        reasoning: typeof parsed.reasoning === "string" && parsed.reasoning.trim()
          ? parsed.reasoning
          : fallback.reasoning,
      },
    });
  } catch {
    return res.json({ success: true, data: fallback });
  }
});

router.post("/intake/ai/analyze", async (req: Request, res: Response) => {
  const projectType = toSafeString(req.body?.projectType, "Other");
  const features = normalizeArray<string>(req.body?.features, []);
  const budget = toSafeNumber(req.body?.budget, 0);
  const deadline = toSafeString(req.body?.deadline);
  const description = toSafeString(req.body?.description);

  const daysToDeadline = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const fallback = fallbackAnalysis(projectType, features.length, budget, daysToDeadline);

  try {
    const provider = getAIProvider();
    const prompt = `You are a project delivery expert.\nType: ${projectType}\nFeatures: ${features.join(", ") || "None"}\nBudget: ${budget}\nDays to deadline: ${daysToDeadline}\nDescription: ${description}\nReturn ONLY JSON with keys completionScore, insights, risks, recommendations.`;
    const result = await provider.execute(prompt);
    const parsed = safeJsonParse<{
      completionScore?: number;
      insights?: string[];
      risks?: string[];
      recommendations?: string[];
    }>(result.text, {});

    return res.json({
      success: true,
      data: {
        completionScore: Math.min(100, Math.max(0, Number(parsed.completionScore ?? fallback.completionScore))),
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : fallback.insights,
        risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 2) : fallback.risks,
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.slice(0, 2)
          : fallback.recommendations,
      },
    });
  } catch {
    return res.json({ success: true, data: fallback });
  }
});

router.post("/intake/ai/summary", async (req: Request, res: Response) => {
  const businessName = toSafeString(req.body?.businessName, "This business");
  const projectType = toSafeString(req.body?.projectType, "digital");
  const features = normalizeArray<string>(req.body?.features, []);
  const targetAudience = toSafeString(req.body?.targetAudience);
  const budget = toSafeNumber(req.body?.budget, 0);
  const selectedPackage = toSafeString(req.body?.selectedPackage);
  const priority = toSafeString(req.body?.priority);
  const description = toSafeString(req.body?.description);

  const fallback = fallbackSummary(businessName, projectType, features);

  try {
    const provider = getAIProvider();
    const prompt = `Write a concise executive summary in 2-3 sentences.\nBusiness: ${businessName}\nProject type: ${projectType}\nFeatures: ${features.join(", ")}\nAudience: ${targetAudience}\nBudget: ${budget}\nPackage: ${selectedPackage}\nPriority: ${priority}\nDescription: ${description}`;
    const result = await provider.execute(prompt);
    const text = String(result.text || "").trim();

    return res.json({
      success: true,
      data: {
        summary: text || fallback,
      },
    });
  } catch {
    return res.json({
      success: true,
      data: {
        summary: fallback,
      },
    });
  }
});

router.post("/intake/ai/refine-description", async (req: Request, res: Response) => {
  const businessName = toSafeString(req.body?.businessName, "the client");
  const projectType = toSafeString(req.body?.projectType, "digital");
  const goal = toSafeString(req.body?.goal, "business growth");
  const description = toSafeString(req.body?.description);
  const userRoles = normalizeArray<string>(req.body?.userRoles, []).slice(0, 8);
  const modules = normalizeArray<string>(req.body?.modules, []).slice(0, 12);
  const features = normalizeArray<string>(req.body?.features, []).slice(0, 16);

  if (!description) {
    return res.status(400).json({ success: false, error: "description is required" });
  }

  try {
    const provider = getAIProvider();
    const prompt = [
      "You are a senior product requirements analyst.",
      "Rewrite the project description into a stronger, execution-ready scope.",
      "Keep it concise but concrete.",
      "Return plain text only.",
      "",
      `Business: ${businessName}`,
      `Project type: ${projectType}`,
      `Goal: ${goal}`,
      `User roles: ${userRoles.join(", ") || "Not specified"}`,
      `Modules/pages: ${modules.join(", ") || "Not specified"}`,
      `Core capabilities: ${features.join(", ") || "Not specified"}`,
      `Current description: ${description}`,
      "",
      "Output format:",
      "First keep the original intent in 1 sentence.",
      "Then add a paragraph starting with 'Refined Scope:' and include objectives, user roles, modules/pages, API/integration expectations, milestones, and measurable launch KPIs.",
    ].join("\n");

    const result = await provider.execute(prompt);
    if (result.provider !== "ollama") {
      return res.status(503).json({ success: false, error: "Real AI is unavailable. Start Ollama and try again." });
    }

    const refined = String(result.text || "").trim();
    if (!refined) {
      return res.status(502).json({ success: false, error: "AI returned an empty response" });
    }

    return res.json({
      success: true,
      data: {
        description: refined,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to refine description with AI" });
  }
});

router.post("/client-link/send", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.body?.leadId);
    const leadName = toSafeString(req.body?.name, "Client");
    const leadCompany = toSafeString(req.body?.company, "your company");
    const leadEmail = toSafeString(req.body?.email);

    if (!leadId) {
      return res.status(400).json({ success: false, error: "leadId is required" });
    }

    const token = randomBytes(18).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const linkId = `link-${leadId}-${Date.now()}`;
    const intakeUrl = `${toSafeString(process.env.WEBAUTHN_ORIGIN, "http://localhost:3000")}/client/intake/${encodeURIComponent(leadId)}?token=${encodeURIComponent(token)}`;

    await db.$executeRawUnsafe(
      `
      INSERT INTO client_links (id, lead_id, token, status, expires_at, sent_to_email, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $6)
      `,
      linkId,
      leadId,
      token,
      expiresAt,
      leadEmail || null,
      now,
    );

    if (leadEmail) {
      await emailService.send({
        to: leadEmail,
        subject: "Complete your project details",
        text: `Hi ${leadName},\n\nPlease fill your project requirements:\n${intakeUrl}\n\n- Takes 3 mins\n- Helps us build your project faster\n\nThanks,\n${leadCompany}`,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        leadId,
        token,
        link: intakeUrl,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("send client link error:", error);
    return res.status(500).json({ success: false, error: "Failed to send client link" });
  }
});

router.post("/client-link/resend", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.body?.leadId);
    const leadName = toSafeString(req.body?.name, "Client");
    const leadCompany = toSafeString(req.body?.company, "your company");
    const leadEmail = toSafeString(req.body?.email);

    if (!leadId) {
      return res.status(400).json({ success: false, error: "leadId is required" });
    }

    const token = randomBytes(18).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const linkId = `link-${leadId}-${Date.now()}`;
    const intakeUrl = `${toSafeString(process.env.WEBAUTHN_ORIGIN, "http://localhost:3000")}/client/intake/${encodeURIComponent(leadId)}?token=${encodeURIComponent(token)}`;

    await db.$executeRawUnsafe(
      `
      INSERT INTO client_links (id, lead_id, token, status, expires_at, sent_to_email, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $6)
      `,
      linkId,
      leadId,
      token,
      expiresAt,
      leadEmail || null,
      now,
    );

    if (leadEmail) {
      await emailService.send({
        to: leadEmail,
        subject: "Complete your project details",
        text: `Hi ${leadName},\n\nPlease fill your project requirements:\n${intakeUrl}\n\n- Takes 3 mins\n- Helps us build your project faster\n\nThanks,\n${leadCompany}`,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        leadId,
        token,
        link: intakeUrl,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("resend client link error:", error);
    return res.status(500).json({ success: false, error: "Failed to resend client link" });
  }
});

router.get("/client-link/:token", async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const token = toSafeString(req.params.token);
    if (!token) {
      return res.status(400).json({ success: false, error: "token is required" });
    }

    const rows = await db.$queryRawUnsafe<any[]>(
      `
      SELECT id, lead_id, token, status, expires_at, sent_to_email, created_at
      FROM client_links
      WHERE token = $1
      LIMIT 1
      `,
      token,
    );

    const link = rows[0];
    if (!link) {
      return res.status(404).json({ success: false, error: "Client link not found" });
    }

    const isExpired = new Date(link.expires_at).getTime() < Date.now();
    return res.json({
      success: true,
      data: {
        id: String(link.id),
        leadId: String(link.lead_id),
        token: String(link.token),
        status: isExpired ? "expired" : String(link.status),
        expiresAt: new Date(link.expires_at).toISOString(),
        email: link.sent_to_email ? String(link.sent_to_email) : "",
      },
    });
  } catch (error) {
    console.error("get client link error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch client link" });
  }
});

router.post("/intake/submit", async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const token = toSafeString(req.body?.token);
    const bodyLeadId = toSafeString(req.body?.leadId);

    if (!token && !bodyLeadId) {
      return res.status(400).json({ success: false, error: "token or leadId is required" });
    }

    let leadId = bodyLeadId;
    if (token) {
      const linkRows = await db.$queryRawUnsafe<any[]>(
        `SELECT lead_id, status, expires_at FROM client_links WHERE token = $1 LIMIT 1`,
        token,
      );

      const link = linkRows[0];
      if (!link) {
        return res.status(404).json({ success: false, error: "Invalid intake token" });
      }

      if (new Date(link.expires_at).getTime() < Date.now()) {
        return res.status(410).json({ success: false, error: "Intake link has expired" });
      }

      leadId = String(link.lead_id);
    }

    if (!leadId) {
      return res.status(400).json({ success: false, error: "leadId is required" });
    }

    const intake: IntakePayload = {
      leadId,
      businessName: req.body?.businessName,
      industry: req.body?.industry,
      contactName: req.body?.contactName,
      email: req.body?.email,
      phone: req.body?.phone,
      projectType: req.body?.projectType,
      features: normalizeArray(req.body?.features, []),
      ideaDescription: req.body?.ideaDescription,
      budget: toSafeNumber(req.body?.budget),
      deadline: req.body?.deadline,
      selectedPackage: req.body?.selectedPackage,
      uploadedFiles: normalizeArray(req.body?.uploadedFiles, []),
      meetingSlot: req.body?.meetingSlot,
      estimatedPrice: toSafeNumber(req.body?.estimatedPrice),
    };

    const now = new Date();
    const intakeId = `intake-${leadId}`;

    await db.$executeRawUnsafe(
      `
      INSERT INTO intake_submissions (
        id, lead_id, business_name, industry, contact_name, email, phone, project_type, features,
        description, budget, timeline, package, files, meeting_slot, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
        $10, $11, $12, $13, $14::jsonb, $15, $16
      )
      ON CONFLICT (lead_id)
      DO UPDATE SET
        business_name = EXCLUDED.business_name,
        industry = EXCLUDED.industry,
        contact_name = EXCLUDED.contact_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        project_type = EXCLUDED.project_type,
        features = EXCLUDED.features,
        description = EXCLUDED.description,
        budget = EXCLUDED.budget,
        timeline = EXCLUDED.timeline,
        package = EXCLUDED.package,
        files = EXCLUDED.files,
        meeting_slot = EXCLUDED.meeting_slot,
        updated_at = EXCLUDED.updated_at
      `,
      intakeId,
      leadId,
      toSafeString(intake.businessName),
      toSafeString(intake.industry),
      toSafeString(intake.contactName),
      toSafeString(intake.email),
      toSafeString(intake.phone),
      toSafeString(intake.projectType),
      JSON.stringify(normalizeArray(intake.features, [])),
      toSafeString(intake.ideaDescription),
      toSafeNumber(intake.budget, toSafeNumber(intake.estimatedPrice)),
      toSafeString(intake.deadline),
      toSafeString(intake.selectedPackage),
      JSON.stringify(normalizeArray(intake.uploadedFiles, [])),
      toSafeString(intake.meetingSlot),
      now,
    );

    if (token) {
      await db.$executeRawUnsafe(
        `UPDATE client_links SET status = 'completed', updated_at = $2 WHERE token = $1`,
        token,
        now,
      );
    }

    const ai = buildRequirementAnalysis(intake);
    const requirementId = `req-${leadId}`;

    await db.$executeRawUnsafe(
      `
      INSERT INTO requirements (id, lead_id, summary, features, modules, analysis, status, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, 'draft', $7)
      ON CONFLICT (lead_id)
      DO UPDATE SET
        summary = EXCLUDED.summary,
        features = EXCLUDED.features,
        modules = EXCLUDED.modules,
        analysis = EXCLUDED.analysis,
        status = CASE WHEN requirements.locked = true THEN requirements.status ELSE 'draft' END,
        version = requirements.version + 1,
        updated_at = EXCLUDED.updated_at
      WHERE requirements.locked = false
      `,
        String(requirementId),
        String(leadId),
        String(ai.summary || ""),
        JSON.stringify(ai.features || []),
        JSON.stringify(ai.modules || []),
        JSON.stringify(ai.analysis || {}),
        now,
    );

    return res.status(201).json({
      success: true,
      data: {
          leadId: String(leadId),
        intakeId,
          requirementId: String(requirementId),
        message: "Intake submission saved and requirements generated",
      },
    });
  } catch (error) {
    console.error("intake submit error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit intake" });
  }
});

router.get("/requirements/:leadId", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.params.leadId);
    if (!leadId) {
      return res.status(400).json({ success: false, error: "leadId is required" });
    }

    const leadRows = await db.$queryRawUnsafe<any[]>(
      `SELECT id, name, company, email, phone, stage, score, value FROM "Lead" WHERE id = $1 LIMIT 1`,
      leadId,
    ).catch(() => []);

    const intakeRows = await db.$queryRawUnsafe<any[]>(
      `
      SELECT *
      FROM intake_submissions
      WHERE lead_id = $1
      LIMIT 1
      `,
      leadId,
    );

    const requirementRows = await db.$queryRawUnsafe<any[]>(
      `
      SELECT *
      FROM requirements
      WHERE lead_id = $1
      LIMIT 1
      `,
      leadId,
    );

    const meetingRows = await db.$queryRawUnsafe<any[]>(
      `
      SELECT id, title, date_time, status, attendees
      FROM "Meeting"
      WHERE lead_id = $1
      ORDER BY date_time DESC
      LIMIT 1
      `,
      leadId,
    ).catch(() => []);

    const linkRows = await db.$queryRawUnsafe<any[]>(
      `
      SELECT id, status, expires_at, updated_at, created_at
      FROM client_links
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      leadId,
    );

    const intake = intakeRows[0]
      ? {
          id: String(intakeRows[0].id),
          leadId: String(intakeRows[0].lead_id),
          businessName: intakeRows[0].business_name,
          industry: intakeRows[0].industry,
          contactName: intakeRows[0].contact_name,
          email: intakeRows[0].email,
          phone: intakeRows[0].phone,
          projectType: intakeRows[0].project_type,
          features: normalizeArray(intakeRows[0].features, []),
          description: intakeRows[0].description,
          budget: intakeRows[0].budget,
          timeline: intakeRows[0].timeline,
          package: intakeRows[0].package,
          files: normalizeArray(intakeRows[0].files, []),
          meetingSlot: intakeRows[0].meeting_slot,
          createdAt: intakeRows[0].created_at,
          updatedAt: intakeRows[0].updated_at,
        }
      : null;

    const requirement = requirementRows[0]
      ? {
          id: String(requirementRows[0].id),
          leadId: String(requirementRows[0].lead_id),
          summary: String(requirementRows[0].summary || ""),
          features: normalizeArray(requirementRows[0].features, []),
          modules: normalizeArray(requirementRows[0].modules, []),
          analysis: requirementRows[0].analysis || {},
          status: String(requirementRows[0].status || "draft"),
          locked: Boolean(requirementRows[0].locked),
          version: Number(requirementRows[0].version || 1),
          updatedAt: requirementRows[0].updated_at,
          items: normalizeArray((requirementRows[0].analysis || {}).items, []),
          lock: buildRequirementLockSnapshot(requirementRows[0], intake, Boolean(meetingRows[0])),
        }
      : null;

    const completion = computeCompletion(intake || {}, Boolean(meetingRows[0]));

    return res.json({
      success: true,
      data: {
        lead: leadRows[0]
          ? {
              id: String(leadRows[0].id),
              name: leadRows[0].name,
              company: leadRows[0].company,
              email: leadRows[0].email,
              phone: leadRows[0].phone,
              stage: leadRows[0].stage,
              score: toSafeNumber(leadRows[0].score, 0),
              budget: toSafeNumber(leadRows[0].value, 0),
            }
          : {
              id: leadId,
              name: intake?.contactName || "Lead",
              company: intake?.businessName || "",
              email: intake?.email || "",
              phone: intake?.phone || "",
              stage: "discovery",
              score: 0,
              budget: toSafeNumber(intake?.budget, 0),
            },
        intake,
        files: intake?.files || [],
        requirements: requirement,
        meeting: meetingRows[0]
          ? {
              id: String(meetingRows[0].id),
              title: String(meetingRows[0].title || "Meeting"),
              dateTime: meetingRows[0].date_time,
              status: String(meetingRows[0].status || "scheduled"),
              attendees: normalizeArray(meetingRows[0].attendees, []),
            }
          : null,
        clientLink: linkRows[0]
          ? {
              id: String(linkRows[0].id),
              status: String(linkRows[0].status || "pending"),
              expiresAt: linkRows[0].expires_at,
              updatedAt: linkRows[0].updated_at,
            }
          : null,
        formCompletion: completion,
      },
    });
  } catch (error) {
    console.error("requirements fetch error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch requirements bundle" });
  }
});

router.post("/requirements/:leadId/regenerate", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.params.leadId);
    const intakeRows = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM intake_submissions WHERE lead_id = $1 LIMIT 1`,
      leadId,
    );

    const intake = intakeRows[0];
    if (!intake) {
      return res.status(404).json({ success: false, error: "No intake submission found for this lead" });
    }

    const ai = buildRequirementAnalysis({
      leadId,
      businessName: intake.business_name,
      projectType: intake.project_type,
      features: normalizeArray(intake.features, []),
      budget: toSafeNumber(intake.budget),
      deadline: intake.timeline,
      selectedPackage: intake.package,
    });

    await db.$executeRawUnsafe(
      `
      UPDATE requirements
      SET
        summary = $2,
        features = $3::jsonb,
        modules = $4::jsonb,
        analysis = $5::jsonb,
        version = version + 1,
        updated_at = NOW()
      WHERE lead_id = $1 AND locked = false
      `,
      leadId,
      ai.summary,
      JSON.stringify(ai.features),
      JSON.stringify(ai.modules),
      JSON.stringify(ai.analysis),
    );

    return res.json({ success: true, data: { leadId, regenerated: true } });
  } catch (error) {
    console.error("requirements regenerate error:", error);
    return res.status(500).json({ success: false, error: "Failed to regenerate requirements" });
  }
});

router.post("/requirements/:leadId/lock", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.params.leadId);
    const body = (req.body || {}) as LockRequestPayload;
    const password = toSafeString(body.password);
    const confirmPassword = toSafeString(body.confirmPassword);
    const override = Boolean(body.override);
    const actor = getRequestActor(req);
    const intakePayload = body.intake && typeof body.intake === "object" ? body.intake : null;

    const requirementRows = await db.$queryRawUnsafe<any[]>(`SELECT * FROM requirements WHERE lead_id = $1 LIMIT 1`, leadId);
    let requirement = requirementRows[0];
    let intake = (await db.$queryRawUnsafe<any[]>(`SELECT * FROM intake_submissions WHERE lead_id = $1 LIMIT 1`, leadId))[0];

    if (!requirement) {
      // Attempt to synthesize a requirements record from an existing intake submission so lock can proceed
      const intakeForCreate = intake || intakePayload;

      if (intakeForCreate) {
        const ai = buildRequirementAnalysis({
          leadId,
          businessName: intakeForCreate.business_name ?? intakeForCreate.businessName,
          projectType: intakeForCreate.project_type ?? intakeForCreate.projectType,
          features: normalizeArray(intakeForCreate.features, []),
          ideaDescription: intakeForCreate.description ?? intakeForCreate.ideaDescription,
          budget: intakeForCreate.budget ?? intakeForCreate.estimatedPrice,
          deadline: intakeForCreate.timeline ?? intakeForCreate.deadline,
          selectedPackage: intakeForCreate.package ?? intakeForCreate.selectedPackage,
          uploadedFiles: normalizeArray(intakeForCreate.files ?? intakeForCreate.uploadedFiles, []),
          meetingSlot: intakeForCreate.meeting_slot ?? intakeForCreate.meetingSlot,
          estimatedPrice: intakeForCreate.estimated_price ?? intakeForCreate.estimatedPrice,
        });

        const requirementId = `req-${leadId}`;
        await db.$executeRawUnsafe(
          `
          INSERT INTO requirements (id, lead_id, summary, features, modules, analysis, status, version, updated_at)
          VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, 'draft', 1, NOW())
          ON CONFLICT (lead_id) DO NOTHING
          `,
          String(requirementId),
          String(leadId),
          String(ai.summary || ""),
          JSON.stringify(ai.features || []),
          JSON.stringify(ai.modules || []),
          JSON.stringify(ai.analysis || {}),
        );

        // Re-query the requirement after insert
        const newReqRows = await db.$queryRawUnsafe<any[]>(`SELECT * FROM requirements WHERE lead_id = $1 LIMIT 1`, leadId);
        requirement = newReqRows[0];

        if (!requirement) {
          console.error("[LOCK:ERROR] Requirement still not found after creation attempt", { leadId, actor: actor.id });
          return res.status(404).json({ success: false, error: "Requirement not found" });
        }
      } else {
        console.error("[LOCK:ERROR] Requirement not found and no intake submission to generate from", { leadId, actor: actor.id });
        return res.status(404).json({ success: false, error: "Requirement not found" });
      }
    }

    if (Boolean(requirement.locked)) {
      return res.status(409).json({ success: false, error: "Requirement is already locked" });
    }

    if (!password || !/^\d{4}$/.test(password)) {
      return res.status(400).json({ success: false, error: "Lock password must be a 4-digit code" });
    }

    if (confirmPassword && confirmPassword !== password) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }

    if (!intake && intakePayload) {
      intake = {
        lead_id: leadId,
        business_name: intakePayload.businessName,
        project_type: intakePayload.projectType,
        features: normalizeArray(intakePayload.features, []),
        description: intakePayload.ideaDescription,
        budget: intakePayload.budget,
        timeline: intakePayload.deadline,
        package: intakePayload.selectedPackage,
        files: normalizeArray(intakePayload.uploadedFiles, []),
        meeting_slot: intakePayload.meetingSlot,
        contact_name: intakePayload.contactName,
        email: intakePayload.email,
        phone: intakePayload.phone,
        estimated_price: intakePayload.estimatedPrice,
      };
    }

    const validation = normalizeLockIssues(intake || {}, requirement);

    if (!validation.readyToLock && !override) {
      return res.status(409).json({
        success: false,
        error: "Requirement needs review before locking",
        data: {
          leadId,
          readyToLock: false,
          lockScore: validation.lockScore,
          missing: validation.missing,
          completionPercent: validation.completionPercent,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const lockRows = await db.$queryRawUnsafe<any[]>(
      `
      UPDATE requirements
      SET
        locked = true,
        status = 'locked',
        lock_password_hash = $2,
        locked_at = NOW(),
        locked_by = $3,
        locked_by_role = $4,
        lock_version = version,
        lock_score = $5,
        lock_missing = $6::jsonb,
        unlock_failed_attempts = 0,
        unlock_blocked_until = NULL,
        unlocked_at = NULL,
        unlocked_by = NULL,
        unlocked_by_role = NULL,
        updated_at = NOW()
      WHERE lead_id = $1
      RETURNING *
      `,
      leadId,
      hashedPassword,
      actor.id,
      actor.role,
      validation.lockScore,
      JSON.stringify(validation.missing),
    );

    const lockedRow = lockRows[0];
    await logAudit({
      userId: actor.id,
      action: "REQUIREMENT_LOCKED",
      meta: {
        leadId,
        lockScore: validation.lockScore,
        override,
        missing: validation.missing,
        lockedVersion: lockedRow?.lock_version ?? requirement.version,
      },
    });

    return res.json({
      success: true,
      data: {
        leadId,
        locked: true,
        lockScore: validation.lockScore,
        missing: validation.missing,
        lockedAt: lockedRow?.locked_at || new Date().toISOString(),
        lockedVersion: lockedRow?.lock_version ?? requirement.version,
      },
    });
  } catch (error) {
        console.error("requirements lock error:", error);
        return res.status(500).json({ success: false, error: "Failed to lock requirements" });
  }
});

router.post("/requirements/:leadId/unlock", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.params.leadId);
    const password = toSafeString(req.body?.password);
    const override = Boolean(req.body?.override);
    const actor = getRequestActor(req);

    const requirementRows = await db.$queryRawUnsafe<any[]>(`SELECT * FROM requirements WHERE lead_id = $1 LIMIT 1`, leadId);
    const requirement = requirementRows[0];

    if (!requirement) {
      console.error("[LOCK:ERROR] Requirement not found", { leadId, actor: actor.id });
      return res.status(404).json({ success: false, error: "Requirement not found" });
    }

    if (!Boolean(requirement.locked)) {
      return res.status(409).json({ success: false, error: "Requirement is not locked" });
    }

    const blockedUntil = requirement.unlock_blocked_until ? new Date(requirement.unlock_blocked_until).getTime() : 0;
    if (!override && blockedUntil && blockedUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        error: "Unlock temporarily blocked due to failed attempts",
        data: {
          blockedUntil: requirement.unlock_blocked_until,
          failedAttempts: Number(requirement.unlock_failed_attempts || 0),
        },
      });
    }

    const adminOverride = override && actor.isAdmin;
    let passwordOk = false;
    if (adminOverride) {
      passwordOk = true;
    } else {
      if (!password) {
        return res.status(400).json({ success: false, error: "Password is required" });
      }

      passwordOk = Boolean(requirement.lock_password_hash) && (await bcrypt.compare(password, requirement.lock_password_hash));
    }

    if (!passwordOk) {
      const attempts = Number(requirement.unlock_failed_attempts || 0) + 1;
      const shouldBlock = attempts >= MAX_UNLOCK_ATTEMPTS;
      const [failedRow] = await db.$queryRawUnsafe<any[]>(
        `
        UPDATE requirements
        SET
          unlock_failed_attempts = $2,
          unlock_blocked_until = CASE WHEN $3 THEN NOW() + ($4 || ' minutes')::interval ELSE unlock_blocked_until END,
          updated_at = NOW()
        WHERE lead_id = $1
        RETURNING *
        `,
        leadId,
        attempts,
        shouldBlock,
        UNLOCK_BLOCK_MINUTES,
      );

      await logAudit({
        userId: actor.id,
        action: "REQUIREMENT_UNLOCK_FAILED",
        meta: { leadId, attempts, blocked: shouldBlock },
      });

      return res.status(401).json({
        success: false,
        error: "Incorrect password",
        data: {
          failedAttempts: attempts,
          blockedUntil: failedRow?.unlock_blocked_until || null,
          maxAttempts: MAX_UNLOCK_ATTEMPTS,
        },
      });
    }

    const [unlockedRow] = await db.$queryRawUnsafe<any[]>(
      `
      UPDATE requirements
      SET
        locked = false,
        status = 'draft',
        unlock_failed_attempts = 0,
        unlock_blocked_until = NULL,
        unlocked_at = NOW(),
        unlocked_by = $2,
        unlocked_by_role = $3,
        updated_at = NOW()
      WHERE lead_id = $1
      RETURNING *
      `,
      leadId,
      actor.id,
      actor.role,
    );

    await logAudit({
      userId: actor.id,
      action: adminOverride ? "REQUIREMENT_UNLOCK_OVERRIDE" : "REQUIREMENT_UNLOCKED",
      meta: {
        leadId,
        override: adminOverride,
        unlockedVersion: unlockedRow?.lock_version ?? requirement.lock_version ?? requirement.version,
      },
    });

    return res.json({
      success: true,
      data: {
        leadId,
        locked: false,
        unlockedAt: unlockedRow?.unlocked_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("requirements unlock error:", error);
    return res.status(500).json({ success: false, error: "Failed to unlock requirements" });
  }
});

export default router;
