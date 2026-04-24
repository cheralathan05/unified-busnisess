import { randomBytes } from "crypto";
import { Router, Request, Response } from "express";
import { db } from "../../config/db";
import { authMiddleware } from "../../middleware/auth.middleware";
import { EmailService } from "../communication/email.service";

const router = Router();
const emailService = new EmailService();

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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  tablesEnsured = true;
}

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
      `,
      requirementId,
      leadId,
      ai.summary,
      JSON.stringify(ai.features),
      JSON.stringify(ai.modules),
      JSON.stringify(ai.analysis),
      now,
    );

    return res.status(201).json({
      success: true,
      data: {
        leadId,
        intakeId,
        requirementId,
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
    await db.$executeRawUnsafe(
      `UPDATE requirements SET locked = true, status = 'locked', updated_at = NOW() WHERE lead_id = $1`,
      leadId,
    );

    return res.json({ success: true, data: { leadId, locked: true } });
  } catch (error) {
    console.error("requirements lock error:", error);
    return res.status(500).json({ success: false, error: "Failed to lock requirements" });
  }
});

export default router;
