import request, { type Response, type Test } from "supertest";
import jwt from "jsonwebtoken";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { env } from "../config/env";

process.env.NODE_ENV = "test";
process.env.AUTH_DEV_BYPASS = "false";
process.env.RATE_LIMIT_MAX = "20";
process.env.RATE_LIMIT_WINDOW_MS = "60000";

let aiMode: "ok" | "fallback" | "error" = "ok";

vi.mock("../modules/ai/ollama.service", () => {
  class MockOllamaService {
    async generate(_prompt: string) {
      if (aiMode === "error") {
        return { text: "AI unavailable", timedOut: true };
      }

      if (aiMode === "fallback") {
        return {
          text: JSON.stringify({
            summary: "AI unavailable",
            insights: [],
            nextAction: "wait",
            confidence: 0,
          }),
          timedOut: true,
        };
      }

      return {
        text: "Dear John, this is a professional follow-up email draft.",
        timedOut: false,
      };
    }
  }

  return { OllamaService: MockOllamaService };
});

vi.mock("../modules/ai/ai.service", () => ({
  enrichLeadWithAI: vi.fn(async () => ({
    summary: "AI summary",
    insights: ["insight-1"],
    nextAction: "email",
    confidence: 0.85,
    priority: "warm",
    promptVersion: "test-v1",
  })),
}));

vi.mock("../modules/ai/ai.actions", () => ({
  executeAction: vi.fn(async () => ({ id: "action-mock", status: "done" })),
}));

vi.mock("../modules/communication/email.service", () => {
  class MockEmailService {
    async send(data: any) {
      if (!data?.to || !data?.subject) {
        throw new Error("Missing required email fields");
      }

      return {
        messageId: `email_${Date.now()}`,
        to: data.to,
        status: "sent",
      };
    }
  }

  return { EmailService: MockEmailService };
});

vi.mock("../modules/communication/whatsapp.service", () => {
  class MockWhatsAppService {
    async send(data: any) {
      if (!data?.to || !data?.message) {
        throw new Error("Missing WhatsApp fields");
      }

      return {
        id: `wa_${Date.now()}`,
        to: data.to,
        status: "sent",
      };
    }
  }

  return { WhatsAppService: MockWhatsAppService };
});

vi.mock("../modules/communication/calendar.service", () => {
  class MockCalendarService {
    async schedule(data: any) {
      if (!data?.time || !Array.isArray(data.participants)) {
        throw new Error("Invalid scheduling data");
      }

      const parsed = new Date(data.time);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid date format");
      }

      return {
        id: `call_${Date.now()}`,
        status: "scheduled",
        time: parsed.toISOString(),
        participants: data.participants,
      };
    }
  }

  return { CalendarService: MockCalendarService };
});

type AppLike = Parameters<typeof request>[0];
type DbLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  action: { deleteMany: (args?: any) => Promise<any> };
  outcome: { deleteMany: (args?: any) => Promise<any> };
  decision: {
    create: (args: any) => Promise<any>;
    deleteMany: (args?: any) => Promise<any>;
  };
  invoice: { deleteMany: (args?: any) => Promise<any> };
  payment: { deleteMany: (args?: any) => Promise<any> };
  activity: { deleteMany: (args?: any) => Promise<any> };
  lead: {
    findUnique: (args: any) => Promise<any>;
    deleteMany: (args?: any) => Promise<any>;
  };
  session: { deleteMany: (args?: any) => Promise<any> };
  token: { deleteMany: (args?: any) => Promise<any> };
  credential: { deleteMany: (args?: any) => Promise<any> };
  audit: { deleteMany: (args?: any) => Promise<any> };
  otp: { deleteMany: (args?: any) => Promise<any> };
  policy: { deleteMany: (args?: any) => Promise<any> };
  aILog: { deleteMany: (args?: any) => Promise<any> };
  platformState: { deleteMany: (args?: any) => Promise<any> };
  user: {
    findUnique: (args: any) => Promise<any>;
    deleteMany: (args?: any) => Promise<any>;
  };
};

let app: AppLike;
let db: DbLike;

let accessToken = "";
let refreshToken = "";
let userId = "";

let secondAccessToken = "";
let secondUserId = "";

let leadId = "";
let secondUserLeadId = "";
let activityId = "";
let decisionId = "";

const API_PREFIX = "/api";
const PERF_BUDGET_MS = 300;

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function timed(req: Test) {
  const start = Date.now();
  const res = await req;
  const ms = Date.now() - start;
  return { res, ms };
}

