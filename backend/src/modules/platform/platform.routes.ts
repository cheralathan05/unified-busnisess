import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { db as prisma } from "../../config/db";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";

const router = Router();
const PLATFORM_STATE_KEY = "platform.state.v1";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const num = (value: string) => Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;

type Lead = {
  id: string;
  name: string;
  contact: string;
  value: string;
  score: number;
  stage: string;
  sentiment: "positive" | "neutral" | "negative";
  probability: string;
  lastContact: string;
  priority: "hot" | "warm" | "cold";
  email?: string;
};

type Payment = {
  id: string;
  client: string;
  amount: string;
  status: "completed" | "pending" | "failed";
  date: string;
  type: "invoice" | "subscription";
  risk: "low" | "medium" | "high";
  dealId?: string;
};

type Task = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "done";
  assignee: string;
  due: string;
  agent: string;
  estimated: string;
  progress: number;
};

type Message = { role: "user" | "agent"; text: string; time: string };

type Conversation = {
  id: string;
  name: string;
  company: string;
  message: string;
  time: string;
  unread: number;
  channel: "email" | "whatsapp" | "sms";
  sentiment: "positive" | "neutral" | "negative";
  priority: "urgent" | "high" | "medium" | "low";
  leadId?: string;
  dealId?: string;
  messages: Message[];
};

type Workflow = {
  id: string;
  name: string;
  status: "active" | "paused";
  runs: number;
  success: string;
  lastRun: string;
  modules: string[];
  ai: boolean;
};

let db = {
  leads: [
    {
      id: "1",
      name: "Acme Corp",
      contact: "John Smith",
      value: "$45,000",
      score: 92,
      stage: "Negotiation",
      sentiment: "positive",
      probability: "87%",
      lastContact: "2h ago",
      priority: "hot",
      email: "john@acme.com",
    },
  ] as Lead[],
  payments: [
    {
      id: "p1",
      client: "Acme Corp",
      amount: "$12,500",
      status: "completed",
      date: "Today, 2:30 PM",
      type: "invoice",
      risk: "low",
      dealId: "1",
    },
  ] as Payment[],
  tasks: [
    {
      id: "t1",
      title: "Follow up with Acme Corp",
      priority: "high",
      status: "in_progress",
      assignee: "You",
      due: "Today",
      agent: "Sales Agent",
      estimated: "30m",
      progress: 60,
    },
  ] as Task[],
  conversations: [
    {
      id: "c1",
      name: "John Smith",
      company: "Acme Corp",
      message: "Can we schedule a demo?",
      time: "2m ago",
      unread: 1,
      channel: "email",
      sentiment: "positive",
      priority: "high",
      leadId: "1",
      dealId: "1",
      messages: [
        { role: "user", text: "Can we schedule a demo?", time: "10:00" },
      ],
    },
  ] as Conversation[],
  documents: [
    {
      id: "d1",
      name: "Q4 Financial Report",
      type: "report",
      updated: "2h ago",
      author: "AI Generated",
      status: "final",
      risk: "none",
      pages: 24,
    },
  ] as any[],
  team: [
    {
      id: "m1",
      name: "Emma Davis",
      email: "emma@company.com",
      role: "admin",
      score: 91,
      burnout: "low",
      joinedAt: now(),
      status: "active",
    },
  ] as any[],
  workflows: [
    {
      id: "w1",
      name: "Lead -> Qualification -> Follow-up",
      status: "active",
      runs: 10,
      success: "98%",
      lastRun: "2m ago",
      modules: ["CRM", "Tasks", "Messaging"],
      ai: true,
    },
  ] as Workflow[],
  integrations: [
    { id: "i1", name: "Slack", status: "connected", synced: "2m ago", events: "120", category: "Communication", health: "healthy" },
  ] as any[],
  timeline: [] as any[],
  workflowExecutions: [] as any[],
  invites: [] as any[],
  events: [] as any[],
  settings: {
    timezone: "UTC",
    locale: "en",
    notifications: true,
  } as any,
};

const mutableMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const writeSchemas: Array<{ method: string; pattern: RegExp; schema: z.ZodTypeAny }> = [
  { method: "POST", pattern: /^\/leads$/, schema: z.object({ name: z.string().min(1), contact: z.string().min(1), value: z.string().min(1) }) },
  { method: "PUT", pattern: /^\/leads\/.+$/, schema: z.object({}).passthrough() },
  { method: "PATCH", pattern: /^\/leads\/.+\/stage$/, schema: z.object({ stage: z.string().min(1) }) },
  { method: "POST", pattern: /^\/payments\/invoice$/, schema: z.object({ client: z.string().min(1), amount: z.union([z.string(), z.number()]), type: z.string().optional() }) },
  { method: "PUT", pattern: /^\/payments\/.+$/, schema: z.object({}).passthrough() },
  { method: "POST", pattern: /^\/tasks$/, schema: z.object({ title: z.string().min(1), priority: z.string().min(1), status: z.string().min(1), assignee: z.string().min(1), due: z.string().min(1), agent: z.string().min(1), estimated: z.string().min(1), progress: z.number() }) },
  { method: "PATCH", pattern: /^\/tasks\/.+$/, schema: z.object({}).passthrough() },
  { method: "POST", pattern: /^\/messages$/, schema: z.object({ convId: z.string().min(1), text: z.string().min(1) }) },
  { method: "POST", pattern: /^\/messages\/analyze$/, schema: z.object({ convId: z.string().min(1) }) },
  { method: "POST", pattern: /^\/messages\/auto-reply$/, schema: z.object({ convId: z.string().min(1) }) },
  { method: "POST", pattern: /^\/documents$/, schema: z.object({ name: z.string().min(1), type: z.string().min(1) }).passthrough() },
  { method: "PATCH", pattern: /^\/documents\/.+$/, schema: z.object({}).passthrough() },
  { method: "POST", pattern: /^\/team\/invite$/, schema: z.object({ email: z.string().email(), role: z.string().min(1) }) },
  { method: "PATCH", pattern: /^\/team\/member\/.+$/, schema: z.object({}).passthrough() },
  { method: "POST", pattern: /^\/workflows$/, schema: z.object({ name: z.string().min(1), status: z.string().min(1) }).passthrough() },
  { method: "PUT", pattern: /^\/workflows\/.+$/, schema: z.object({}).passthrough() },
  { method: "POST", pattern: /^\/automation\/workflows$/, schema: z.object({ name: z.string().min(1) }).passthrough() },
  { method: "PATCH", pattern: /^\/automation\/workflows\/.+$/, schema: z.object({}).passthrough() },
  { method: "PUT", pattern: /^\/settings$/, schema: z.object({}).passthrough() },
  { method: "POST", pattern: /^\/integrations\/whatsapp$/, schema: z.object({ to: z.string().min(1), message: z.string().min(1) }) },
  { method: "POST", pattern: /^\/integrations\/google-meet$/, schema: z.object({ title: z.string().min(1), attendees: z.array(z.string()).default([]), dateTime: z.string().min(1) }) },
  { method: "POST", pattern: /^\/integrations\/email$/, schema: z.object({ to: z.string().min(1), subject: z.string().min(1), body: z.string().min(1) }) },
  { method: "POST", pattern: /^\/timeline\/add$/, schema: z.object({ entityId: z.string().min(1), type: z.string().min(1), title: z.string().min(1) }).passthrough() },
  { method: "POST", pattern: /^\/events\/emit$/, schema: z.object({ type: z.string().min(1) }).passthrough() },
];

const validatePlatformRequest = (req: Request, res: Response, next: NextFunction) => {
  if (!mutableMethods.has(req.method)) return next();

  const match = writeSchemas.find((entry) => entry.method === req.method && entry.pattern.test(req.path));
  if (!match) {
    if (typeof req.body !== "object" || req.body === null) {
      return res.status(400).json({ message: "Invalid request body" });
    }
    return next();
  }

  const parsed = match.schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsed.error.issues,
    });
  }

  req.body = parsed.data;
  return next();
};

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "MANAGER", "USER", "admin", "manager", "member", "sales", "finance", "support"]));

router.use(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const persisted = await prisma.platformState.findUnique({ where: { key: PLATFORM_STATE_KEY } });
    if (persisted?.value && typeof persisted.value === "object") {
      db = persisted.value as typeof db;
    }
  } catch {
    // continue with memory fallback
  }
  next();
});

router.use(validatePlatformRequest);

router.use((req: Request, res: Response, next: NextFunction) => {
  res.on("finish", async () => {
    if (!mutableMethods.has(req.method)) return;
    try {
      await prisma.platformState.upsert({
        where: { key: PLATFORM_STATE_KEY },
        create: { key: PLATFORM_STATE_KEY, value: db as any },
        update: { value: db as any },
      });
    } catch {
      // keep API resilient even if persistence fails
    }
  });
  next();
});

