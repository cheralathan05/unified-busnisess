# AI Brain Layer Design (Next Level)

## 1) Purpose

Upgrade the CRM from event-reactive scoring to a controlled decision engine that can:

- Observe business state and events
- Propose next-best actions (NBA)
- Optionally execute low-risk actions automatically
- Learn from outcomes and improve policy quality

This keeps your core model:

State (DB) -> Events -> Reactions

and adds:

State + Events -> Decisions -> Actions -> Outcomes -> Learning

---

## 2) Brain Layer Position in System

## Existing pipeline (today)

Frontend Action -> API -> Service -> DB -> EventBus -> AI/Jobs/Socket

## Upgraded pipeline (target)

Frontend Action -> API -> Service -> DB -> EventBus
-> Brain Intake -> Context Builder -> Policy Engine -> Decision
-> Action Router (auto/manual) -> DB + EventBus + Socket
-> Outcome Tracker -> Learning Loop

---

## 3) Core Brain Components

## A. Brain Intake

Responsibilities:

- Subscribe to domain events (lead.created, lead.updated, payment.completed, activity.created, lead.atRisk, email.sent, call.scheduled)
- Normalize payloads to a single envelope
- Deduplicate bursts (idempotency key + debounce window)

Event envelope shape:

```ts
interface BrainEventEnvelope {
  id: string;                 // uuid
  name: string;               // e.g. lead.updated
  occurredAt: string;         // ISO timestamp
  tenantId: string;           // userId (multi-tenant boundary)
  entityType: "lead" | "payment" | "activity" | "communication";
  entityId: string;
  source: "api" | "job" | "system";
  payload: Record<string, unknown>;
  traceId?: string;
}
```

## B. Context Builder

Responsibilities:

- Build decision context from DB graph (lead + latest activities + payments + communication summary + stage history)
- Calculate compact features for policy evaluation
- Attach recency and confidence metadata

Context shape:

```ts
interface BrainContext {
  tenantId: string;
  leadId: string;
  snapshotAt: string;
  lead: {
    stage: string;
    value: number;
    score: number;
    sentiment?: string;
    probability?: number;
    lastActivityAt?: string;
  };
  activitySummary: {
    last7dCount: number;
    inactivityHours: number;
  };
  paymentSummary: {
    totalPaid: number;
    lastPaidAt?: string;
  };
  communicationSummary: {
    emailsSent7d: number;
    replies7d: number;
  };
  features: {
    riskLevel: "low" | "medium" | "high";
    urgency: "low" | "medium" | "high";
    momentum: "down" | "flat" | "up";
  };
}
```

## C. Policy Engine (Brain Core)

Responsibilities:

- Evaluate rules + model outputs
- Generate ranked action candidates
- Select action with a confidence score and reason trace

Policy output:

```ts
interface BrainDecision {
  id: string;
  tenantId: string;
  leadId: string;
  createdAt: string;
  triggerEvent: string;
  action: "send_followup_email" | "schedule_call" | "change_stage" | "create_task" | "noop";
  mode: "suggest" | "auto";
  confidence: number;         // 0..1
  priority: "low" | "medium" | "high";
  rationale: string[];
  guardrailsPassed: boolean;
  expiresAt?: string;
}
```

## D. Action Router

Responsibilities:

- Route decisions by risk policy
- Execute low-risk auto actions
- Queue medium/high-risk actions as suggestions for user approval

Suggested routing policy:

- Auto mode allowed only when confidence >= 0.85 and action is low-risk
- Suggest mode for all medium/high-risk actions
- Hard deny list for destructive operations

## E. Outcome Tracker

Responsibilities:

- Track if suggestion was accepted/rejected
- Track if auto action improved target KPI
- Emit outcomes for learning

Outcome events:

- brain.decision.created
- brain.action.executed
- brain.action.failed
- brain.suggestion.accepted
- brain.suggestion.rejected
- brain.outcome.recorded

## F. Learning Loop

Responsibilities:

- Compute rolling policy metrics by tenant and global
- Adjust thresholds (confidence cutoffs, cooldowns)
- Maintain feature importance snapshots

Important: start with offline learning (daily/weekly job), not real-time self-modification.

---

## 4) Decision Types (First Release)

## Low-risk auto actions

- create_task (follow-up reminder)
- send_followup_email draft generation (store draft, optionally auto-send by tenant setting)

## Suggest-only actions

- change_stage
- schedule_call
- high-value escalation

## Never auto

- delete lead
- close-lost transition
- any irreversible write without explicit user intent

---

## 5) Data Model Additions

Add these tables (Prisma models) for observability and learning.

## brain_decisions

- id
- tenantId
- leadId
- triggerEvent
- action
- mode
- confidence
- priority
- rationaleJson
- guardrailsPassed
- status (pending, executed, skipped, expired, failed)
- createdAt
- executedAt