function expectFast(ms: number, endpoint: string) {
  expect(ms, `${endpoint} exceeded ${PERF_BUDGET_MS}ms`).toBeLessThan(PERF_BUDGET_MS);
}

async function clearDatabase() {
  await db.action.deleteMany();
  await db.outcome.deleteMany();
  await db.decision.deleteMany();
  await db.invoice.deleteMany();
  await db.payment.deleteMany();
  await db.activity.deleteMany();
  await db.lead.deleteMany();
  await db.session.deleteMany();
  await db.token.deleteMany();
  await db.credential.deleteMany();
  await db.audit.deleteMany();
  await db.otp.deleteMany();
  await db.policy.deleteMany();
  await db.aILog.deleteMany();
  await db.platformState.deleteMany();
  await db.user.deleteMany();
}

async function registerAndLogin(label: string) {
  const email = uniqueEmail(label);
  const password = "StrongPass@123";

  const registerRes = await request(app)
    .post(`${API_PREFIX}/auth/register`)
    .send({ name: `${label} User`, email, password, companyName: "Acme" });

  expect(registerRes.status).toBe(201);
  expect(registerRes.body?.data?.accessToken).toBeTruthy();

  const loginRes = await request(app)
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password });

  expect(loginRes.status).toBe(200);

  return {
    email,
    password,
    accessToken: loginRes.body.data.accessToken as string,
    refreshToken: loginRes.body.data.refreshToken as string,
    userId: loginRes.body.data.user.id as string,
  };
}

async function createLead(token: string, payload?: Record<string, any>) {
  const defaultPayload = {
    name: "John CEO",
    company: "Acme Corp",
    value: 50000,
    stage: "Discovery",
    email: uniqueEmail("lead"),
    phone: "9876543210",
  };

  const res = await request(app)
    .post(`${API_PREFIX}/leads`)
    .set(auth(token))
    .send({ ...defaultPayload, ...payload });

  expect(res.status).toBe(200);
  expect(res.body?.data?.id).toBeTruthy();
  return res.body.data;
}

async function createSuggestedDecision(userIdInput: string, leadIdInput: string) {
  const created = await db.decision.create({
    data: {
      userId: userIdInput,
      leadId: leadIdInput,
      type: "lead_follow_up",
      input: {
        event: "lead.created",
        payload: { id: leadIdInput },
      },
      recommendation: {
        channel: "email",
        reason: "Test recommendation",
      },
      confidence: 0.8,
      status: "suggested",
    },
  });

  return created.id as string;
}

beforeAll(async () => {
  const appModule = await import("../app");
  const dbModule = await import("../config/db");

  app = appModule.default;
  db = dbModule.db as unknown as DbLike;

  await db.$connect();
  await clearDatabase();

  const primary = await registerAndLogin("primary");
  accessToken = primary.accessToken;
  refreshToken = primary.refreshToken;
  userId = primary.userId;

  const secondary = await registerAndLogin("secondary");
  secondAccessToken = secondary.accessToken;
  secondUserId = secondary.userId;
});

beforeEach(() => {
  aiMode = "ok";
});

afterAll(async () => {
  await clearDatabase();
  await db.$disconnect();
});

describe("Health API", () => {
  it("GET /api/health should return service health payload quickly", async () => {
    const { res, ms } = await timed(request(app).get(`${API_PREFIX}/health`));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: expect.any(String),
      service: expect.any(String),
    });
    expectFast(ms, "/api/health");
  });
});