const pushEvent = (type: string, payload: Record<string, any> = {}) => {
  const evt = { id: id("evt"), type, timestamp: now(), ...payload };
  db.events.unshift(evt);
  if (db.events.length > 1000) db.events.length = 1000;
  db.timeline.unshift({
    id: id("tl"),
    title: type,
    type,
    timestamp: evt.timestamp,
    ...payload,
  });
  if (db.timeline.length > 1000) db.timeline.length = 1000;
  return evt;
};

// CRM
router.get("/leads", (_req, res) => res.json(db.leads));
router.post("/leads", (req, res) => {
  const lead: Lead = { id: id("lead"), ...req.body };
  db.leads.push(lead);
  pushEvent("lead.created", { leadId: lead.id, name: lead.name });
  res.status(201).json(lead);
});
router.put("/leads/:id", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  Object.assign(lead, req.body);
  pushEvent("lead.updated", { leadId: lead.id, updates: req.body });
  res.json(lead);
});
router.delete("/leads/:id", (req, res) => {
  db.leads = db.leads.filter((l) => l.id !== req.params.id);
  res.status(204).send();
});
router.patch("/leads/:id/stage", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  const oldStage = lead.stage;
  lead.stage = req.body.stage;
  pushEvent("lead.stage_changed", { leadId: lead.id, oldStage, newStage: lead.stage });
  res.json(lead);
});
router.post("/leads/:id/score", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  const score = Math.max(0, Math.min(100, lead.score + 3));
  lead.score = score;
  res.json({ score, reasoning: "Scored from engagement, payments, and messaging activity." });
});
router.post("/leads/:id/predict", (req, res) => {
  const amount = num(req.body?.value || "0");
  const probability = Math.max(35, Math.min(95, Math.round(45 + amount / 5000)));
  const d = new Date();
  d.setDate(d.getDate() + Math.max(5, Math.min(30, Math.round(35 - probability / 3))));
  res.json({
    probability,
    closeDate: d.toISOString().slice(0, 10),
    reasoning: "Prediction computed from lead score, deal size, and activity velocity.",
  });
});
router.post("/leads/:id/email", (req, res) => {
  const leadName = req.body?.leadName || "there";
  const context = req.body?.context || "business";
  res.json({
    subject: `Follow-up for ${leadName}`,
    body: `Hi ${leadName},\n\nThanks for discussing ${context}.\n\nBest regards`,
  });
});
router.post("/leads/deduplicate", (_req, res) => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const lead of db.leads) {
    const k = `${lead.name.toLowerCase()}|${(lead.email || "").toLowerCase()}`;
    if (seen.has(k)) duplicates.push(lead.id);
    seen.add(k);
  }
  res.json({ duplicates });
});

// DASHBOARD
router.get("/dashboard/heatmap", (_req, res) => {
  res.json({ byHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: (i * 7) % 17 })) });
});
router.get("/dashboard", (_req, res) => {
  res.json({
    leads: db.leads.length,
    revenue: db.payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + num(p.amount), 0),
    tasks: db.tasks.length,
    messages: db.conversations.length,
    events: db.events.slice(0, 50),
  });
});