## brain_actions

- id
- decisionId
- actionType
- payloadJson
- executionStatus
- executionError
- createdAt

## brain_outcomes

- id
- decisionId
- window (24h, 72h, 7d)
- metricName (reply_rate, stage_progression, conversion_delta)
- metricValue
- baselineValue
- delta
- createdAt

## brain_policy_versions

- id
- version
- configJson
- activatedAt
- activatedBy
- isActive

---

## 6) Event Contract (Recommended)

Standardize around one bus abstraction for domain and brain events.

Current codebase has two emitter concepts; Brain Layer should use one canonical bus to avoid split listeners.

Minimal event list to support Brain:

- lead.created
- lead.updated
- lead.atRisk
- payment.completed
- activity.created
- communication.email.sent
- communication.whatsapp.sent
- brain.decision.created
- brain.action.executed
- brain.outcome.recorded

---

## 7) Guardrails and Safety

## Loop prevention

- Add decision cooldown per lead/action (for example 6 hours)
- Add max decisions per lead/day (for example 5)
- Ignore events emitted by Brain itself unless explicitly marked re-entrant

## Tenant isolation

- Every decision and query scoped by tenantId
- No cross-tenant features in model inputs

## Explainability

- Persist rationale array and feature snapshot for each decision
- Expose explanation in API for audit and UX trust

## Fail-safe

- If Brain fails, core CRM flow must continue
- Use queue + retries with dead-letter handling for decision execution

---

## 8) API Surface (Brain)

Add endpoints:

- GET /brain/decisions?leadId=&status=
- POST /brain/decisions/:id/approve
- POST /brain/decisions/:id/reject
- GET /brain/insights/dashboard
- GET /brain/policies/active
- POST /brain/policies/:version/activate (admin)

Frontend impact:

- Suggestion inbox
- Lead page "Why this suggestion?"
- One-click approve/reject actions

---

## 9) Jobs for Brain

Add jobs:

- brainPolicyEvaluationJob (every 1h)
  - evaluate policy metrics and drift indicators

- brainLearningJob (daily)
  - aggregate outcomes
  - produce candidate policy config

- brainCleanupJob (daily)
  - archive expired decisions/outcomes

---

## 10) Phased Rollout Plan

## Phase 1 (Safe Foundation)

- Introduce Brain Intake + Context Builder + Decision persistence
- Generate suggestions only (no auto execution)
- Add Suggestion Inbox UI and approve/reject endpoints

Success criteria:

- >= 95% decision traceability
- Zero impact on existing lead/payment/activity flows

## Phase 2 (Controlled Autonomy)

- Enable low-risk auto actions behind feature flag
- Add guardrails, cooldowns, decision limits
- Add outcome tracking and KPI dashboards

Success criteria:

- measurable uplift in reply/stage progression
- no event storms or feedback loops

## Phase 3 (Self-Improving Policy)

- Introduce policy versions and scheduled promotion workflow
- Add offline policy training/evaluation
- Add tenant-level policy customization

Success criteria:

- policy versioning with rollback
- stable uplift across evaluation windows

---

## 11) Pseudocode for End-to-End Flow

```ts
eventBus.on("lead.updated", async (event) => {
  const envelope = brainIntake.normalize(event, "lead.updated");

  if (!brainGuardrails.accept(envelope)) return;

  const context = await contextBuilder.build(envelope);
  const decision = await policyEngine.decide(context, envelope);

  await decisionRepository.save(decision);
  eventBus.emit("brain.decision.created", decision);

  if (decision.mode === "auto" && decision.guardrailsPassed) {
    const result = await actionRouter.execute(decision);
    eventBus.emit("brain.action.executed", result);
  }
});
```

---

## 12) Metrics to Prove Brain Value

Primary KPIs:

- time_to_next_action (median)
- stage_progression_rate
- lead_conversion_rate
- inactivity_recovery_rate

Quality/Safety KPIs:

- suggestion_accept_rate
- auto_action_success_rate
- false_positive_rate (user rejects)
- loop_prevention_trigger_count

---

## 13) Immediate Engineering Priorities in Your Codebase

1. Unify event transport usage for new Brain events (avoid dual-emitter drift).
2. Add missing event constants source used by lead/communication modules.
3. Add Brain module skeleton:
   - brain.service
   - brain.policy
   - brain.context
   - brain.repository
   - brain.routes
4. Wire Brain listeners inside the central event initializer.
5. Start in suggest-only mode with feature flags.

---

## 14) Brain Layer Product Positioning

You move from:

CRUD CRM + Event AI scoring

to:

Decision-Centric CRM Engine

Where the platform does not just react to state changes, it continuously decides the best next action and proves decision quality over time.