describe("Auth API", () => {
  it("POST /api/auth/register should validate required fields", async () => {
    const res = await request(app).post(`${API_PREFIX}/auth/register`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation error");
  });

  it("POST /api/auth/login should reject invalid credentials", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ email: uniqueEmail("missing"), password: "WrongPass@123" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBeTruthy();
  });

  it("GET /api/auth/me should enforce auth: no token, invalid token, expired token", async () => {
    const noToken = await request(app).get(`${API_PREFIX}/auth/me`);
    expect(noToken.status).toBe(401);

    const invalid = await request(app)
      .get(`${API_PREFIX}/auth/me`)
      .set(auth("invalid.token.value"));
    expect(invalid.status).toBe(401);

    const expired = jwt.sign(
      { id: userId, email: "expired@example.com", role: "USER" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: -1 }
    );

    const expiredRes = await request(app)
      .get(`${API_PREFIX}/auth/me`)
      .set(auth(expired));

    expect(expiredRes.status).toBe(401);
  });

  it("GET /api/auth/me should return authenticated user", async () => {
    const { res, ms } = await timed(
      request(app).get(`${API_PREFIX}/auth/me`).set(auth(accessToken))
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    });
    expectFast(ms, "/api/auth/me");
  });

  it("POST /api/auth/refresh should rotate access token", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body?.data?.accessToken).toEqual(expect.any(String));
    expect(res.body?.data?.refreshToken).toEqual(expect.any(String));

    const rotatedRefresh = res.body.data.refreshToken as string;

    const oldTokenRes = await request(app)
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken });

    expect(oldTokenRes.status).toBeGreaterThanOrEqual(400);

    refreshToken = rotatedRefresh;
  });

  it("POST /api/auth/logout should invalidate sessions", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/auth/logout`)
      .set(auth(accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });

    const oldRefresh = await request(app)
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken });

    expect(oldRefresh.status).toBeGreaterThanOrEqual(400);

    const relogin = await registerAndLogin("primary-relogin");
    accessToken = relogin.accessToken;
    refreshToken = relogin.refreshToken;
    userId = relogin.userId;
  });

  it("POST /api/auth/login should rate-limit abusive failed attempts", async () => {
    const email = uniqueEmail("ratelimit");
    const password = "StrongPass@123";

    await request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send({ name: "Rate User", email, password, companyName: "Acme" });

    let blocked: Response | null = null;
    for (let i = 0; i < 30; i += 1) {
      const res = await request(app)
        .post(`${API_PREFIX}/auth/login`)
        .send({ email, password: "WrongPass@123" });

      if (res.status === 429) {
        blocked = res;
        break;
      }
    }

    expect(blocked).not.toBeNull();
    expect(blocked?.text || JSON.stringify(blocked?.body || {})).toContain("Too many requests");
  });
});

async function getUserEmail(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  return user?.email as string;
}

describe("Onboarding API", () => {
  it("POST /api/onboarding should return 404 for unknown user context", async () => {
    const ghostToken = jwt.sign(
      { id: "00000000-0000-0000-0000-000000000001", role: "USER", email: "ghost@example.com" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" }
    );

    const res = await request(app)
      .post(`${API_PREFIX}/onboarding`)
      .set(auth(ghostToken))
      .send({ name: "Ghost", companyName: "Ghost Co" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("USER_NOT_FOUND");
  });

  it("POST /api/onboarding should validate payload", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/onboarding`)
      .set(auth(accessToken))
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST /api/onboarding should accept combined payload", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/onboarding`)
      .set(auth(accessToken))
      .send({ name: "Combined Name", companyName: "Combined Co" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Combined Name");
    expect(res.body.data.companyName).toBe("Combined Co");
  });

  it("POST /api/onboarding/start should reject unknown fields", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/onboarding/start`)
      .set(auth(accessToken))
      .send({ name: "Valid", randomField: "hack" });

    expect(res.status).toBe(400);
  });

  it("POST /api/onboarding/start should validate payload", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/onboarding/start`)
      .set(auth(accessToken))
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST /api/onboarding/start should update user name", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/onboarding/start`)
      .set(auth(accessToken))
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/onboarding/business should save company info", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/onboarding/business`)
      .set(auth(accessToken))
      .send({ companyName: "Digital Nexus Labs" });

    expect(res.status).toBe(200);
    expect(res.body.data.companyName).toBe("Digital Nexus Labs");
  });

  it("POST /api/onboarding/start should return 404 for unknown user context", async () => {
    const ghostToken = jwt.sign(
      { id: "00000000-0000-0000-0000-000000000001", role: "USER", email: "ghost@example.com" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" }
    );

    const res = await request(app)
      .post(`${API_PREFIX}/onboarding/start`)
      .set(auth(ghostToken))
      .send({ name: "Ghost" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("USER_NOT_FOUND");
  });
});

describe("Leads API", () => {
  it("POST /api/leads should return 404 for unknown user context", async () => {
    const ghostToken = jwt.sign(
      { id: "00000000-0000-0000-0000-000000000001", role: "USER", email: "ghost@example.com" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" }
    );

    const res = await request(app)
      .post(`${API_PREFIX}/leads`)
      .set(auth(ghostToken))
      .send({
        name: "Ghost Lead",
        company: "Ghost Co",
        value: 1000,
        stage: "Discovery",
        email: "ghost@lead.com",
        phone: "9000000000",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("USER_NOT_FOUND");
  });

  it("POST /api/leads should handle concurrent updates safely", async () => {
    const concurrentLead = await createLead(accessToken, {
      company: "Concurrent Corp",
      stage: "Discovery",
      value: 10000,
      email: "concurrent@example.com",
      phone: "9111111111",
    });

    await Promise.all([
      request(app)
        .put(`${API_PREFIX}/leads/${concurrentLead.id}`)
        .set(auth(accessToken))
        .send({ stage: "Proposal", value: 20000 }),
      request(app)
        .put(`${API_PREFIX}/leads/${concurrentLead.id}`)
        .set(auth(accessToken))
        .send({ stage: "Negotiation", value: 55000, phone: "9222222222" }),
      request(app)
        .put(`${API_PREFIX}/leads/${concurrentLead.id}`)
        .set(auth(accessToken))
        .send({ stage: "Discovery", value: 30000, email: "c2@example.com" }),
    ]);

    const finalRes = await request(app)
      .get(`${API_PREFIX}/leads/${concurrentLead.id}`)
      .set(auth(accessToken));

    expect(finalRes.status).toBe(200);
    expect(finalRes.body.data.score).toBeGreaterThanOrEqual(0);
    expect(finalRes.body.data.score).toBeLessThanOrEqual(100);
  });

  it("POST /api/leads should create lead and include score", async () => {
    const created = await createLead(accessToken, { value: 1000, stage: "Discovery", email: null, phone: null });
    leadId = created.id;
    expect(created.score).toBe(0);
    expect(typeof created.summary).toBe("string");
    expect(created.summary.length).toBeGreaterThan(0);
  });

  it("GET /api/leads should support pagination on empty page edge case", async () => {
    const { res, ms } = await timed(
      request(app)
        .get(`${API_PREFIX}/leads?page=999&limit=10`)
        .set(auth(accessToken))
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("data");
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expectFast(ms, "/api/leads?page=999&limit=10");
  });

  it("GET /api/leads should support search and filter", async () => {
    const searchRes = await request(app)
      .get(`${API_PREFIX}/leads?search=Acme`)
      .set(auth(accessToken));

    expect(searchRes.status).toBe(200);

    const filterRes = await request(app)
      .get(`${API_PREFIX}/leads?stage=Discovery&minScore=0`)
      .set(auth(accessToken));

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data).toHaveProperty("data");
  });

  it("GET /api/leads should support large dataset pagination", async () => {
    const bulkRows = Array.from({ length: 150 }).map((_, i) => ({
      id: crypto.randomUUID(),
      name: `Stress Lead ${i}`,
      company: `Stress Co ${i % 10}`,
      value: 1000 + i,
      score: i % 100,
      stage: i % 2 === 0 ? "Discovery" : "Proposal",
      email: `stress-${i}-${Date.now()}@example.com`,
      phone: `9${String(100000000 + i).slice(0, 9)}`,
      priority: "low",
      userId,
    }));

    await (db as any).lead.createMany({ data: bulkRows, skipDuplicates: true });

    const { res, ms } = await timed(
      request(app)
        .get(`${API_PREFIX}/leads?page=1&limit=100`)
        .set(auth(accessToken))
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.data.length).toBeLessThanOrEqual(100);
    expect(ms).toBeLessThan(1000);
  });

  it("GET /api/leads/:id should return one lead", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/leads/${leadId}`)
      .set(auth(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(leadId);
  });

  it("PUT /api/leads/:id should recalculate score when score inputs change", async () => {
    const updated = await request(app)
      .put(`${API_PREFIX}/leads/${leadId}`)
      .set(auth(accessToken))
      .send({ stage: "Negotiation", email: "lead@acme.com", phone: "9876543210", value: 60000 });

    expect(updated.status).toBe(200);
    expect(updated.body.data.score).toBeGreaterThan(0);
  });

  it("GET /api/leads/:id/{summary,insights,action} should return AI helper structures", async () => {
    const summary = await request(app)
      .get(`${API_PREFIX}/leads/${leadId}/summary`)
      .set(auth(accessToken));

    const insights = await request(app)
      .get(`${API_PREFIX}/leads/${leadId}/insights`)
      .set(auth(accessToken));

    const action = await request(app)
      .get(`${API_PREFIX}/leads/${leadId}/action`)
      .set(auth(accessToken));

    expect(summary.status).toBe(200);
    expect(insights.status).toBe(200);
    expect(action.status).toBe(200);
  });

  it("DELETE /api/leads/:id should remove lead", async () => {
    const toDelete = await createLead(accessToken, { company: "Delete Corp" });

    const del = await request(app)
      .delete(`${API_PREFIX}/leads/${toDelete.id}`)
      .set(auth(accessToken));

    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });
});

describe("Activities API", () => {
  it("POST /api/activities should validate leadId", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/activities`)
      .set(auth(accessToken))
      .send({ type: "call", note: "Missing leadId" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("leadId");
  });

  it("POST /api/activities should fail for invalid lead reference", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/activities`)
      .set(auth(accessToken))
      .send({ leadId: "11111111-1111-1111-1111-111111111111", type: "call", note: "bad lead" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("LEAD_NOT_FOUND");
  });

  it("POST /api/activities should enforce ownership with 403", async () => {
    const otherLead = await createLead(secondAccessToken, { company: "Other User Lead" });
    secondUserLeadId = otherLead.id;

    const res = await request(app)
      .post(`${API_PREFIX}/activities`)
      .set(auth(accessToken))
      .send({ leadId: secondUserLeadId, type: "call", note: "cannot access" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("NOT_OWNER");
  });

  it("POST /api/activities should create activity linked to lead", async () => {
    const { res, ms } = await timed(
      request(app)
        .post(`${API_PREFIX}/activities`)
        .set(auth(accessToken))
        .send({ leadId, type: "call", note: "Discussed pricing", status: "completed" })
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      leadId,
      type: "call",
      note: "Discussed pricing",
      status: "completed"
    });
    expect(res.body.data.text).toBeUndefined();
    expect(res.body.data.userId).toBeUndefined();
    activityId = res.body.data.id;
    expectFast(ms, "/api/activities");
  });

  it("GET /api/activities and /api/activities/lead/:leadId should list created activity", async () => {
    const all = await request(app)
      .get(`${API_PREFIX}/activities`)
      .set(auth(accessToken));

    const byLead = await request(app)
      .get(`${API_PREFIX}/activities/lead/${leadId}`)
      .set(auth(accessToken));

    expect(all.status).toBe(200);
    expect(byLead.status).toBe(200);
    expect(Array.isArray(byLead.body.data)).toBe(true);
    const found = byLead.body.data.find((a: any) => a.id === activityId);
    expect(found).toBeDefined();
    expect(found).toMatchObject({
      leadId,
      type: "call",
      note: "Discussed pricing",
      status: "completed"
    });
    expect(found?.text).toBeUndefined();
    expect(found?.userId).toBeUndefined();
  });
});

describe("Payments API", () => {
  it("POST /api/payments should validate payload", async () => {
    const bad = await request(app)
      .post(`${API_PREFIX}/payments`)
      .set(auth(accessToken))
      .send({ leadId: "lead_id", amount: -10 });

    expect(bad.status).toBe(400);
  });

  it("POST /api/payments should enforce ownership", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/payments`)
      .set(auth(accessToken))
      .send({ leadId: secondUserLeadId, amount: 1000 });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("NOT_OWNER");
  });

  it("POST /api/payments should create payment for valid lead", async () => {
    const { res, ms } = await timed(
      request(app)
        .post(`${API_PREFIX}/payments`)
        .set(auth(accessToken))
        .send({ leadId, amount: 30000 })
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      amount: 30000,
      leadId,
    });
    expectFast(ms, "/api/payments");
  });

  it("POST /api/payments should demonstrate duplicate-request behavior under concurrency", async () => {
    const payload = { leadId, amount: 7777 };

    const [p1, p2] = await Promise.all([
      request(app).post(`${API_PREFIX}/payments`).set(auth(accessToken)).send(payload),
      request(app).post(`${API_PREFIX}/payments`).set(auth(accessToken)).send(payload),
    ]);

    expect(p1.status).toBe(200);
    expect(p2.status).toBe(200);

    const list = await request(app)
      .get(`${API_PREFIX}/payments?leadId=${leadId}&limit=100`)
      .set(auth(accessToken));

    const duplicates = (list.body.data as any[]).filter((x) => x.amount === 7777);
    expect(duplicates.length).toBeGreaterThanOrEqual(2);
  });

  it("POST /api/payments should deduplicate when Idempotency-Key is provided", async () => {
    const payload = { leadId, amount: 8181 };
    const idem = `pay-${Date.now()}`;

    const [p1, p2] = await Promise.all([
      request(app)
        .post(`${API_PREFIX}/payments`)
        .set(auth(accessToken))
        .set("Idempotency-Key", idem)
        .send(payload),
      request(app)
        .post(`${API_PREFIX}/payments`)
        .set(auth(accessToken))
        .set("Idempotency-Key", idem)
        .send(payload),
    ]);

    expect(p1.status).toBe(200);
    expect(p2.status).toBe(200);
    expect(p1.body.data.id).toBe(p2.body.data.id);

    const conflict = await request(app)
      .post(`${API_PREFIX}/payments`)
      .set(auth(accessToken))
      .set("Idempotency-Key", idem)
      .send({ leadId, amount: 9191 });

    expect(conflict.status).toBe(409);
    expect(conflict.body.message).toBe("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
  });

  it("GET /api/payments should support pagination and large limit validation", async () => {
    const list = await request(app)
      .get(`${API_PREFIX}/payments?page=1&limit=10`)
      .set(auth(accessToken));

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    const invalidLimit = await request(app)
      .get(`${API_PREFIX}/payments?page=1&limit=1000`)
      .set(auth(accessToken));

    expect(invalidLimit.status).toBe(400);
  });

  it("POST /api/payments/invoice and GET summary/invoice endpoints should work", async () => {
    const invoice = await request(app)
      .post(`${API_PREFIX}/payments/invoice`)
      .set(auth(accessToken))
      .send({ leadId, total: 12000 });

    expect(invoice.status).toBe(200);

    const summary = await request(app)
      .get(`${API_PREFIX}/payments/summary/${leadId}`)
      .set(auth(accessToken));

    const invoices = await request(app)
      .get(`${API_PREFIX}/payments/invoice/${leadId}`)
      .set(auth(accessToken));

    expect(summary.status).toBe(200);
    expect(summary.body.data).toHaveProperty("paid");
    expect(invoices.status).toBe(200);
    expect(Array.isArray(invoices.body.data)).toBe(true);
  });
});

describe("Analytics API", () => {
  it("GET /api/analytics/dashboard should return KPI schema", async () => {
    const { res, ms } = await timed(
      request(app)
        .get(`${API_PREFIX}/analytics/dashboard`)
        .set(auth(accessToken))
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalValue: expect.any(Number),
      avgScore: expect.any(Number),
      hotLeads: expect.any(Number),
      atRisk: expect.any(Number),
    });
    expectFast(ms, "/api/analytics/dashboard");
  });

  it("GET /api/analytics/dashboard should be consistent with lead totals", async () => {
    const leads = (await (db as any).lead.findMany({
      where: { userId },
      select: { value: true },
    })) as Array<{ value: number }>;
    const expectedTotal = leads.reduce((sum, l) => sum + Number(l.value || 0), 0);

    const dashboardRes = await request(app)
      .get(`${API_PREFIX}/analytics/dashboard`)
      .set(auth(accessToken));

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.data.totalValue).toBe(expectedTotal);
  });
});