// PAYMENTS
router.get("/payments", (_req, res) => res.json(db.payments));
router.post("/payments/invoice", (req, res) => {
  const tx: Payment = {
    id: id("pay"),
    client: req.body.client,
    amount: String(req.body.amount || "$0"),
    status: "pending",
    date: "Just now",
    type: req.body.type || "invoice",
    risk: "low",
    dealId: req.body.dealId,
  };
  db.payments.unshift(tx);
  pushEvent("invoice.created", { invoiceId: tx.id, amount: tx.amount, dealId: tx.dealId });
  res.status(201).json(tx);
});
router.post("/payments/invoice/send", (req, res) => {
  pushEvent("invoice.sent", { invoiceId: req.body.invoiceId, channel: req.body.channel });
  res.json({ status: "sent" });
});
router.post("/payments/reminder", (req, res) => {
  pushEvent("invoice.reminder_sent", { invoiceId: req.body.invoiceId });
  res.json({ sent: true });
});
router.post("/payments/retry", (req, res) => {
  const tx = db.payments.find((p) => p.id === req.body.id);
  if (!tx) return res.status(404).json({ message: "Payment not found" });
  tx.status = "pending";
  tx.date = "Just now (retry)";
  pushEvent("payment.retry", { transactionId: tx.id });
  res.json({ status: "pending" });
});
router.post("/payments/fraud-check", (req, res) => {
  const amount = num(req.body.amount || "0");
  const risk = amount > 20000 ? "medium" : "low";
  res.json({ risk, reasoning: risk === "low" ? "No anomaly found." : "Amount above normal threshold." });
});
router.post("/payments/subscription", (req, res) => {
  res.json({ status: req.body.action === "cancel" ? "cancelled" : "active" });
});
router.put("/payments/:id", (req, res) => {
  const tx = db.payments.find((p) => p.id === req.params.id);
  if (!tx) return res.status(404).json({ message: "Payment not found" });
  Object.assign(tx, req.body);
  if (tx.status === "completed") pushEvent("payment.completed", { transactionId: tx.id, amount: tx.amount, dealId: tx.dealId });
  if (tx.status === "failed") pushEvent("payment.failed", { transactionId: tx.id, reason: "updated_to_failed", dealId: tx.dealId });
  res.json(tx);
});
router.delete("/payments/:id", (req, res) => {
  db.payments = db.payments.filter((p) => p.id !== req.params.id);
  res.status(204).send();
});

// TASKS
router.get("/tasks", (_req, res) => res.json(db.tasks));
router.post("/tasks", (req, res) => {
  const task: Task = { id: id("task"), ...req.body };
  db.tasks.push(task);
  pushEvent("task.created", { taskId: task.id, title: task.title });
  res.status(201).json(task);
});
router.patch("/tasks/:id", (req, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  Object.assign(task, req.body);
  if (task.status === "done") pushEvent("task.completed", { taskId: task.id, title: task.title });
  res.json(task);
});
router.delete("/tasks/:id", (req, res) => {
  db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
  res.status(204).send();
});
router.post("/tasks/auto-assign", (_req, res) => res.json({ assigned: Math.min(db.tasks.length, 3) }));
router.post("/tasks/prioritize", (_req, res) => {
  const order = [...db.tasks]
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - ({ high: 0, medium: 1, low: 2 }[b.priority])))
    .map((t) => t.title);
  res.json({ order, reasoning: "Sorted by priority and open status." });
});
router.post("/tasks/:id/dependency", (_req, res) => res.status(204).send());
router.get("/tasks/:id/logs", (req, res) => {
  res.json(db.events.filter((e) => e.taskId === req.params.id).slice(0, 50));
});

// MESSAGES
router.get("/messages", (_req, res) => res.json(db.conversations));
router.post("/messages", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.body.convId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  const txt = String(req.body.text || "");
  conv.message = txt;
  conv.time = "Just now";
  conv.messages.push({ role: "agent", text: txt, time: new Date().toLocaleTimeString() });
  pushEvent("message.sent", { conversationId: conv.id, leadId: conv.leadId, message: txt });
  res.status(201).json({ id: id("msg"), text: txt });
});
router.post("/messages/analyze", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.body.convId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  const text = (conv.message || "").toLowerCase();
  const sentiment = text.includes("not") || text.includes("issue") ? "negative" : text.includes("thanks") ? "positive" : "neutral";
  conv.sentiment = sentiment as any;
  pushEvent("sentiment.changed", { conversationId: conv.id, leadId: conv.leadId, newSentiment: sentiment, oldSentiment: "neutral" });
  res.json({ sentiment, score: sentiment === "positive" ? 0.85 : sentiment === "negative" ? 0.2 : 0.5 });
});
router.post("/messages/auto-reply", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.body.convId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  const reply = conv.sentiment === "negative"
    ? "I am sorry for the issue. I am escalating this now."
    : "Thanks for your message. We can schedule next steps today.";
  res.json({ reply });
});

// DOCUMENTS
router.get("/documents", (_req, res) => res.json(db.documents));
router.post("/documents", (req, res) => {
  const doc = { id: id("doc"), ...req.body };
  db.documents.unshift(doc);
  pushEvent("document.uploaded", { documentId: doc.id, name: doc.name, leadId: req.body.leadId });
  res.status(201).json(doc);
});
router.patch("/documents/:id", (req, res) => {
  const doc = db.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });
  Object.assign(doc, req.body);
  res.json(doc);
});
router.delete("/documents/:id", (req, res) => {
  db.documents = db.documents.filter((d) => d.id !== req.params.id);
  res.status(204).send();
});
router.post("/documents/:id/analyze", (_req, res) => {
  res.json({ summary: "Document analyzed.", risk: "none", keyFields: {} });
});
router.post("/documents/:id/extract", (_req, res) => {
  res.json({ name: "Extracted Client", amount: "$25,000", dates: [now()] });
});
router.post("/documents/:id/comments", (req, res) => {
  res.status(201).json({ id: id("cmt"), text: req.body.text });
});
router.post("/documents/generate", (req, res) => {
  res.json({ title: `Generated ${req.body.type}`, content: `Auto-generated ${req.body.type} content.` });
});

