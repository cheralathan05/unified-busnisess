import { Router, Request, Response } from "express";
import { db } from "../../config/db";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

let ensured = false;

function toSafeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

async function ensureTables() {
  if (ensured) return;

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

  ensured = true;
}

router.post("/submit", authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureTables();

    const leadId = toSafeString(req.body?.leadId || req.body?.accessId || req.body?.id);
    if (!leadId) {
      return res.status(400).json({ success: false, error: "leadId is required" });
    }

    const now = new Date();
    const recordId = `intake-${leadId}`;

    await db.$executeRawUnsafe(
      `
      INSERT INTO intake_submissions (
        id, lead_id, business_name, industry, contact_name, email, phone, project_type, features,
        description, budget, timeline, package, files, meeting_slot, source, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
        $10, $11, $12, $13, $14::jsonb, $15, 'manual_sync', $16
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
        source = EXCLUDED.source,
        updated_at = EXCLUDED.updated_at
      `,
      recordId,
      leadId,
      toSafeString(req.body?.businessName),
      toSafeString(req.body?.industry),
      toSafeString(req.body?.contactName),
      toSafeString(req.body?.email),
      toSafeString(req.body?.phone),
      toSafeString(req.body?.projectType),
      JSON.stringify(normalizeArray(req.body?.features, [])),
      toSafeString(req.body?.ideaDescription),
      toSafeNumber(req.body?.budget, toSafeNumber(req.body?.estimatedPrice)),
      toSafeString(req.body?.deadline),
      toSafeString(req.body?.selectedPackage),
      JSON.stringify(normalizeArray(req.body?.uploadedFiles, [])),
      toSafeString(req.body?.meetingSlot),
      now,
    );

    return res.status(201).json({
      success: true,
      data: {
        leadId,
        submissionId: recordId,
      },
    });
  } catch (error) {
    console.error("client-intake submit error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit intake" });
  }
});

router.get("/submissions", authMiddleware, async (_req: Request, res: Response) => {
  try {
    await ensureTables();

    const rows = await db.$queryRawUnsafe<any[]>(`
      SELECT *
      FROM intake_submissions
      ORDER BY updated_at DESC
      LIMIT 100
    `);

    const data = rows.map((row) => ({
      id: String(row.id),
      leadId: String(row.lead_id),
      aiSummary: "",
      createdAt: row.created_at,
      formData: {
        businessName: row.business_name,
        industry: row.industry,
        contactName: row.contact_name,
        email: row.email,
        phone: row.phone,
        projectType: row.project_type,
        features: normalizeArray(row.features, []),
        ideaDescription: row.description,
        budget: toSafeNumber(row.budget),
        deadline: row.timeline,
        selectedPackage: row.package,
        uploadedFiles: normalizeArray(row.files, []),
        meetingSlot: row.meeting_slot,
        termsAccepted: true,
        estimatedPrice: toSafeNumber(row.budget),
        suggestionNotes: [],
      },
      lead: {
        id: String(row.lead_id),
        name: row.contact_name || row.business_name || "Client",
        company: row.business_name || "",
      },
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error("client-intake submissions error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch submissions" });
  }
});

export default router;
