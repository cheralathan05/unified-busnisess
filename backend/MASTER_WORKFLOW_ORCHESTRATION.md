# 🚀 MASTER WORKFLOW ORCHESTRATION GUIDE

> **Never-Before-Seen Complete AUTH + CRM System**  
> Real system flow, control flow, data flow, event orchestration, AI integration at SaaS enterprise level

---

## 📋 TABLE OF CONTENTS

1. [System Architecture Overview](#system-architecture-overview)
2. [User Journey](#user-journey)
3. [AUTH Workflow](#auth-workflow)
4. [CRM Workflow](#crm-workflow)
5. [AI Orchestration Integration](#ai-orchestration-integration)
6. [Event Coordination](#event-coordination)
7. [Data Flow](#data-flow)
8. [Control Flow](#control-flow)
9. [State Machines](#state-machines)
10. [Complete User Journey Example](#complete-user-journey-example)

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        DIGITAL NEXUS MIND - SaaS System                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         CLIENT APPLICATIONS                         │  │
│  │                    (Web, Mobile, Integrations)                     │  │
│  └────────────────────┬────────────────────────────────────────────────┘  │
│                       │                                                     │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      AUTHENTICATION LAYER                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐         │  │
│  │  │ Register │  │  Login   │  │ Refresh  │  │ WebAuthn   │         │  │
│  │  │          │  │          │  │ Token    │  │ (FIDO2)    │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘         │  │
│  └────────────────────┬────────────────────────────────────────────────┘  │
│                       │                                                     │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   ORCHESTRATOR (Master Engine)                      │  │
│  │                                                                       │  │
│  │  Routes requests → Validates auth → Executes workflow → Emits events │  │
│  └────────────────────┬────────────────────────────────────────────────┘  │
│                       │                                                     │
│      ┌────────────────┼────────────────┬──────────────────┐                │
│      ▼                ▼                ▼                  ▼                │
│  ┌────────┐    ┌──────────┐    ┌────────────┐    ┌──────────────┐       │
│  │ ONBOARDING│ CRM MODULE │ │ AI BRAIN  │ │ ANALYTICS      │       │
│  │ • Teams   │ • Leads    │ │ • Signals │ │ • Dashboard    │       │
│  │ • Users   │ • Activities│ │ • Prompts │ │ • Metrics      │       │
│  │ • Config  │ • Payments  │ │ • Decisions│ │ • Forecasts    │       │
│  │ • Org     │ • Dedup    │ │ • Learning │ │ • Reports     │       │
│  └────────┘    └──────────┘    └────────────┘    └──────────────┘       │
│                       │                                                     │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        EVENT BUS (Pub/Sub)                          │  │
│  │  user.registered → lead.created → activity.created → payment.received │
│  │  → AI triggers → brain.suggested → decision.made → updates           │  │
│  └────────────────────┬────────────────────────────────────────────────┘  │
│                       │                                                     │
│      ┌────────────────┼───────────────┬──────────────┐                    │
│      ▼                ▼               ▼              ▼                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   ┌─────────────┐         │
│  │ Background│ │ Webhooks │ │ AI Jobs  │   │ Notifications │         │
│  │ Workers  │ │ (Stripe, │ │ (Hourly, │   │ (Email, SMS)  │         │
│  │ (Cron)   │ │ HubSpot) │ │ Daily)   │   │               │         │
│  └──────────┘    └──────────┘    └──────────┘   └─────────────┘         │
│                       │                                                     │
│                       ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      PERSISTENCE LAYER                              │  │
│  │              (PostgreSQL + Redis Cache + Audit Log)                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🛣️ USER JOURNEY

### Phase 1: Account Creation & Auth

```
┌──────────────┐
│  New User    │
└────┬─────────┘
     │ [1] Register with email/password
     ▼
┌──────────────────────┐
│ Create User Account  │────────────► Emit: user.registered
└────┬─────────────────┘
     │
     │ [2] Initialize organization
     ▼
┌──────────────────────┐
│ Setup Org Config     │────────────► Store default settings
└────┬─────────────────┘
     │
     │ [3] Send welcome email
     ▼
┌──────────────────────┐
│ Welcome Email Sent   │────────────► Enqueue mail job
└────┬─────────────────┘
     │
     │ [4] User logs in
     ▼
┌──────────────────────┐
│ JWT Token Issued     │────────────► accessToken + refreshToken
│ (30 min expiry)      │
└──────────────────────┘
```

### Phase 2: Lead Lifecycle

```
┌──────────────────────┐
│ Create Lead          │───────► Emit: lead.created
│ Name, Company, Email │
│ Value, Stage         │
└────┬─────────────────┘
     │
     │ AI Workflow Triggered
     │ • Extract signals: urgency, health, probability
     │ • Generate initial suggestion
     │ • Store in brain.Decision table
     ▼
┌──────────────────────┐
│ AI Suggests Action   │───────► Emit: brain.suggested
│ (Immediate followup) │
└────┬─────────────────┘
     │
     │ [Optional] User approves suggestion
     │ • System logs the action (approval = signal)
     │ • System executes the action
     ▼
┌──────────────────────┐
│ Create Activity      │───────► Emit: activity.created
│ (Call, Email, etc)   │
└────┬─────────────────┘
     │
     │ Lead state updates:
     │ • engagement +5, lastActivated = now
     │ • Re-evaluate health & score
     ▼
┌──────────────────────┐
│ Add Payment          │───────► Emit: payment.received
│ (Stripe integration) │
└────┬─────────────────┘
     │
     │ AI re-evaluates:
     │ • Update close probability
     │ • Move stage forward (if ready)
     ▼
┌──────────────────────┐
│ Lead Closed Won/Lost │───────► Archive & celebrate or learn
└──────────────────────┘
```

---

## 🔐 AUTH WORKFLOW

### Complete Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTH WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────┘

1️⃣  REGISTRATION
    ├─ User submits: email, password, name
    ├─ Validate: email format, password strength, unique email
    ├─ Hash password: argon2($password, salt)
    ├─ Create user: insert into db.user
    ├─ Event: emit("user.registered", { id, email })
    └─ Response: { id, email, createdAt }
       └─ Side Effects:
          ├─ Send welcome email
          ├─ Initialize organization
          ├─ Create default configurations
          └─ Log audit trail

2️⃣  LOGIN
    ├─ User submits: email, password
    ├─ Lookup: user by email
    ├─ Validate: password against stored hash
    ├─ Generate tokens:
    │  ├─ accessToken (JWT, 30 min expires)
    │  │  └─ Payload: { sub: userId, type: 'access', iat, exp }
    │  └─ refreshToken (JWT, 7 days expires)
    │     └─ Payload: { sub: userId, type: 'refresh', iat, exp, nonce }
    ├─ Store session: { userId, refreshTokenNonce, issuedAt }
    ├─ Event: emit("user.loggedIn", { id, email })
    └─ Response: { accessToken, refreshToken, expiresIn: 1800 }

3️⃣  TOKEN USAGE
    ├─ Client includes: Authorization: Bearer $accessToken
    ├─ Middleware validates: JWT signature, expiry
    ├─ Attach: req.user = { id, type: 'access' }
    └─ Proceed to route handler

4️⃣  REFRESH TOKEN ROTATION
    ├─ Client sends: refreshToken + accessToken
    ├─ Validate: refreshToken signature, expiry, nonce exists
    ├─ Lookup session: { userId, storedNonce }
    ├─ If nonce mismatch → DENY (token reuse attack)
    ├─ Generate new tokens:
    │  ├─ NEW accessToken (new expiry)
    │  ├─ NEW refreshToken (new nonce)
    │  └─ Delete old session
    ├─ Store NEW session with new nonce
    ├─ Event: emit("user.tokenRefreshed", { id })
    └─ Response: { accessToken, refreshToken, expiresIn }

5️⃣  LOGOUT
    ├─ Client sends: Authorization + refreshToken
    ├─ Delete session: { userId, ... }
    ├─ Invalidate tokens: mark old tokens blacklisted
    ├─ Clear client: localStorage.clear()
    ├─ Event: emit("user.loggedOut", { id })
    └─ Response: { success: true }

6️⃣  OPTIONAL: WebAuthn (FIDO2)
    ├─ Registration
    │  ├─ Generate challenge
    │  ├─ Client creates credential with biometric
    │  ├─ Store public key + credential ID
    │  └─ Event: emit("webauthn.registered", { id })
    └─ Authentication
       ├─ Generate challenge + credential ID
       ├─ Client signs with biometric
       ├─ Verify signature
       └─ Issue JWT tokens

┌─────────────────────────────────────────────────────────────────────┐
│ KEY FEATURES                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ Refresh Token Rotation (prevents token reuse)                   │
│ ✅ Nonce Validation (detects stolen tokens)                        │
│ ✅ Session Management (one-to-one with user)                      │
│ ✅ Audit Logging (every auth event tracked)                       │
│ ✅ Rate Limiting (10 login attempts per minute)                   │
│ ✅ Brute Force Protection (exponential backoff)                    │
│ ✅ WebAuthn Support (passwordless auth)                           │
│ ✅ CSRF Protection (double-submit cookie)                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 CRM WORKFLOW

### Lead Management Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CRM LEAD WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════╗
║ LEAD CREATION (user.createLead)                                   ║
╚════════════════════════════════════════════════════════════════════╝

POST /leads
├─ Payload: { name, company, email, value, stage, description }
├─ Auth check: req.user.id must own this resource
├─ Validate: Zod schema (strict mode rejects unknown fields)
├─ Business logic:
│  ├─ Calculate initial score based on stage + value
│  ├─ Set createdAt, createdBy, stageBefore, stageAfter
│  ├─ Initialize engagement = 0
│  ├─ Set health = HEALTHY or EXCELLENT based on value
│  └─ Generate AI lead summary
├─ Create: db.lead.create(data)
├─ Emit event: "lead.created"
│  └─► AI WORKFLOW TRIGGERED (separate process)
│      1. Extract signals (urgency, health, probability)
│      2. Generate AI suggestion (e.g., "call today")
│      3. Store decision in db.decision
│      4. Emit "brain.suggested"
├─ Response: { id, name, company, email, value, stage, score, health }
└─ Side Effects:
   ├─ Calculate forecast impact
   ├─ Update user dashboard
   └─ Log action in audit trail

╔════════════════════════════════════════════════════════════════════╗
║ LEAD UPDATE (user.updateLead)                                     ║
╚════════════════════════════════════════════════════════════════════╝

PATCH /leads/:id
├─ Payload: { name?, company?, email?, value?, stage?, status? }
├─ Auth check: req.user.id == lead.userId
├─ Lookup: GET lead by id
├─ Validate updates:
│  ├─ Stage change? → Enforce state machine rules
│  ├─ Value change? → Re-calculate score
│  └─ Status change? → Verify valid transition
├─ Before values: { stageBefore, valueBefore, healthBefore }
├─ Update: db.lead.update(id, data)
├─ After values: { stageAfter, valueAfter, healthAfter }
├─ Calculate deltas: { stageDelta, valueDelta, healthDelta }
├─ If changes significant:
│  ├─ Emit: "lead.updated" → Events published
│  ├─ Trigger: AI re-evaluation
│  │  └─ Are signals different? → New suggestion?
│  └─ Possible actions:
│     ├─ Escalate to manager (high value + low engagement)
│     ├─ Auto-close stalled (no activity 60 days)
│     └─ Celebrate quick-win (closed < 2 weeks)
├─ Response: { id, ...updated, deltas, suggestedAction }
└─ Activity log: "User updated lead: value $X→$Y, stage A→B"

╔════════════════════════════════════════════════════════════════════╗
║ ACTIVITY TRACKING (user.createActivity)                           ║
╚════════════════════════════════════════════════════════════════════╝

POST /activities
├─ Payload: { leadId, type, channel, text, duration, notes }
│  └─ Types: CALL, EMAIL, MEETING, MESSAGE, TASK, NOTE, etc
├─ Auth check: User owns parent lead
├─ Validate: Activity schema
├─ Create: db.activity.create(data)
├─ Update parent lead:
│  ├─ engagement += (type-based points: call=3, email=1, meeting=5)
│  ├─ lastActivity = now
│  ├─ activityCount++
│  └─ Recalculate score & health
├─ Emit: "activity.created"
│  └─► AI re-evaluates engagement signals
├─ Response: { id, leadId, type, createdAt }
└─ Side Effects:
   ├─ Update timeline view
   ├─ Calculate engagement score
   └─ Check if triggers action (3+ activities = AI suggestion)

╔════════════════════════════════════════════════════════════════════╗
║ PAYMENT TRACKING (user.createPayment)                             ║
╚════════════════════════════════════════════════════════════════════╝

POST /payments
├─ Payload: { leadId, amount, status, reference, notes }
├─ Auth check: User owns parent lead
├─ Validate: Amount > 0, status in [pending, completed, failed]
├─ Create: db.payment.create(data)
├─ Update parent lead:
│  ├─ value = sum of all payments
│  ├─ IF status === "completed" → Update financial metrics
│  │  ├─ totalRevenue += amount
│  │  ├─ avgDealSize = totalRevenue / dealCount
│  │  ├─ projectedARR = avgDealSize * (closedDeals / 365)
│  │  └─ Forecast next quarter
│  └─ IF amount > 50000 → Escalate to manager
├─ Emit: "payment.received"
│  └─► AI updates:
│      1. Close probability (payment = signal of seriousness)
│      2. Velocity (payment = progression signal)
│      3. Next best action (follow-up? upsell? renewal?)
├─ Response: { id, leadId, amount, status }
└─ Side Effects:
   ├─ Update revenue dashboard
   ├─ Trigger billing/invoicing
   └─ Check forecast impact

╔════════════════════════════════════════════════════════════════════╗
║ DEDUPLICATION (admin.mergeDuplicates)                             ║
╚════════════════════════════════════════════════════════════════════╝

POST /admin/dedup/merge
├─ Payload: { baseLeadId, duplicateLeadIds }
├─ Auth check: User is admin
├─ Validate:
│  ├─ All leads belong to same user
│  ├─ baseLeadId not in duplicateLeadIds
│  └─ Duplicates match rules (same email/company)
├─ Merge process:
│  1. Load all leads + activities + payments
│  2. Consolidate activities:
│     └─ UPDATE all activities SET leadId = baseLeadId
│  3. Consolidate payments:
│     └─ CREATE single payment = sum(amount)
│  4. Delete duplicates:
│     └─ DELETE FROM leads WHERE id IN (duplicates)
│        (CASCADES to activities automatically via Prisma)
│  5. Update base lead:
│     └─ score = recalculate
│     └─ engagement = sum(all activities)
│     └─ health = recalculate
├─ Emit: "leads.merged"
│  └─► AI retrains on consolidated data
├─ Response: { baseLeadId, mergedCount, consolidatedPayment }
└─ Side Effects:
   ├─ Recalculate forecast (fewer deals but higher values)
   ├─ Update dashboard metrics
   └─ Audit log: "Merged 3 leads into base"

╔════════════════════════════════════════════════════════════════════╗
║ LEAD DELETION (Soft Delete or Hard)                               ║
╚════════════════════════════════════════════════════════════════════╝

DELETE /leads/:id
├─ Auth check: User owns lead
├─ Soft delete: Set deletedAt = now, isDeleted = true
│  └─ Query filters automatically exclude deleted
├─ Cascade: Activities + Payments kept (for audit)
├─ Emit: "lead.deleted"
├─ Response: { id, deletedAt }
└─ Audit trail: Never purges, user can restore via UI

┌─────────────────────────────────────────────────────────────────────┐
│ LEAD STATE MACHINE (Valid Transitions)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  INITIAL_CONTACT ──────► QUALIFIED ──────► PROPOSAL                 │
│       ▲                       ▲                  ▲                   │
│       │                       │                  │                   │
│       └───────────────────────┴──────────────────┤                   │
│                                                  │                   │
│                        ┌─────────────────────────┘                   │
│                        │                                             │
│                         ▼                                            │
│                     NEGOTIATION ───────────────┐                     │
│                        ▲                       │                     │
│                        │                       │                     │
│                        └────────────┬──────────┤                     │
│                                     │          │                     │
│                            CLOSED_LOST    CLOSED_WON                │
│                                 ▲              ▲                    │
│                                 │              │                    │
│                                 └──────┬───────┘                    │
│                                        │                            │
│                                    STALLED                          │
│                                 (Inactive)                          │
│                                                                       │
│ Rules:                                                              │
│ • Can reopen from CLOSED_LOST back to INITIAL_CONTACT             │
│ • STALLED auto-triggered at 30+ days no activity                  │
│ • Cannot close won without payment record                          │
│ • Cannot close before 3 days of creation                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI ORCHESTRATION INTEGRATION

### How AI Brain Integrates with CRM

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI ORCHESTRATION LAYER                           │
│              (Autonomous, Event-Driven, Self-Learning)             │
└─────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════╗
║ ENTRY POINTS (What Triggers AI)                                  ║
╚════════════════════════════════════════════════════════════════════╝

🎯 Event: lead.created
   └─ AI runs immediately
      ├─ Extract signals from lead metadata
      ├─ Choose action (call today, email, wait)
      ├─ Generate context: "High-value tech deal, decision maker identified"
      └─ Store decision in db.decision table

🎯 Event: activity.created
   └─ AI runs if engagement threshold met
      ├─ Extract engagement signals
      ├─ Calculate trend (getting warmer? colder?)
      ├─ Suggest next touchpoint
      └─ Example: "3 calls + 2 emails this week → Ready for proposal?"

🎯 Event: payment.received
   └─ AI runs immediately
      ├─ Extract close probability signals
      ├─ Update probability (high payment = likely closing)
      ├─ Suggest celebration action
      └─ Possible escalation (>$50k = notify sales manager)

🎯 Event: lead.scoreRecalc (Manual)
   └─ User triggers recalculation
      ├─ Re-extract all signals
      ├─ Compare old vs new
      ├─ Alert if score dropped (needs attention)
      └─ Example: "Score 85→60: engagement down, probably stalled"

╔════════════════════════════════════════════════════════════════════╗
║ SIGNAL EXTRACTION (The "Magic")                                   ║
╚════════════════════════════════════════════════════════════════════╝

When AI workflow starts, extract 5 key signals:

1. URGENCY
   ├─ Input: Value, days in current stage, activity velocity
   ├─ Output: CRITICAL, HIGH, MEDIUM, LOW
   ├─ Logic:
   │  ├─ $100k+ AND <7 days in stage = CRITICAL
   │  ├─ $50k+ AND healthy engagement = HIGH
   │  ├─ $20-50k = MEDIUM
   │  └─ <$20k = LOW
   └─ Example: "$150k in PROPOSAL 4 days, 3 activities last week = CRITICAL"

2. DEAL HEALTH
   ├─ Input: Activity frequency, last activity, engagement score
   ├─ Output: EXCELLENT, HEALTHY, AT_RISK, STALLED
   ├─ Logic:
   │  ├─ 3+ activities/week, <2 days since last = EXCELLENT
   │  ├─ 1+ activity/week, <7 days = HEALTHY
   │  ├─ No activity 7-14 days = AT_RISK
   │  └─ No activity 30+ days = STALLED
   └─ Example: "2 calls this week, last activity yesterday = EXCELLENT"

3. ENGAGEMENT SCORE
   ├─ Input: Activity types, frequency, response patterns
   ├─ Output: 0-100
   ├─ Calculation:
   │  ├─ Base: Call=3 pts, Email=1, Meeting=5, Response=2
   │  ├─ Trend: Increasing=+bonus, Decreasing=-discount
   │  ├─ Time decay: Activities >30 days old = 50% weight
   │  └─ Multiplier: If owner is CEO = 2x important
   └─ Example: "5 activities (11 pts) - 2 days decay + trend bonus = 72"

4. CLOSE PROBABILITY
   ├─ Input: Stage, engagement, value, velocity, history
   ├─ Output: 0-100%
   ├─ Logic:
   │  ├─ CLOSED_WON = 100%
   │  ├─ NEGOTIATION + healthy engagement = 70-95%
   │  ├─ PROPOSAL + good health = 50-75%
   │  ├─ QUALIFIED = 20-50%
   │  ├─ INITIAL_CONTACT = 5-20%
   │  └─ Adjust for stalled (-70%), velocity, payment history
   └─ Example: "PROPOSAL + EXCELLENT health + $100k = 78% close prob"

5. VELOCITY (Deal Movement Speed)
   ├─ Input: Days per stage, activity momentum
   ├─ Output: FAST, NORMAL, SLOW, STUCK
   ├─ Logic:
   │  ├─ Avg 3 days/stage = FAST (closing in 2 weeks)
   │  ├─ Avg 10 days/stage = NORMAL (closing in 4-5 weeks)
   │  ├─ Avg 20+ days/stage = SLOW (closing in 8+ weeks)
   │  └─ Stuck 30+ days = STUCK (needs intervention)
   └─ Example: "Created 25 days ago, now PROPOSAL = SLOW, needs push"

╔════════════════════════════════════════════════════════════════════╗
║ AI DECISION ENGINE (Rules + LLM Hybrid)                           ║
╚════════════════════════════════════════════════════════════════════╝

Based on signals, AI suggests action:

DECISION TYPES:
├─ IMMEDIATE_FOLLOWUP
│  └─ Condition: Urgency=CRITICAL, Health=EXCELLENT
│  └─ Action: "Call today, decision maker available"
│  └─ Confidence: 85-95%
│
├─ NURTURE_TRACK
│  └─ Condition: Health=HEALTHY, Velocity=SLOW
│  └─ Action: "Send educational content, build value"
│  └─ Confidence: 70-85%
│
├─ ESCALATE_TO_MANAGER
│  └─ Condition: Value>$100k, Health=AT_RISK, Velocity=STUCK
│  └─ Action: "Senior rep takes over"
│  └─ Confidence: 80-90%
│
├─ PAUSE_OUTREACH
│  └─ Condition: Health=EXCELLENT, Recent response
│  └─ Action: "Wait for their next move, give space"
│  └─ Confidence: 75-85%
│
└─ AUTO_CLOSE_LOST
   └─ Condition: Velocity=STUCK, No activity 60+ days
   └─ Action: "Auto-move to CLOSED_LOST (manual approval)"
   └─ Confidence: 60-70%

CONFIDENCE SCORING:
├─ Rule-based confidence (0-100)
│  └─ How certain is the rule? (deterministic)
├─ LLM confidence (0-100)
│  └─ How certain is the AI? (probabilistic)
├─ Merged confidence = (rule×0.6 + llm×0.4)
└─ Display only if merged_confidence > 65%

╔════════════════════════════════════════════════════════════════════╗
║ LEARNING LOOP (Self-Improvement)                                  ║
╚════════════════════════════════════════════════════════════════════╝

Each decision generates learning data:

User approves decision → Feedback stored
├─ Success metric: Did the suggested action work?
├─ Example: "Suggested IMMEDIATE_FOLLOWUP → Closed in 3 days ✅"
└─ Trust building: Increment trust score for this decision type

User rejects decision → Still learn, but different Signal
├─ Why was it wrong?
├─ Example: "Suggested ESCALATE → User ignored, closed themselves ❌"
└─ Trust damage: Decrement trust score

Pattern detection:
├─ How many of this decision type are approved?
├─ If >70% approval → High confidence, auto-execute
├─ If <40% approval → Suppress, only show confidence≥95%
└─ Example: "NURTURE_TRACK: 82% approval → Start auto-executing"

Self-suppression:
├─ Track decision type effectiveness per user
├─ If system learns "Immediate followup = always ignored" → Don't suggest
├─ But allow re-enabling if conditions change
└─ Prevents decision fatigue, maintains relevance

Memory extraction:
├─ What patterns are working?
├─ Example: "Phone calls at 10am = 60% pickup vs 2pm = 30%"
├─ Optimal channel = Email for this user
├─ Best time = Tuesday-Thursday 9a-11a
└─ Store in MemoryBlob for next lead from same company

╔════════════════════════════════════════════════════════════════════╗
║ BACKGROUND INTELLIGENCE JOBS                                     ║
╚════════════════════════════════════════════════════════════════════╝

Every hour/day, AI runs batch jobs:

Hourly:
├─ INACTIVE LEAD DETECTION
│  └─ Find leads with 7+ days no activity
│  └─ Action: Enqueue "reminder" task
│  └─ Notify: "5 leads need love"
│
└─ CRITICAL DEAL ESCALATION
   └─ Find deals >$100k in PROPOSAL >14 days no activity
   └─ Action: Notify sales manager directly
   └─ Message: "Opportunity at risk: Close X, last activity Jan 15"

2-Hourly:
├─ LEAD RESCORING
│  └─ Recalculate ALL leads
│  └─ Identify movers (score ±15 points)
│  └─ Send alerts: "Deal heated up!", "Watch out: Deal cooling"
│
└─ HIGH-VALUE DEAL SUGGESTIONS
   └─ Find deals >$50k with score 70+ not in PROPOSAL yet
   └─ Suggest: "Time to prepare proposal?"
   └─ Auto-schedule prep meeting

Daily:
└─ STALE SUGGESTIONS CLEANUP
   └─ Remove suggestions >30 days old
   └─ Analyze effectiveness
   └─ Update trust scores for decision types
   └─ Generate daily AI report for sales manager
```

---

## 🔗 EVENT COORDINATION

### Complete Event Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       EVENT BUS ARCHITECTURE                        │
│                    (Pub/Sub Event-Driven System)                   │
└─────────────────────────────────────────────────────────────────────┘

Event types flow through system:

┌────────────────────────────────────────────────────────────────────┐
│ 1️⃣  USER EVENTS                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ user.registered                                                     │
│ ├─ Emitted from: AuthController.register()                        │
│ ├─ Payload: { id, email, name, createdAt }                       │
│ ├─ Listeners:                                                      │
│ │  ├─ Queue welcome email                                         │
│ │  ├─ Initialize organization                                     │
│ │  └─ Create default team                                         │
│ └─ Audit: Log registration event                                  │
│                                                                      │
│ user.loggedIn                                                       │
│ ├─ Payload: { id, email, loginAt, ipAddress }                    │
│ ├─ Listeners:                                                      │
│ │  ├─ Update last_login timestamp                                 │
│ │  ├─ Cache user session in Redis                                 │
│ │  └─ Log to audit trail                                          │
│ └─ Side effect: Rate limiter reset                                │
│                                                                      │
│ user.loggedOut                                                      │
│ ├─ Payload: { id, email, logoutAt }                              │
│ ├─ Listeners:                                                      │
│ │  ├─ Delete Redis session                                        │
│ │  ├─ Blacklist refresh token                                     │
│ │  └─ Log logout event                                            │
│ └─ Side effect: Clear client auth                                 │
│                                                                      │
│ user.tokenRefreshed                                                │
│ ├─ Payload: { id, new_nonce }                                    │
│ ├─ Listeners:                                                      │
│ │  └─ Audit: Log token refresh                                    │
│ └─ Frequency: Every 30 min if user active                         │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 2️⃣  LEAD EVENTS                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ lead.created                                                        │
│ ├─ Emitted from: LeadController.create()                          │
│ ├─ Payload: { id, userId, name, value, stage, createdAt }       │
│ ├─ Listeners:                                                      │
│ │  ├─ AI.runWorkflow() → Extracts signals & suggests action      │
│ │  ├─ Analytics.updateForecast()                                  │
│ │  └─ EventLog.audit()                                            │
│ └─ Async: setTimeout(aiWorkflow, 100ms)                           │
│                                                                      │
│ lead.updated                                                        │
│ ├─ Payload: { id, changes: {...}, deltas }                       │
│ ├─ Listeners:                                                      │
│ │  ├─ If stage/value changed:                                    │
│ │  │  ├─ AI.reEvaluate()                                         │
│ │  │  └─ Analytics.updateMetrics()                               │
│ │  └─ Timeline.addEntry()                                        │
│ └─ Frequency: User-triggered, not batched                         │
│                                                                      │
│ lead.scoreRecalc                                                    │
│ ├─ Emitted from: AIJob or Manual trigger                          │
│ ├─ Payload: { id, newScore, scoreChange }                        │
│ ├─ Listeners:                                                      │
│ │  ├─ If score > 80: Check for auto-escalation                   │
│ │  ├─ If score < 40: Check for at-risk warning                   │
│ │  └─ Dashboard.updateScore()                                    │
│ └─ Batch frequency: Hourly, all leads                             │
│                                                                      │
│ lead.deleted                                                        │
│ ├─ Payload: { id, deletedAt, isHardDelete }                      │
│ ├─ Listeners:                                                      │
│ │  ├─ Analytics.updateMetrics()                                   │
│ │  └─ EventLog.audit()                                            │
│ └─ Soft delete → Activities preserved                             │
│                                                                      │
│ lead.updateCloseProbability                                         │
│ ├─ Emitted from: PaymentController.create()                       │
│ ├─ Payload: { id, newProbability, reason }                       │
│ ├─ Listeners:                                                      │
│ │  ├─ Dashboard.updateProbability()                               │
│ │  └─ Forecast.recalculate()                                     │
│ └─ Impacts: Sales forecast, pipeline value                        │
│                                                                      │
│ leads.merged                                                        │
│ ├─ Emitted from: DeduplicationService.merge()                     │
│ ├─ Payload: { baseId, mergedIds: [...], consolidatedPayment }   │
│ ├─ Listeners:                                                      │
│ │  ├─ AI.retrain() [Optional]                                   │
│ │  ├─ Analytics.updateMetrics()                                   │
│ │  └─ EventLog.audit()                                            │
│ └─ Cleanup: Delete duplicates, consolidate activities             │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 3️⃣  ACTIVITY EVENTS                                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ activity.created                                                    │
│ ├─ Payload: { id, leadId, userId, type, timestamp }             │
│ ├─ Listeners:                                                      │
│ │  ├─ Lead.updateEngagement() [+points based on type]           │
│ │  ├─ AI.reevaluate() [if 3+ activities]                         │
│ │  ├─ Timeline.append() [add to activity feed]                   │
│ │  └─ Analytics.trackActivity()                                  │
│ └─ Types: CALL, EMAIL, MEETING, TASK, NOTE, SMS, etc            │
│                                                                      │
│ activity.analyzed                                                   │
│ ├─ Payload: { id, sentiment, keywords, suggestedNext }           │
│ ├─ Listeners:                                                      │
│ │  └─ AI.extractPatterns() [What's working?]                    │
│ └─ Optional: AI sentiment analysis on call transcripts            │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 4️⃣  PAYMENT EVENTS                                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ payment.received                                                    │
│ ├─ Payload: { id, leadId, amount, status, source }             │
│ ├─ Listeners:                                                      │
│ │  ├─ Lead.updateValue() [Add to cumulative]                    │
│ │  ├─ Lead.updateCloseProbability() [+20% boost]                │
│ │  ├─ AI.updateSignals() [Close prob, velocity signals]         │
│ │  ├─ Analytics.recordRevenue()                                   │
│ │  └─ Notifications.alert() [Manager: >$50k]                    │
│ └─ Frequency: High value → immediate alert                        │
│                                                                      │
│ payment.failed                                                      │
│ ├─ Payload: { id, leadId, reason, retryable }                   │
│ ├─ Listeners:                                                      │
│ │  ├─ Lead.dropCloseProbability() [-20% drop]                   │
│ │  ├─ Notifications.alert() [Sales: deal at risk]               │
│ │  └─ AI.suggestIntervention()                                   │
│ └─ Action: Follow up immediately                                  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 5️⃣  AI/BRAIN EVENTS                                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ brain.suggested                                                     │
│ ├─ Payload: { decisionId, leadId, action, confidence, reason }  │
│ ├─ Listeners:                                                      │
│ │  ├─ Dashboard.displaySuggestion() [Show to user]              │
│ │  ├─ Logger.log() [Track decision]                              │
│ │  └─ Auto-execute() [If confidence > 95%]                       │
│ └─ Frequency: Event-driven (lead.created, activity.created)      │
│                                                                      │
│ suggestion.approved                                                 │
│ ├─ Payload: { decisionId, userId, feedbackType: 'approve' }     │
│ ├─ Listeners:                                                      │
│ │  ├─ AI.learnPositive() [Increment trust for this type]        │
│ │  ├─ Memory.storePattern() [What was successful?]              │
│ │  └─ Action.execute() [Do the suggested action]                 │
│ └─ Learning: Build AI confidence over time                        │
│                                                                      │
│ suggestion.rejected                                                 │
│ ├─ Payload: { decisionId, userId, feedbackType: 'reject' }      │
│ ├─ Listeners:                                                      │
│ │  ├─ AI.learnNegative() [Decrement trust]                      │
│ │  └─ Alert.research() [Why was it wrong?]                      │
│ └─ Learning: Avoid suggesting this in future                      │
│                                                                      │
│ brain.analysis                                                      │
│ ├─ Payload: { leadId, signals: {...}, prompt, response }        │
│ ├─ Listeners:                                                      │
│ │  └─ Analytics.trackAIPerformance()                             │
│ └─ Stored: For debugging + learning                               │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 6️⃣  ANALYTICS EVENTS                                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ analytics.computed                                                  │
│ ├─ Payload: { userId, metrics: { leads, revenue, avgScore } }   │
│ ├─ Frequency: Real-time on dashboard request                      │
│ └─ Cached: Last computation, invalidated on lead/activity change  │
│                                                                      │
│ forecast.updated                                                    │
│ ├─ Payload: { userId, q1: $X, q2: $Y, confidence }             │
│ ├─ Calculation: Based on close prob × avg deal, velocity        │
│ └─ Used: sales planning, territory allocation                     │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────

📊 EVENT AGGREGATION (Real-Time Dashboard)

┌─────────────────────────────────────────────────────────────────┐
│ As events fire, aggregators update metrics in real-time:       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ lead.created          ──────┐                                  │
│ activity.created      ──────┼──► Metric: totalEngagement      │
│ lead.scoreRecalc      ──────┘    └─ Publish to dashboard      │
│                                                                   │
│ payment.received      ──────┐                                  │
│ lead.updated          ──────┼──► Metric: pipelineValue        │
│ lead.scoreRecalc      ──────┘    └─ Update forecast           │
│                                                                   │
│ lead.deleted          ──────┐                                  │
│ leads.merged          ──────┼──► Metric: leadCount, efficiency │
│ activity.created      ──────┘    └─ Track KPIs                │
│                                                                   │
│ brain.suggested       ──────┐                                  │
│ suggestion.approved   ──────┼──► Metric: AIAccuracy, ROI     │
│ suggestion.rejected   ──────┘    └─ Continuous learning       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW

### From User Action to Stored Data

```
┌────────────────────────────────────────────────────────────────────┐
│ EXAMPLE: User creates activity for lead                           │
├────────────────────────────────────────────────────────────────────┤

1️⃣  CLIENT ACTION
    └─ User clicks "Log Call" button
       └─ POST /activities
          ├─ Auth: "Bearer $accessToken"
          ├─ Payload: { leadId, type: "CALL", duration: 15, notes }
          └─ Sent at: 2024-01-20T14:30:00Z

2️⃣  MIDDLEWARE CHAIN
    ├─ auth.middleware: Verify JWT, attach req.user
    ├─ validate.middleware: Zod schema validation (.strict())
    ├─ rbac.middleware: Check user owns lead
    ├─ audit.middleware: Start audit log
    ├─ device.middleware: Capture device info
    └─ rateLimiter: Check API limits

3️⃣  ROUTE HANDLER
    └─ POST /activities → ActivityController.create()
       └─ Fetch lead: lookup by leadId
       └─ Verify: req.user.id == lead.userId
       └─ Create activity:
          ├─ db.activity.create({
          │  └─ userId, leadId, type, duration, notes, createdAt
          │  })
          └─ Returns: { id: "act_123", ...activity }

4️⃣  SERVICE LAYER LOGIC
    ├─ Calculate engagement points: CALL = 3 pts
    ├─ Update parent lead:
    │  └─ db.lead.update({
    │     └─ engagement += 3,
    │     └─ lastActivity = now,
    │     └─ activityCount++,
    │     └─ [Recalculate score & health]
    │     })
    └─ Build response object

5️⃣  EVENT EMISSION
    ├─ eventBus.emit("activity.created", {
    │  ├─ id: "act_123",
    │  ├─ leadId, userId, type,
    │  ├─ createdAt, createdBy
    │  └─ at: Date.now()
    │  })
    └─ Non-blocking: emitted async

6️⃣  EVENT LISTENERS FIRE (Parallel)
    │
    ├─► Listener 1: Update Timeline
    │   └─ db.timeline.create({ entry: "Call logged", leadId })
    │
    ├─► Listener 2: AI Re-evaluation (if 3+ activities)
    │   └─ Call: runAIWorkflow({event: 'activity.created', leadId})
    │      ├─ Extract engagement signals
    │      ├─ Generate new suggestion
    │      └─ Emit: brain.suggested
    │
    ├─► Listener 3: Analytics Update
    │   └─ Query: SELECT COUNT(*) as activityCount FROM activities
    │      └─ Cache: Redis.set("metrics:activityCount", count, 300s)
    │
    └─► Listener 4: Audit Logging
        └─ db.auditLog.create({
           ├─ action: "ACTIVITY_CREATED",
           ├─ userId, leadId, activityId,
           ├─ ipAddress, userAgent, device,
           └─ timestamp
           })

7️⃣  AI WORKFLOW (Async, Separate Process)
    ├─ Load lead + all activities + all payments
    ├─ Extract signals:
    │  ├─ Urgency
    │  ├─ Health
    │  ├─ Engagement
    │  ├─ Close probability
    │  └─ Velocity
    ├─ Generate prompt:
    │  └─ "User has logged 3 calls in last week to $150k deal in PROPOSAL stage...
    │     └─ → Suggest action?"
    ├─ Call LLM: AI.generateDecision()
    │  ├─ Model: Ollama (fallback OpenAI)
    │  ├─ Timeout: 20s
    │  └─ Response: "IMMEDIATE_FOLLOWUP: Prepare demo for decision maker"
    ├─ Store decision:
    │  └─ db.decision.create({
    │     ├─ leadId, userId,
    │     ├─ type: "IMMEDIATE_FOLLOWUP",
    │     ├─ action, reasoning,
    │     ├─ confidence: 82,
    │     ├─ signals: {...},
    │     └─ createdAt
    │     })
    ├─ Emit event: brain.suggested
    └─ Done (~5-10s total)

8️⃣  BROWSER RECEIVES RESPONSE
    └─ HTTP 201 Created
       ├─ Body: { id, leadId, type, duration, notes, createdAt }
       ├─ Headers: { X-Request-ID, X-Response-Time }
       └─ Client updates: activity list, timeline, engagement score

9️⃣  REAL-TIME UPDATE (via WebSocket)
    ├─ Socket.io emits: "activity:created"
    │  └─ All users viewing this lead see activity appear instantly
    ├─ Socket.io emits: "lead:updated"
    │  └─ Engagement score +3 displayed in real-time
    └─ Socket.io emits: "suggestion:new"
       └─ Brain suggestion notification pops up

🔟 ANALYTICS DASHBOARD UPDATES
    ├─ "Total activities today" incremented
    ├─ "Engagement this week" recalculated
    ├─ "AI suggestion accuracy" updated (user approves →learns)
    └─ Cache invalidated: Next view queries fresh data

📊 DATABASE STATE (After All Steps)
    │
    ├─ activity table:
    │  └─ [{ id: "act_123", leadId, userId, type: "CALL", ... }]
    │
    ├─ lead table:
    │  └─ [{ id: "lead_456", engagement: 8 (+3), lastActivity: now, ... }]
    │
    ├─ decision table:
    │  └─ [{ id: "dec_789", leadId, type: "IMMEDIATE_FOLLOWUP", ... }]
    │
    ├─ timeline table:
    │  └─ [{ leadId, entry: "Call logged", createdAt: now, ... }]
    │
    ├─ auditLog table:
    │  └─ [{ action: "ACTIVITY_CREATED", userId, leadId, ... }]
    │
    └─ Redis cache:
       └─ [
          ├─ "metrics:activityCount" = 247,
          ├─ "metrics:engagements" = 1850,
          ├─ "lead:456:engagement" = 8 (5 min TTL),
          └─ "user:123:dashboard" (invalidated for refresh)
          ]
```

---

## 🔀 CONTROL FLOW

### Decision Points & Branching Logic

```
┌────────────────────────────────────────────────────────────────────┐
│                    COMPLETE CONTROL FLOW                           │
│              (Where decisions are made in the system)              │
└────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════╗
║ CREATE LEAD CONTROL FLOW                                         ║
╚════════════════════════════════════════════════════════════════════╝

                            ┌─────────────┐
                            │ POST /leads │
                            └──────┬──────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Validate JWT + User      │
                    │ Passes? ✓ : Return 401   │
                    └──────────────┬───────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Validate Payload (Zod)   │
                    │ Valid? ✓ : Return 400    │
                    └──────────────┬───────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Check Rate Limit         │
                    │ (10 leads / 5 min/user)  │
                    │ OK? ✓ : Return 429       │
                    └──────────────┬───────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Check for duplicates     │
                    │ Same email+company?      │
                    └──────────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                 Duplicate?                   Unique?
                    │                             │
                    ▼                             ▼
            ┌─────────────────┐      ┌──────────────────────┐
            │ Return warning: │      │ Create lead          │
            │ "Consider merge"│      │ score = initValues() │
            │ + return new ID │      │ health = calc()      │
            └─────────────────┘      └──────────┬───────────┘
                                               │
                                               ▼
                                  ┌───────────────────────┐
                                  │ Check value > 50k?    │
                                  └───────────┬───────────┘
                                              │
                                  ┌───────────┴────────────┐
                                  │                        │
                              YES (High Value)      NO (Standard)
                                  │                        │
                            ┌─────▼─────┐         ┌──────▼─────┐
                            │ Set urgent │         │ Set normal │
                            │ = true     │         │ = false    │
                            └─────┬─────┘         └──────┬─────┘
                                  │                      │
                                  └──────────┬───────────┘
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │ Emit lead.created    │
                                  │ [Async trigger AI]   │
                                  └──────────┬───────────┘
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │ Return 201 + lead    │
                                  │ (immediately, AI     │
                                  │  runs in background) │
                                  └──────────────────────┘

╔════════════════════════════════════════════════════════════════════╗
║ UPDATE LEAD STAGE CONTROL FLOW                                   ║
╚════════════════════════════════════════════════════════════════════╝

                    ┌───────────────────────────┐
                    │ PATCH /leads/:id?stage=X  │
                    └──────────┬────────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │ Lookup current stage     │
                    │ E.g., QUALIFIED          │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │ Is transition valid?     │
                    │ QUALIFIED → PROPOSAL ✓   │
                    │ QUALIFIED → CLOSED ✗     │
                    └──────────┬───────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                 Valid?               Invalid?
                    │                     │
                    ▼                     ▼
        ┌─────────────────────┐    ┌──────────────┐
        │ Check context rules │    │ Return 400   │
        └─────────┬───────────┘    │ "Invalid     │
                  │                │  transition" │
                  ▼                └──────────────┘
     ┌────────────────────────┐
     │ New stage = CLOSED_WON?│
     └────────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
        YES               NO
         │                 │
         ▼                 ▼
  ┌──────────────┐  ┌────────────┐
  │ Has payment? │  │ Skip checks │
  └──────┬───────┘  └────┬───────┘
         │                │
    ┌────┴────┐           │
    │          │           │
   NO         YES          │
    │          │           │
    ▼          │           │
┌────────┐     │           │
│Return  │     │           │
│"Need   │     │           │
│payment"│     │           │
└────────┘     │           │
               │           │
               └────┬──────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Check days in stage  │
         │ < 3 days?            │
         └────────────┬─────────┘
                      │
               ┌──────┴─────┐
               │            │
             YES           NO
               │            │
               ▼            ▼
         ┌──────────┐   ┌─────────────┐
         │ Return   │   │ Proceed:    │
         │ "Too     │   │ Save change │
         │ early"   │   │ Emit event  │
         └──────────┘   └─────┬───────┘
                               │
                         ┌─────▼──────┐
                         │ New score  │
                         │ = recalc   │
                         │ (based on  │
                         │  new stage)│
                         └─────┬──────┘
                               │
                               ▼
                   ┌──────────────────────┐
                   │ Score increased?     │
                   │ (e.g., 65 → 80)      │
                   └────────────┬─────────┘
                                │
                         ┌──────┴─────┐
                         │            │
                        YES          NO
                         │            │
                         ▼            ▼
                  ┌────────────┐  ┌────────────┐
                  │ Celebrate  │  │ Watch      │
                  │ Prompt:    │  │ carefully  │
                  │ "Deal      │  │ (declines) │
                  │ heating!"  │  └────────────┘
                  └────────────┘

╔════════════════════════════════════════════════════════════════════╗
║ AI WORKFLOW CONTROL FLOW (Triggered by Events)                   ║
╚════════════════════════════════════════════════════════════════════╝

Event fires: lead.created
      │
      ▼
┌─────────────────────┐
│ Extract signals:    │
├─────────────────────┤
│ 1. Urgency          │
│ 2. Health           │
│ 3. Engagement       │
│ 4. Close Prob       │
│ 5. Velocity         │
└────────────┬────────┘
             │
             ▼
┌─────────────────────────┐
│ Map to decision type:   │
└────────────┬────────────┘
             │
     ┌───────┼───────┬──────────┬────────────┐
     │       │       │          │            │
     ▼       ▼       ▼          ▼            ▼
┌─────┐  ┌────┐  ┌────┐  ┌────────┐  ┌────────┐
│URI  │  │Health││ENG │  │PROB    │  │VEL     │
│=C & │  │=E  │  │=H  │  │=M      │  │=N     │
│H=E  │  │&P=H│  │    │  │        │  │       │
└──┬──┘  └──┬──┘  └──┬─┘  └───┬────┘  └───┬──┘
   │        │        │        │           │
   └────────┴────────┴────────┼───────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │Choose decision type     │
                    │ IMMEDIATE_FOLLOWUP      │
                    │ or NURTURE_TRACK        │
                    │ or ESCALATE_TO_MANAGER  │
                    │ or ...                  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Generate prompt         │
                    │ + Call LLM              │
                    │ (timeout: 20s)          │
                    └────────────┬────────────┘
                                 │
                         ┌───────┴────────┐
                         │                │
                    Success          Timeout/Error
                         │                │
                         ▼                ▼
                    ┌──────────┐   ┌──────────────┐
                    │Parse LLM │   │Use safe      │
                    │response  │   │default:      │
                    └────┬─────┘   │"Email info"  │
                         │        └──────┬───────┘
                         │               │
                         └───────┬───────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │Calculate confidence:    │
                    │rule×0.6 + llm×0.4       │
                    │= 75% (medium)           │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │Confidence > 65%?        │
                    └────────────┬────────────┘
                                 │
                         ┌───────┴────────┐
                         │                │
                        YES              NO
                         │                │
                         ▼                ▼
                    ┌──────────┐   ┌─────────────┐
                    │Store     │   │Drop decision│
                    │decision  │   │ (suppress)  │
                    │in DB     │   │ (confidence │
                    └────┬─────┘   │  too low)   │
                         │        └─────────────┘
                         ▼
                    ┌──────────────┐
                    │Emit:         │
                    │brain.suggested
                    │(decision ID) │
                    └────┬─────────┘
                         │
                         ▼
                    ┌──────────────┐
                    │Show in UI    │
                    │(dashboard)   │
                    └──────────────┘
                         │
                    ┌────┴────┐
                    │          │
            User Approves  User Ignores
                    │          │
                    ▼          ▼
          ┌──────────────┐  ┌────────────┐
          │Store feedback│  │Store reject │
          │(trust++)     │  │(trust--)    │
          │Execute action│  │Maybe try    │
          │              │  │different    │
          │Emit:         │  │approach     │
          │suggestion    │  │             │
          │.approved     │  │Emit:        │
          │              │  │suggestion   │
          │              │  │.rejected    │
          └──────────────┘  └────────────┘
                    │          │
                    └────┬─────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │Check: > 70% rejection rate?  │
          │ YES → Auto-suppress this type│
          │ NO → Keep suggesting         │
          └──────────────────────────────┘
```

---

## 📊 STATE MACHINES

### Complete State Transitions Documented

See [lead.stateMachine.ts](lead.stateMachine.ts) for implementation.

---

## 🎬 COMPLETE USER JOURNEY EXAMPLE

### Real Scenario: Closing a $100k SaaS Deal

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE USER JOURNEY (30 days)                        │
│              "Closing a $100k Enterprise SaaS Deal"                       │
└───────────────────────────────────────────────────────────────────────────┘

🔵 DAY 1: ACCOUNT SETUP & FIRST LEAD

┌─────────────────────────────────────┐
│ 10:00 AM - User creates account     │
├─────────────────────────────────────┤
│ Flow:                               │
│ 1. Register: email@company.com      │
│    └─ Event: user.registered        │
│    └─ Side effect: Welcome email    │
│                                      │
│ 2. Login: JWT tokens issued         │
│    └─ Event: user.loggedIn          │
│    └─ accessToken: 30 min           │
│    └─ refreshToken: 7 days          │
│                                      │
│ 3. Dashboard loads                  │
│    └─ Zero leads shown              │
│    └─ Monthly forecast: $0          │
│    └─ Team: 1 user (themself)       │
│                                      │
│ 4. Setup: Company name, industry    │
│    └─ Save to org.config            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3:00 PM - First lead created        │
├─────────────────────────────────────┤
│ User action:                        │
│ + Name: "Acme Corp"                 │
│ + Email: "john@acme.com"            │
│ + Company: "Acme Corporation"       │
│ + Value: $100,000                   │
│ + Stage: INITIAL_CONTACT            │
│                                      │
│ System response:                    │
│ 1. Create lead                      │
│    ├─ score: 30 (initial)           │
│    ├─ health: HEALTHY               │
│    ├─ engagement: 0                 │
│    └─ createdAt: 3:00 PM            │
│                                      │
│ 2. Emit: lead.created               │
│    └─ AI workflow triggered         │
│                                      │
│ 3. AI Analysis (background):        │
│    ├─ Signals:                      │
│    │  ├─ Urgency: HIGH ($100k)     │
│    │  ├─ Health: HEALTHY            │
│    │  ├─ Engagement: 0 (new)        │
│    │  ├─ Close Prob: 10%            │
│    │  └─ Velocity: STUCK (day 1)    │
│    │                                 │
│    ├─ Decision type: NURTURE_TRACK  │
│    ├─ Confidence: 72%               │
│    └─ Suggestion: "Email intro, ask│
│       └─ for discovery call"         │
│                                      │
│ 4. UI Update:                       │
│    ├─ Dashboard: 1 lead             │
│    ├─ Pipeline: $100k               │
│    ├─ Forecast: $10k (10% × $100k) │
│    └─ Brain suggestion shown        │
│                                      │
│ Result: User sees AI suggestion     │
│ "Send discovery email to John"      │
└─────────────────────────────────────┘

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

🔵 DAY 2: FIRST INTERACTION & ENGAGEMENT

┌─────────────────────────────────────┐
│ 9:00 AM - User logs activity        │
├─────────────────────────────────────┤
│ Event: Call with John (Acme CEO)    │
│ +Log activity                       │
│   ├─ Type: CALL                     │
│   ├─ Duration: 25 minutes           │
│   ├─ Notes: "Great interest, wants  │
│   │           review team to see    │
│   │           demo next week"       │
│   └─ createdAt: 9:00 AM             │
│                                      │
│ System cascade:                     │
│ 1. Activity created → DB            │
│ 2. Emit: activity.created           │
│ 3. Lead update:                     │
│    ├─ engagement: 0 → 3 (call=3pts) │
│    ├─ lastActivity: now             │
│    └─ health: HEALTHY → EXCELLENT   │
│       (3+ other signals positive)    │
│                                      │
│ 4. AI re-evaluation:                │
│    ├─ Signals change:               │
│    │  ├─ Health: HEALTHY → EXCELLENT
│    │  ├─ Engagement: 0 → 30 (call)  │
│    │  ├─ Close Prob: 10% → 35%      │
│    │  └─ Velocity: STUCK → NORMAL   │
│    │                                 │
│    ├─ New decision: IMMEDIATE_FOLLOWUP
│    ├─ Confidence: 88% (high!)       │
│    └─ Suggestion: "Demo ready. Book │
│       └─ meeting for Thursday"       │
│                                      │
│ 5. Dashboard update (real-time):    │
│    ├─ Engagement: 0 → 3             │
│    ├─ Health: HEALTHY → EXCELLENT   │
│    ├─ Score: 30 → 48                │
│    ├─ Close Prob: 10% → 35%         │
│    └─ Forecast: $10k → $35k         │
│                                      │
│ User sees:                          │
│ ✅ Activity logged                  │
│ ✅ Score jumped 30 → 48             │
│ ✅ "Ready for demo!" suggestion     │
│ → User clicks "Approve"             │
│    └─ Event: suggestion.approved    │
│    └─ AI learns: activity + demo    │
│       works for cold inbound        │
└─────────────────────────────────────┘

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

🔵 DAY 8: PROPOSAL STAGE

┌─────────────────────────────────────┐
│ 2:00 PM - User updates lead stage   │
├─────────────────────────────────────┤
│ Action: Move from QUALIFIED →       │
│         PROPOSAL (3 activities,     │
│         agreement on scope)         │
│                                      │
│ System validation:                  │
│ ✅ Transition allowed               │
│ ✅ >= 3 days in last stage ✓        │
│ ✅ Activities logged (4 total) ✓    │
│                                      │
│ Update lead:                        │
│ ├─ stage: PROPOSAL                  │
│ ├─ stageBefore: QUALIFIED           │
│ ├─ daysInStage: 11                  │
│ ├─ score: 48 → 65 (stage bonus)     │
│ ├─ health: EXCELLENT (maintained)   │
│ └─ updatedAt: 2:00 PM               │
│                                      │
│ Events cascade:                     │
│ ├─ lead.updated (stage changed)     │
│ ├─ AI re-evaluation:                │
│ │  ├─ Signals:                      │
│ │  │  ├─ Urgency: CRITICAL (stage + │
│ │  │  │             high value)     │
│ │  │  ├─ Health: EXCELLENT (4       │
│ │  │  │           activities/week)  │
│ │  │  ├─ Engagement: 45             │
│ │  │  ├─ Close Prob: 65%            │
│ │  │  └─ Velocity: NORMAL           │
│ │  │                                 │
│ │  ├─ Decision type:                │
│ │  │  → IMMEDIATE_FOLLOWUP          │
│ │  │    (Confirm budget, timeline)  │
│ │  │                                 │
│ │  └─ Confidence: 91%               │
│ │                                    │
│ ├─ Dashboard:                       │
│ │  ├─ Score: 48 → 65               │
│ │  ├─ Close Prob: 35% → 65%        │
│ │  ├─ Forecast: +$65k              │
│ │  └─ Stage indicator: PROPOSAL    │
│ │                                    │
│ └─ Side effects:                    │
│    ├─ Timeline entry: "Moved to     │
│    │   PROPOSAL stage"              │
│    ├─ If > 60 days: Auto-create    │
│    │   follow-up task               │
│    └─ Notify team: "Deal heating"   │
│       (automated message)            │
└─────────────────────────────────────┘

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

🔵 DAY 20: PAYMENT RECEIVED

┌─────────────────────────────────────┐
│ 11:30 AM - First payment received   │
├─────────────────────────────────────┤
│ Event: Stripe webhook               │
│ Payment: $25,000 (deposit)          │
│ Status: completed                   │
│                                      │
│ System processing:                  │
│ 1. Create payment record:           │
│    ├─ amount: 25000                 │
│    ├─ status: completed             │
│    ├─ source: stripe                │
│    ├─ reference: ch_xxxx            │
│    └─ createdAt: 11:30              │
│                                      │
│ 2. Update lead:                     │
│    ├─ totalValue: 100000 → 125000   │
│    │  (cumulative)                  │
│    ├─ score: 65 → 80 (payment      │
│    │           means seriousness)   │
│    └─ closeProbability: 65% → 85%   │
│       (payment de-risks deal)       │
│                                      │
│ 3. Emit: payment.received           │
│                                      │
│ 4. AI re-analysis:                  │
│    ├─ New signals:                  │
│    │  ├─ Urgency: CRITICAL (payment│
│    │  │            + stage)         │
│    │  ├─ Health: EXCELLENT (very   │
│    │  │           engaged)          │
│    │  ├─ Close Prob: 85% (payment  │
│    │  │              is + signal)   │
│    │  └─ Velocity: NORMAL           │
│    │                                 │
│    ├─ Updated decision:             │
│    │  → IMMEDIATE_FOLLOWUP          │
│    │    "Prepare contract,          │
│    │     timeline review"           │
│    │                                 │
│    └─ Confidence: 94%               │
│       (Very confident now)          │
│                                      │
│ 5. Notifications:                   │
│    ├─ Dashboard: Payment received   │
│    │             (+$25k shown)      │
│    ├─ Revenue: +$25k (pipeline      │
│    │               value)           │
│    ├─ Manager alert fired (>$20k)  │
│    │  "Acme: $25k deposit received!"
│    └─ Timeline: Payment entry added │
│                                      │
│ 6. Forecast update:                 │
│    ├─ Remaining: $75k               │
│    ├─ Confidence up: 85%            │
│    └─ Likely close: Next 2 weeks    │
│                                      │
│ Result: Deal becomes very hot       │
│ System treating as urgent priority  │
└─────────────────────────────────────┘

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

🔵 DAY 28: DEAL CLOSED

┌─────────────────────────────────────┐
│ 4:15 PM - Final payment + closure   │
├─────────────────────────────────────┤
│ Event 1: Final payment received     │
│ ├─ Amount: $75,000                  │
│ └─ Acme sends final check           │
│    └─ Stripe webhook → Payment DB   │
│                                      │
│ Event 2: Update lead to CLOSED_WON  │
│ ├─ Validation:                      │
│ │  ✅ Payment received (2 payments) │
│ │  ✅ >3 days creation              │
│ │  ✅ transition allowed            │
│ │                                    │
│ ├─ Update:                          │
│ │  ├─ stage: NEGOTIATION →          │
│ │  │           CLOSED_WON           │
│ │  ├─ closeDate: 4:15 PM            │
│ │  ├─ daysToClose: 27 days          │
│ │  ├─ finalValue: $100,000 total    │
│ │  ├─ score: 100 (closed won)       │
│ │  └─ health: EXCELLENT             │
│ │     (not needed, but tracked)     │
│ │                                    │
│ └─ Emit: lead.deleted [soft delete] │
│    [Actually: stage → CLOSED_WON]   │
│                                      │
│ Event 3: AI celebration              │
│ ├─ Signals detect: CLOSED_WON       │
│ ├─ Special decision:                │
│ │  → QUICK_WIN_CELEBRATION          │
│ │    (Closed in 27 days = fast)     │
│ │                                    │
│ ├─ Generation:                      │
│ │  "Feature this deal! Hit goal      │
│ │   early. Qualify for bonus?"      │
│ │                                    │
│ └─ Confidence: 99% (rule-based)     │
│                                      │
│ Event 4: Dashboard updates          │
│ ├─ Won deals: 1                     │
│ ├─ Closed revenue: $100k            │
│ ├─ Win rate: 100%                   │
│ ├─ Avg deal size: $100k             │
│ ├─ Days to close: 27 (excellent)    │
│ ├─ Total team ARR: $100k × 12 mo?  │
│ │  (if recurring)                   │
│ │                                    │
│ └─ Monthly forecast: On track       │
│                                      │
│ Event 5: Background jobs            │
│ ├─ AI:                              │
│ │  ├─ Learn: User approved          │
│ │  │          IMMEDIATE_FOLLOWUP    │
│ │  │          decision repeatedly   │
│ │  │ → Trust ++ for this type       │
│ │  │                                 │
│ │  ├─ Memory:                       │
│ │  │ → "Payment after call = 3 pts  │
│ │  │   engagement = closes deals"   │
│ │  │ →  Winning pattern identified  │
│ │  │                                 │
│ │  └─ Pattern:                      │
│ │    → "Decisions by John Doe       │
│ │      = 90% success → trust       │
│ │       higher on this account"    │
│ │                                    │
│ ├─ Notification:                    │
│ │  → Send "Win celebration"         │
│ │     email to team                 │
│ │  → Log to company newsletter      │
│ │                                    │
│ └─ Cleanup:                         │
│    → Archive all suggestions        │
│    → Consolidate timeline           │
│    → Generate deal summary report   │
│                                      │
│ Final state:                        │
│ ├─ Lead: CLOSED_WON                 │
│ ├─ Activities: 12 total             │
│ ├─ Timeline: Full journey logged    │
│ ├─ Revenue: $100,000                │
│ ├─ AI decisions: 8 (7 approved)     │
│ ├─ Success: 87.5% decision approval │
│ │           rate (very high)        │
│ └─ Status: COMPLETED ✅             │
│                                      │
│ Post-deal:                          │
│ ├─ Renewal reminder: Set for 1 year│
│ ├─ Customer journey: Begin support │
│ │  onboarding                       │
│ └─ AI learns: Store this deal as   │
│    success template for $100k deals │
│    from tech companies              │
└─────────────────────────────────────┘

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

🔵 SUMMARY DASHBOARD (Day 28, End of Month)

┌─────────────────────────────────────┐
│ MONTHLY RESULTS                     │
├─────────────────────────────────────┤
│                                      │
│ 📊 Sales Metrics                    │
│ ├─ Total leads created: 1           │
│ ├─ Won: 1                           │
│ ├─ Win rate: 100%                   │
│ ├─ Revenue: $100,000                │
│ ├─ Avg deal size: $100,000          │
│ ├─ Days to close: 27                │
│ ├─ Activities logged: 12            │
│ └─ Engagement score: 85 → 100       │
│                                      │
│ 🤖 AI Performance                   │
│ ├─ Total suggestions: 8             │
│ ├─ Approved: 7                      │
│ ├─ Rejection rate: 12.5%            │
│ ├─ Decision types working:          │
│ │  ├─ IMMEDIATE_FOLLOWUP: 100% ✅   │
│ │  ├─ NURTURE_TRACK: 80% ✅         │
│ │  └─ ESCALATE: N/A                 │
│ │                                    │
│ ├─ Patterns learned:                │
│ │  ├─ Email + call = 60% close    │
│ │  ├─ Early payment = high prob    │
│ │  ├─ Decision maker = faster     │
│ │  └─ Tech buyers = 27 day avg    │
│ │                                    │
│ └─ AI Confidence: 89% (optimal)     │
│                                      │
│ 📈 Forecast for Next Month          │
│ ├─ Pipeline: 3 new leads ($350k)   │
│ ├─ Expected close: $180k (51%)     │
│ ├─ Runway: 2.4 months of OpEx      │
│ └─ Trend: Growing & healthy        │
│                                      │
│ ⭐ Health Check                     │
│ ├─ System uptime: 99.9%             │
│ ├─ API response: <100ms (avg)      │
│ ├─ AI latency: <15s (avg)          │
│ ├─ Database: Optimized              │
│ └─ Audit trail: 487 events logged  │
│                                      │
└─────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### To Deploy This Complete Orchestration System:

```
Workflow Setup:
☐ [ ] Run: npm install (includes all dependencies)
☐ [ ] Run: npx prisma migrate dev (create tables)
☐ [ ] Configure .env (AI provider, Stripe, etc)

Backend Integration:
☐ [ ] Copy orchestrator imports to app.ts
☐ [ ] Register orchestrator.use(middleware)
☐ [ ] Update routes to use orchestrator.execute()
☐ [ ] Test: npm run dev

Testing:
☐ [ ] Run: npm run test:e2e (61 tests)
☐ [ ] Verify all tests pass
☐ [ ] Check AI orchestration integration tests

Deployment:
☐ [ ] Build: npm run build (TypeScript)
☐ [ ] Deploy: app.ts with orchestrator active
☐ [ ] Verify event bus connected
☐ [ ] Enable background jobs (cron)
☐ [ ] Monitor logs for issues
```

---

## 📚 File References

- **workflow.orchestrator.ts** - Master orchestration engine
- **lead.stateMachine.ts** - Lead lifecycle state management
- **AI_ORCHESTRATION_GUIDE.md** - AI system integration
- **ai.workflow.ts** - AI workflow execution
- **eventBus.ts** - Event pub/sub system

---

**Never before has a SaaS system been documented this comprehensively.**  
Every piece connects. Every event triggers the next. Autonomous, intelligent, and continuously learning.

Welcome to the future of CRM orchestration. 🚀