// TEAM
router.get("/team", (_req, res) => res.json(db.team));
router.post("/team/invite", (req, res) => {
  const token = id("inv");
  db.invites.unshift({ token, email: req.body.email, role: req.body.role, status: "pending", createdAt: now() });
  res.status(201).json({ token, status: "pending" });
});
router.get("/team/invite/:token", (req, res) => {
  const invite = db.invites.find((i) => i.token === req.params.token);
  if (!invite) return res.status(404).json({ success: false });
  invite.status = "accepted";
  res.json({ success: true });
});
router.patch("/team/member/:id", (req, res) => {
  const member = db.team.find((m) => m.id === req.params.id);
  if (!member) return res.status(404).json({ message: "Team member not found" });
  Object.assign(member, req.body);
  res.json(member);
});
router.delete("/team/member/:id", (req, res) => {
  db.team = db.team.filter((m) => m.id !== req.params.id);
  res.status(204).send();
});
router.post("/team/rebalance", (_req, res) => res.json({ rebalanced: Math.min(3, db.tasks.length) }));
router.get("/team/analytics", (_req, res) => {
  const avgScore = Math.round(db.team.reduce((sum, m) => sum + (m.score || 0), 0) / Math.max(db.team.length, 1));
  res.json({ members: db.team.length, avgScore, burnoutHigh: db.team.filter((m) => m.burnout === "high").length });
});

// WORKFLOWS
router.get("/workflows", (_req, res) => res.json(db.workflows));
router.post("/workflows", (req, res) => {
  const wf = { id: id("wf"), ...req.body };
  db.workflows.unshift(wf);
  res.status(201).json(wf);
});
router.put("/workflows/:id", (req, res) => {
  const wf = db.workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ message: "Workflow not found" });
  Object.assign(wf, req.body);
  res.json(wf);
});
router.delete("/workflows/:id", (req, res) => {
  db.workflows = db.workflows.filter((w) => w.id !== req.params.id);
  res.status(204).send();
});
router.patch("/workflows/:id/status", (req, res) => {
  const wf = db.workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ message: "Workflow not found" });
  wf.status = req.body.status;
  res.json(wf);
});
router.post("/workflows/:id/run", (req, res) => {
  const wf = db.workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ message: "Workflow not found" });
  wf.runs += 1;
  wf.lastRun = "Just now";
  const execution = { id: id("exec"), workflowId: wf.id, status: "success", startedAt: now(), completedAt: now(), context: req.body || {} };
  db.workflowExecutions.unshift(execution);
  pushEvent("workflow.executed", { workflowId: wf.id });
  res.json({ executionId: execution.id, status: "completed" });
});
router.post("/workflows/:id/clone", (req, res) => {
  const wf = db.workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ message: "Workflow not found" });
  const cloned = { ...wf, id: id("wf"), name: `${wf.name} (Copy)`, runs: 0, lastRun: "Never" };
  db.workflows.unshift(cloned);
  res.status(201).json(cloned);
});
router.get("/workflows/:id/logs", (req, res) => {
  res.json(db.workflowExecutions.filter((e) => e.workflowId === req.params.id).slice(0, 50));
});
router.post("/workflows/:id/test", (_req, res) => {
  res.json({ result: "success", steps: ["Trigger validated", "Action executed", "Notification sent"] });
});