describe("Communication API", () => {
  it("POST /api/communication/ai-email should return non-empty AI text", async () => {
    aiMode = "ok";

    const { res, ms } = await timed(
      request(app)
        .post(`${API_PREFIX}/communication/ai-email`)
        .send({
          lead: {
            company: "Acme",
            stage: "Proposal",
            value: 50000,
            score: 85,
          },
        })
    );

    expect(res.status).toBe(200);
    expect(typeof res.body.data).toBe("string");
    expect(res.body.data.trim().length).toBeGreaterThan(0);
    expect(res.body.data.length).toBeGreaterThan(50);
    expect(res.body.data).not.toContain("undefined");
    expectFast(ms, "/api/communication/ai-email");
  });

  it("POST /api/communication/ai-email should fallback on AI failure", async () => {
    aiMode = "fallback";

    const res = await request(app)
      .post(`${API_PREFIX}/communication/ai-email`)
      .send({
        lead: {
          company: "Acme",
          stage: "Discovery",
          value: 10000,
          score: 25,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toContain("Hi");
  });

  it("POST /api/communication/ai-email should validate input", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/communication/ai-email`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("POST /api/communication/email should send email", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/communication/email`)
      .set(auth(accessToken))
      .send({ to: "client@example.com", subject: "Follow-up", text: "Hello" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("sent");
  });

  it("POST /api/communication/email should validate fields", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/communication/email`)
      .set(auth(accessToken))
      .send({ to: "client@example.com" });

    expect(res.status).toBe(400);
  });

  it("POST /api/communication/whatsapp should send message", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/communication/whatsapp`)
      .set(auth(accessToken))
      .send({ to: "9876543210", message: "Hi" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("sent");
  });

  it("POST /api/communication/schedule should schedule call and validate date format", async () => {
    const success = await request(app)
      .post(`${API_PREFIX}/communication/schedule`)
      .set(auth(accessToken))
      .send({ time: "2026-04-01T10:00:00Z", participants: ["test@example.com"] });

    expect(success.status).toBe(200);
    expect(success.body.data.time).toBe("2026-04-01T10:00:00.000Z");

    const badDate = await request(app)
      .post(`${API_PREFIX}/communication/schedule`)
      .set(auth(accessToken))
      .send({ time: "not-a-date", participants: ["test@example.com"] });

    expect(badDate.status).toBe(500);
    expect(badDate.body.message).toContain("Invalid date format");
  });
});

describe("Brain API", () => {
  it("GET /api/brain/suggestions should return empty list for fresh user path", async () => {
    const user2Suggestions = await request(app)
      .get(`${API_PREFIX}/brain/suggestions`)
      .set(auth(secondAccessToken));

    expect(user2Suggestions.status).toBe(200);
    expect(Array.isArray(user2Suggestions.body.data)).toBe(true);
  });

  it("GET /api/brain/suggestions should return created suggestion", async () => {
    decisionId = await createSuggestedDecision(userId, leadId);

    const { res, ms } = await timed(
      request(app)
        .get(`${API_PREFIX}/brain/suggestions`)
        .set(auth(accessToken))
    );

    expect(res.status).toBe(200);
    expect(res.body.data.some((d: any) => d.id === decisionId)).toBe(true);
    expectFast(ms, "/api/brain/suggestions");
  });

  it("POST /api/brain/:id/approve should approve suggestion", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/brain/${decisionId}/approve`)
      .set(auth(accessToken))
      .send({});

    expect(res.status).toBe(200);
    expect(["approved", "executed"]).toContain(res.body.data.status);
  });

  it("POST /api/brain/:id/reject should reject suggestion", async () => {
    const decisionToReject = await createSuggestedDecision(userId, leadId);

    const res = await request(app)
      .post(`${API_PREFIX}/brain/${decisionToReject}/reject`)
      .set(auth(accessToken))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
  });

  it("POST /api/brain/:id/approve should handle invalid decision id", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/brain/11111111-1111-1111-1111-111111111111/approve`)
      .set(auth(accessToken))
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("Decision not found");
  });
});

describe("Dedup API", () => {
  let baseDedupId = "";
  let duplicateDedupId = "";

  it("GET /api/dedup should find duplicate groups", async () => {
    const base = await createLead(accessToken, {
      company: "Merge Corp",
      email: "merge@example.com",
      phone: "9999999999",
      value: 10000,
    });

    const duplicate = await createLead(accessToken, {
      company: "Merge Corp",
      email: "merge@example.com",
      phone: "9999999999",
      value: 20000,
    });

    baseDedupId = base.id;
    duplicateDedupId = duplicate.id;

    const res = await request(app)
      .get(`${API_PREFIX}/dedup`)
      .set(auth(accessToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/dedup/merge should validate required fields", async () => {
    const bad = await request(app)
      .post(`${API_PREFIX}/dedup/merge`)
      .set(auth(accessToken))
      .send({});

    expect(bad.status).toBe(400);
  });

  it("POST /api/dedup/merge should reject self-merge", async () => {
    const selfLead = await createLead(accessToken, {
      company: "Self Merge Co",
      email: "self-merge@example.com",
      phone: "9000000000",
    });

    const res = await request(app)
      .post(`${API_PREFIX}/dedup/merge`)
      .set(auth(accessToken))
      .send({ baseId: selfLead.id, duplicateIds: [selfLead.id] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("baseId cannot be part of duplicateIds");
  });

  it("POST /api/dedup/merge should merge and remove duplicates", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/dedup/merge`)
      .set(auth(accessToken))
      .send({ baseId: baseDedupId, duplicateIds: [duplicateDedupId] });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      mergedInto: baseDedupId,
      removed: [duplicateDedupId],
    });

    const removedLead = await db.lead.findUnique({ where: { id: duplicateDedupId } });
    expect(removedLead).toBeNull();
  });
});

describe("Export API", () => {
  it("GET /api/export/csv should return downloadable CSV", async () => {
    const { res, ms } = await timed(
      request(app)
        .get(`${API_PREFIX}/export/csv`)
        .set(auth(accessToken))
    );

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(typeof res.text).toBe("string");
    const [headerLine] = res.text.split("\n");
    expect(headerLine).toContain('"name"');
    expect(headerLine).toContain('"company"');
    expect(headerLine).toContain('"value"');
    expect(headerLine).toContain('"score"');
    expect(headerLine).toContain('"stage"');
    expectFast(ms, "/api/export/csv");
  });

  it("GET /api/export/excel should return export payload", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/export/excel`)
      .set(auth(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/export/pdf should return export payload", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/export/pdf`)
      .set(auth(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("title");
  });
});

describe("Stages API", () => {
  it("GET /api/stages should return default stages", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/stages`)
      .set(auth(accessToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toContain("Discovery");
  });

  it("POST /api/stages/add should append stage", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/stages/add`)
      .set(auth(accessToken))
      .send({ stage: "Legal Review" });

    expect(res.status).toBe(200);
    expect(res.body.data).toContain("Legal Review");
  });

  it("PUT /api/stages should replace stage list", async () => {
    const updatedStages = ["Discovery", "Qualified", "Proposal", "Won"];

    const res = await request(app)
      .put(`${API_PREFIX}/stages`)
      .set(auth(accessToken))
      .send({ stages: updatedStages });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updatedStages);
  });

  it("POST /api/stages/remove should remove stage", async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/stages/remove`)
      .set(auth(accessToken))
      .send({ stage: "Won" });

    expect(res.status).toBe(200);
    expect(res.body.data).not.toContain("Won");
  });
});

describe("Cross-cutting auth guards", () => {
  const protectedRequests: Array<{ label: string; req: () => Test }> = [
    { label: "onboarding", req: () => request(app).post(`${API_PREFIX}/onboarding/start`).send({ name: "A" }) },
    { label: "leads", req: () => request(app).get(`${API_PREFIX}/leads`) },
    { label: "activities", req: () => request(app).get(`${API_PREFIX}/activities`) },
    { label: "payments", req: () => request(app).get(`${API_PREFIX}/payments`) },
    { label: "analytics", req: () => request(app).get(`${API_PREFIX}/analytics/dashboard`) },
    { label: "communication/email", req: () => request(app).post(`${API_PREFIX}/communication/email`).send({}) },
    { label: "brain", req: () => request(app).get(`${API_PREFIX}/brain/suggestions`) },
    { label: "dedup", req: () => request(app).get(`${API_PREFIX}/dedup`) },
    { label: "export", req: () => request(app).get(`${API_PREFIX}/export/csv`) },
    { label: "stages", req: () => request(app).get(`${API_PREFIX}/stages`) },
  ];

  it("all protected modules should return 401 without token", async () => {
    for (const item of protectedRequests) {
      const res = await item.req();
      expect(res.status, `no-token failed on ${item.label}`).toBe(401);
    }
  });

  it("all protected modules should return 401 with invalid token", async () => {
    for (const item of protectedRequests) {
      const res = await item.req().set(auth("invalid.token.value"));
      expect(res.status, `invalid-token failed on ${item.label}`).toBe(401);
    }
  });

  it("should log errors through middleware for failing requests", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await request(app)
      .post(`${API_PREFIX}/activities`)
      .set(auth(accessToken))
      .send({ type: "call" });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("Relation integrity", () => {
  it("deleting lead should cascade activities and payments", async () => {
    const ownerLead = await createLead(accessToken, { company: "Cascade Co" });

    await request(app)
      .post(`${API_PREFIX}/activities`)
      .set(auth(accessToken))
      .send({ leadId: ownerLead.id, type: "call", note: "Cascade test" });

    await request(app)
      .post(`${API_PREFIX}/payments`)
      .set(auth(accessToken))
      .send({ leadId: ownerLead.id, amount: 1234 });

    const del = await request(app)
      .delete(`${API_PREFIX}/leads/${ownerLead.id}`)
      .set(auth(accessToken));

    expect(del.status).toBe(200);

    const activities = await request(app)
      .get(`${API_PREFIX}/activities/lead/${ownerLead.id}`)
      .set(auth(accessToken));

    const payments = await request(app)
      .get(`${API_PREFIX}/payments?leadId=${ownerLead.id}`)
      .set(auth(accessToken));

    expect(activities.status).toBe(200);
    expect(Array.isArray(activities.body.data)).toBe(true);
    expect(activities.body.data.length).toBe(0);

    expect(payments.status).toBe(404);
    expect(payments.body.message).toBe("LEAD_NOT_FOUND");
  });
});