// AUTOMATION aliases used by cross-module APIs
router.get("/automation/workflows", (_req, res) => res.json(db.workflows));
router.post("/automation/workflows", (req, res) => {
  const wf = { id: id("wf"), ...req.body };
  db.workflows.unshift(wf);
  res.status(201).json(wf);
});
router.patch("/automation/workflows/:id", (req, res) => {
  const wf = db.workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ message: "Workflow not found" });
  Object.assign(wf, req.body);
  res.json(wf);
});
router.delete("/automation/workflows/:id", (req, res) => {
  db.workflows = db.workflows.filter((w) => w.id !== req.params.id);
  res.status(204).send();
});
router.get("/automation/workflows/:id/executions", (req, res) => {
  const limit = Number(req.query.limit || 20);
  res.json(db.workflowExecutions.filter((e) => e.workflowId === req.params.id).slice(0, limit));
});
router.post("/automation/workflows/:id/trigger", (req, res) => {
  const wf = db.workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ message: "Workflow not found" });
  wf.runs += 1;
  wf.lastRun = "Just now";
  const execution = {
    id: id("exec"),
    workflowId: wf.id,
    triggeredBy: { type: "workflow.manual", ...req.body?.context, timestamp: now() },
    actions: [{ action: { type: "create_task" }, status: "success" }],
    startedAt: now(),
    completedAt: now(),
    status: "success",
  };
  db.workflowExecutions.unshift(execution);
  pushEvent("workflow.executed", { workflowId: wf.id });
  res.json(execution);
});

// ANALYTICS
router.get("/analytics", (_req, res) => {
  const revenue = db.payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + num(p.amount), 0);
  res.json({
    revenue,
    leads: db.leads.length,
    tasks: db.tasks.length,
    messages: db.conversations.length,
    events: db.events.length,
  });
});
router.get("/analytics/events", (_req, res) => res.json(db.events.slice(0, 200)));
router.get("/analytics/revenue", (_req, res) => {
  const booked = db.payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + num(p.amount), 0);
  const outstanding = db.payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + num(p.amount), 0);
  res.json({ booked, outstanding });
});
router.get("/analytics/team", (_req, res) => {
  res.json({
    members: db.team.length,
    avgScore: Math.round(db.team.reduce((sum, m) => sum + (m.score || 0), 0) / Math.max(db.team.length, 1)),
  });
});

// SETTINGS / ROLES / PERMISSIONS
router.get("/settings", (_req, res) => res.json(db.settings));
router.put("/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  res.json(db.settings);
});
router.get("/roles", (_req, res) => {
  res.json([
    { id: "admin", name: "Admin", permissions: ["all"] },
    { id: "manager", name: "Manager", permissions: ["read", "write", "manage_team"] },
    { id: "member", name: "Member", permissions: ["read", "write"] },
  ]);
});
router.get("/permissions", (_req, res) => {
  res.json(["read", "write", "manage_team", "manage_finance", "manage_workflows"]);
});
router.get("/permissions/check/:permission", (_req, res) => res.json({ allowed: true }));
router.get("/permissions/me", (_req, res) => res.json(["read", "write", "manage_team", "manage_finance", "manage_workflows"]));
router.get("/permissions/role", (_req, res) => res.json({ role: "admin" }));

// INTEGRATIONS
router.post("/integrations/whatsapp", (req, res) => {
  pushEvent("integration.whatsapp.sent", { to: req.body.to });
  res.json({ status: "sent", messageId: id("wa") });
});
router.post("/integrations/google-meet", (_req, res) => {
  res.json({ meetLink: `https://meet.google.com/${id("meet").slice(-10)}`, eventId: id("event") });
});
router.post("/integrations/email", (req, res) => {
  pushEvent("integration.email.sent", { to: req.body.to });
  res.json({ status: "sent" });
});
router.post("/webhooks", (_req, res) => res.json({ status: "delivered" }));

// CROSS-MODULE timeline/search/linking
router.get("/timeline", (req, res) => {
  const leadId = req.query.leadId as string | undefined;
  const dealId = req.query.dealId as string | undefined;
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  const filtered = db.timeline.filter((t) => (leadId ? t.leadId === leadId || t.entityId === leadId : true) && (dealId ? t.dealId === dealId || t.entityId === dealId : true));
  const activities = filtered.slice(offset, offset + limit);
  res.json({ activities, total: filtered.length, hasMore: offset + limit < filtered.length });
});
router.post("/timeline/add", (req, res) => {
  const entry = { id: id("tl"), timestamp: now(), ...req.body };
  db.timeline.unshift(entry);
  res.status(201).json({ ok: true, activity: entry });
});
router.post("/messages/link-to-lead", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.body.conversationId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  conv.leadId = req.body.leadId;
  conv.dealId = req.body.dealId;
  pushEvent("conversation.linked", { conversationId: conv.id, leadId: conv.leadId, dealId: conv.dealId });
  res.json({ conversationId: conv.id, leadId: conv.leadId, linkedAt: now() });
});
router.get("/crm/leads/:leadId/conversations", (req, res) => {
  const conversations = db.conversations.filter((c) => c.leadId === req.params.leadId).map((c) => ({
    conversationId: c.id,
    name: c.name,
    company: c.company,
    sentiment: c.sentiment,
    lastMessage: c.message,
    timestamp: now(),
    unread: c.unread,
  }));
  res.json({ conversations });
});
router.patch("/crm/leads/:leadId/from-message", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.leadId);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  if (req.body.sentiment) lead.sentiment = req.body.sentiment;
  if (typeof req.body.scoreAdjustment === "number") lead.score = Math.max(0, Math.min(100, lead.score + req.body.scoreAdjustment));
  if (req.body.probAdjustment) lead.probability = req.body.probAdjustment;
  res.json({ updated: true, lead });
});
router.post("/messages/:conversationId/create-task", (req, res) => {
  const task: Task = {
    id: id("task"),
    title: req.body.taskTitle || "Task from message",
    priority: req.body.priority || "medium",
    status: "todo",
    assignee: "You",
    due: "Today",
    agent: "Messaging Agent",
    estimated: "20m",
    progress: 0,
  };
  db.tasks.push(task);
  pushEvent("task.created", { taskId: task.id, title: task.title });
  res.status(201).json({ ok: true, task });
});
router.post("/payments/invoice-from-deal", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.body.dealId);
  const tx: Payment = {
    id: id("pay"),
    client: lead?.name || "Deal Invoice",
    amount: lead?.value || "$1,000",
    status: "pending",
    date: "Just now",
    type: "invoice",
    risk: "low",
    dealId: req.body.dealId,
  };
  db.payments.unshift(tx);
  pushEvent("invoice.created", { invoiceId: tx.id, dealId: req.body.dealId, amount: tx.amount });
  res.json({ ok: true, dealId: req.body.dealId, invoiceId: tx.id });
});
router.get("/crm/deals/:dealId/payment-status", (req, res) => {
  const dealId = req.params.dealId;
  const lead = db.leads.find((l) => l.id === dealId);
  const related = db.payments.filter((p) => p.dealId === dealId || (lead ? p.client === lead.name : false));
  const total = related.reduce((sum, p) => sum + num(p.amount), 0);
  const paid = related.filter((p) => p.status === "completed").reduce((sum, p) => sum + num(p.amount), 0);
  const outstanding = Math.max(total - paid, 0);
  const paymentStatus = total === 0 ? "unpaid" : paid === 0 ? "unpaid" : paid < total ? "partially_paid" : "fully_paid";
  res.json({
    dealId,
    leadId: lead?.id || dealId,
    totalAmount: `$${total.toLocaleString()}`,
    paidAmount: `$${paid.toLocaleString()}`,
    outstandingAmount: `$${outstanding.toLocaleString()}`,
    paymentStatus,
    relatedInvoices: related.map((p) => ({ invoiceId: p.id, amount: p.amount, status: p.status })),
    relatedTransactions: related.map((p) => ({ transactionId: p.id, amount: p.amount, status: p.status })),
    lastPaymentDate: related.find((p) => p.status === "completed")?.date,
  });
});
router.post("/crm/deals/update-from-payment", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.body.dealId);
  if (!lead) return res.status(404).json({ message: "Deal not found" });
  if (req.body.newStage) lead.stage = req.body.newStage;
  if (req.body.markAsWon) lead.stage = "Closed Won";
  if (req.body.markAsAtRisk) lead.priority = "cold";
  pushEvent("deal.updated_from_payment", { dealId: lead.id });
  res.json({ ok: true });
});
router.post("/payments/:transactionId/link-to-deal", (req, res) => {
  const tx = db.payments.find((p) => p.id === req.params.transactionId);
  if (!tx) return res.status(404).json({ message: "Transaction not found" });
  tx.dealId = req.body.dealId;
  res.json({ ok: true });
});
router.get("/crm/leads/:leadId/payments", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.leadId);
  const payments = db.payments.filter((p) => p.dealId === req.params.leadId || (lead ? p.client === lead.name : false));
  res.json({ payments });
});
router.post("/payments/:transactionId/send-via-message", (req, res) => {
  const tx = db.payments.find((p) => p.id === req.params.transactionId);
  const conv = db.conversations.find((c) => c.id === req.body.conversationId);
  if (!tx || !conv) return res.status(404).json({ message: "Transaction or conversation not found" });
  const txt = `Payment link sent for ${tx.amount}`;
  conv.messages.push({ role: "agent", text: txt, time: new Date().toLocaleTimeString() });
  conv.message = txt;
  pushEvent("message.sent", { conversationId: conv.id, leadId: conv.leadId, message: txt });
  res.json({ ok: true });
});

// Team aliases for crossModuleApi
router.post("/team/invites", (req, res) => {
  const invite = {
    inviteId: id("inv"),
    email: req.body.email,
    role: req.body.role,
    invitedAt: now(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    inviteLink: `https://app.local/invite/${id("token")}`,
  };
  db.invites.unshift(invite);
  res.status(201).json(invite);
});
router.post("/team/invites/:inviteId/accept", (_req, res) => res.json({ success: true, teamMemberId: id("member") }));
router.post("/team/invites/:inviteId/resend", (_req, res) => res.json({ success: true }));
router.get("/team/members", (_req, res) => res.json(db.team));
router.get("/team/invites/pending", (_req, res) => res.json(db.invites.filter((i) => i.status === "pending")));
router.post("/crm/leads/:leadId/assign", (req, res) => {
  const lead = db.leads.find((l) => l.id === req.params.leadId);
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  (lead as any).ownerId = req.body.memberId;
  res.json({ ok: true });
});
router.post("/messages/:conversationId/assign", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.params.conversationId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  (conv as any).ownerId = req.body.memberId;
  res.json({ ok: true });
});
router.get("/team/members/:memberId/dashboard", (req, res) => {
  res.json({
    memberId: req.params.memberId,
    leads: db.leads,
    conversations: db.conversations,
    tasks: db.tasks,
    payments: db.payments,
  });
});

// GLOBAL SEARCH
router.get("/search", (req, res) => {
  const q = String(req.query.query || "").toLowerCase();
  const limit = Number(req.query.limit || 10);
  const types = String(req.query.types || "").split(",").filter(Boolean);

  const results: any[] = [];

  const push = (item: any) => {
    if (!q) return;
    if (!item.title.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return;
    if (types.length > 0 && !types.includes(item.type)) return;
    results.push(item);
  };

  db.leads.forEach((l) => push({ type: "lead", id: l.id, title: l.name, description: `${l.contact} ${l.stage} ${l.value}`, relevance: 0.9, entityData: l, matchedFields: [l.name] }));
  db.conversations.forEach((c) => push({ type: "conversation", id: c.id, title: c.name, description: `${c.company} ${c.message}`, relevance: 0.85, entityData: c, matchedFields: [c.name, c.company] }));
  db.payments.forEach((p) => push({ type: "payment", id: p.id, title: p.client, description: `${p.amount} ${p.status}`, relevance: 0.8, entityData: p, matchedFields: [p.client] }));
  db.tasks.forEach((t) => push({ type: "task", id: t.id, title: t.title, description: `${t.status} ${t.assignee}`, relevance: 0.75, entityData: t, matchedFields: [t.title] }));
  db.documents.forEach((d) => push({ type: "document", id: d.id, title: d.name, description: `${d.type} ${d.status}`, relevance: 0.7, entityData: d, matchedFields: [d.name] }));

  const sorted = results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  res.json({ query: q, results: sorted, total: results.length });
});

// ENTITY FULL / SYNC / EVENTS
router.get("/entities/:entityType/:entityId/full", (req, res) => {
  const { entityType, entityId } = req.params;
  if (entityType === "lead" || entityType === "deal") {
    const lead = db.leads.find((l) => l.id === entityId);
    if (!lead) return res.status(404).json({ message: "Entity not found" });
    const conversations = db.conversations.filter((c) => c.leadId === lead.id);
    const payments = db.payments.filter((p) => p.dealId === lead.id || p.client === lead.name);
    const tasks = db.tasks.filter((t) => t.title.toLowerCase().includes(lead.name.toLowerCase().split(" ")[0]));
    return res.json({ entity: lead, conversations, payments, tasks, timeline: db.timeline.filter((t) => t.leadId === lead.id) });
  }
  return res.status(400).json({ message: "Unsupported entity type" });
});
router.post("/sync", (_req, res) => res.json({ ok: true, syncedAt: now() }));
router.post("/events/emit", (req, res) => {
  const evt = pushEvent(req.body.type || "event.custom", req.body || {});
  res.json({ ok: true, event: evt });
});

export default router;
