# 🎯 AI ORCHESTRATION ARCHITECTURE REFERENCE

## 🏗 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INPUT LAYER (Event Triggers)                          │
│                                                                              │
│  lead.created ──┐                                                            │
│  lead.updated ──┼──→ eventBus.emit()                                         │
│  activity ──────┤                                                            │
│  payment ───────┘                                                            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ai.triggers.ts (Entry Point)                             │
│                                                                              │
│  Listeners register for all events                                           │
│  Call: runAIWorkflow(trigger)                                               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ↓
┌──────────────────────────────────────────────────────┬──────────────────────┐
│          ai.workflow.ts (Main Orchestrator)          │ 5 PHASES              │
│                                                      │                       │
│  ┌─────────────────────────────────────────────┐    │                       │
│  │ PHASE 1: Gather Context                     │    │ └─ gatherAIContext   │
│  │ • Fetch lead                                │    │    └─ 15 activities  │
│  │ • Fetch activities (last 15)                │    │    └─ 15 payments    │
│  │ • Fetch payments (last 15)                  │    │                       │
│  └─────────────────────────────────────────────┘    │                       │
│                   ↓                                  │                       │
│  ┌─────────────────────────────────────────────┐    │                       │
│  │ PHASE 2: Extract Signals                    │    │ └─ extractSignals    │
│  │ • Engagement Score (0-100)                  │    │    └─ urgency        │
│  │ • Close Probability (0-100)                 │    │    └─ dealHealth     │
│  │ • Deal Velocity (FAST/SLOW/STUCK)           │    │    └─ engagement     │
│  │ • Urgency (HIGH/MEDIUM/LOW)                 │    │    └─ probability    │
│  │ • Inactivity Gap (days)                     │    │                       │
│  └─────────────────────────────────────────────┘    │                       │
│                   ↓                                  │                       │
│  ┌─────────────────────────────────────────────┐    │                       │
│  │ PHASE 3: Call AI                            │    │ └─ getAIProvider()   │
│  │ • Build prompts (ANALYSIS, DECISION)        │    │    ├─ Ollama (fast) │
│  │ • Send to AI provider                       │    │    ├─ OpenAI (reliable)
│  │ • Parse response                            │    │    └─ Safe defaults  │
│  └─────────────────────────────────────────────┘    │                       │
│                   ↓                                  │                       │
│  ┌─────────────────────────────────────────────┐    │                       │
│  │ PHASE 4: Make Decision                      │    │ └─ makeDecision()    │
│  │ • Check rules first                         │    │    ├─ escalate?      │
│  │ • Parse AI output                           │    │    ├─ pause?         │
│  │ • Apply learning patterns                   │    │    └─ next action?   │
│  │ • Store decision                            │    │                       │
│  └─────────────────────────────────────────────┘    │                       │
│                   ↓                                  │                       │
│  ┌─────────────────────────────────────────────┐    │                       │
│  │ PHASE 5: Auto-Action (optional)             │    │ └─ if confidence > 85│
│  │ • Execute if confidence > 85%               │    │                       │
│  │ • Otherwise wait for user approval          │    │                       │
│  └─────────────────────────────────────────────┘    │                       │
└──────────────────────────────────┬──────────────────┴──────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DECISION STORED IN DB                                  │
│                                                                              │
│  db.decision {                                                               │
│    id, userId, leadId, type, recommendation, confidence, status             │
│  }                                                                           │
│                                                                              │
│  User sees in Brain module: "Recommendation for this lead"                   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   ↓
              ┌────────────────────┴───────────────────┐
              ↓                                         ↓
         ┌──────────┐                            ┌──────────┐
         │ APPROVE  │                            │ REJECT   │
         └─────┬────┘                            └────┬─────┘
               ↓                                      ↓
         ai.feedback.ts ◄────────────────────── ai.feedback.ts
         │                                     │
         ├─ Store approval                    ├─ Store rejection
         ├─ Use pattern                       ├─ Update distrust
         └─ Boost confidence                  └─ Suppress type
         
              Both feed into →

        ┌──────────────────────────────────┐
        │  ai.memory.ts (Learning)         │
        │                                  │
        │  • Channel preferences learned   │
        │  • Optimal contact time learned  │
        │  • Winning signals identified    │
        │  • User behavior patterns stored │
        │                                  │
        │  On next workflow:               │
        │  → personalize recommendations   │
        │  → use learned patterns          │
        │  → suppress low-trust types      │
        └──────────────────────────────────┘
```

---

## 🔄 Complete Event Loop

```
Timeline: Lead Creation to Auto-Improvement

T=0s   [USER ACTION] Create lead "Acme Corp" ($75k)
       └─→ Prisma create lead
           
T=0.1s [EVENT] emit("lead.created", { id: xyz, userId: u123 })

T=0.2s [TRIGGER] ai.triggers listener catches event
       └─→ Call runAIWorkflow({ event: "lead.created", leadId: xyz, userId: u123 })

T=0.5s [PHASE 1] Gather context
       ├─ Query lead: { company, stage, value, score }
       ├─ Query 15 activities
       └─ Query 15 payments
       Context loaded: { lead: {...}, activities: [], payments: [] }

T=1.0s [PHASE 2] Extract signals
       ├─ Calculate engagement_score: 45 (no activity yet)
       ├─ Calculate close_probability: 12% (no engagement, low signal)
       ├─ Calculate urgency: MEDIUM
       ├─ Calculate deal_health: AT_RISK
       └─ Signals ready to send to AI

T=2.5s [PHASE 3] Call AI
       ├─ Build ANALYSIS prompt: "Lead details + signals + task"
       ├─ Call Ollama: ollama.generate(prompt)
       ├─ Ollama returns: "Risk MEDIUM, probability 12%, recommend nurture"
       └─ AI response received in 1.8s

T=3.5s [PHASE 4] Make decision
       ├─ Check rules:
       │  ├─ Escalate? (value < $100k + urgency != CRITICAL) → NO
       │  ├─ Pause? (lastActivity > 1 day) → NO  
       │  ├─ Immediate followup? (stalled + valuable) → NO
       │  └─ Nurture? (engagement < 40) → YES!
       ├─ Apply rules: "NURTURE" decision preferred
       ├─ Parse AI output: Confirms "nurture" recommendation
       ├─ Apply learning patterns from user history:
       │  └─ User prefers WhatsApp for low-engagement leads → channel: WHATSAPP
       ├─ Create decision record:
       │  └─ db.decision { action: "NURTURE", priority: "MEDIUM", channel: "WHATSAPP" }
       └─ Decision stored in DB, status: "suggested"

T=4.0s [PHASE 5] Auto-action check
       ├─ Confidence: 0.65 (< 0.85 threshold)
       └─ Decision: Wait for user approval (no auto-execution)

T=4.1s [WORKFLOW COMPLETE]
       └─ Return: { decision_id: abc123, action: NURTURE, latency: 4.1s }

T=5.0s [USER ACTION] User opens Brain module, sees "Nurture lead with value asset"
       ├─ User reads recommendation
       └─ Options: [APPROVE] [REJECT] [MODIFY]

T=5.5s [USER ACTION] User clicks [APPROVE] ✓

T=5.6s [FEEDBACK] Call handleSuggestionApproved(decision_id, userId, leadId)
       ├─ Update decision.status: "approved"
       ├─ Store feedback event: { decision_type: "nurture", result: "approved" }
       └─ System notes: "User trusts 'nurture' recommendations"

T=5.7s [LEARNING] ai.memory updates user pattern:
       ├─ nurture_approval_rate: 78% (was 65%)
       ├─ nurture_confidence_boost: +0.1
       └─ Next time: nurture recommendations more confident

T=6.0s [NEXT WORKFLOW]
       When similar lead is created (low engagement + early stage):
       ├─ AI generates "NURTURE" suggestion
       ├─ System applies learned pattern: user likes nurture
       ├─ Confidence: 0.75 (boosted from learning)
       ├─ Recommended channel: WHATSAPP (learned preference)
       └─ Result: Better personalization!

BACKGROUND JOBS:

Every hour: job_detectInactiveLeads()
  ├─ Find leads with 0 activity for 7+ days
  ├─ Trigger AI workflow for each
  └─ Result: "Acme Corp inactive 8 days → URGENT ACTION SUGGESTED"

Every 2 hours: job_rescoreAllLeads()
  ├─ Recalculate score for every lead
  ├─ Update score if changed
  └─ Result: Scores stay fresh

Every 3 hours: job_suggestHighValueDeals()
  ├─ Find leads where value > $50,000
  ├─ Trigger AI workflow for strategic review
  └─ Result: "BigDeal Company: detailed next-steps plan"

Every hour: job_escalateCriticalDeals()
  ├─ Find deals at CRITICAL risk
  ├─ Create alerts for sales manager
  └─ Result: "URGENT: $500k deal in jeopardy"

Every day: job_cleanupStaleSuggestions()
  ├─ Archive suggestions older than 30 days
  ├─ Free up decision queue
  └─ Result: Keep system lean
```

---

## 📊 Decision Making Logic

```
When AI receives context for lead, it makes decision via:

RULE-BASED LAYER (Executes First):
├─ IF value > $100k AND urgency = CRITICAL
│  └─ DECISION: ESCALATE (confidence: 0.95)
│
├─ IF lastActivityGap <= 1 day
│  └─ DECISION: NO_ACTION, wait 3 days (confidence: 0.90)
│
├─ IF dealHealth = STALLED AND lastActivityGap > 7 AND value > $25k
│  └─ DECISION: IMMEDIATE_FOLLOWUP (confidence: 0.92)
│
└─ IF engagementScore < 40 AND lastActivityGap > 3
   └─ DECISION: NURTURE (confidence: 0.80)

IF No rule matched → AI LAYER:
├─ Load trained prompt template
├─ Inject signals + context
├─ Call AI provider
├─ Parse response for: "Most recommended action?"
└─ Return AI-generated decision

CONFIDENCE CALCULATION:
conf = (rule_confidence × 0.4) + (ai_confidence × 0.6)

CHANNEL SELECTION (from learned patterns):
├─ High value + CRITICAL → CALL (immediate)
├─ High value + URGENT → EMAIL (detailed)
├─ Medium value → WHATSAPP (personal)
└─ Low value → EMAIL or WHATSAPP (cheap)

PRIORITY ASSIGNMENT (from urgency):
├─ CRITICAL urgency → HIGH priority
├─ HIGH urgency → MEDIUM priority
├─ MEDIUM urgency → MEDIUM priority
└─ LOW urgency → LOW priority
```

---

## 🚀 Deployment Checklist

```
Pre-Flight:
  ☐ All 8 AI module files created
  ☐ aiIntelligence.job.ts created
  ☐ ai.orchestration.test.ts created
  ☐ Existing ai.context.ts, ai.orchestrator.ts files not modified
  ☐ Existing Brain module not modified (yet)

Configuration:
  ☐ Environment variables set (Ollama URL or OpenAI key)
  ☐ ai.init.ts file created (initialization)
  ☐ registerAITriggers() called in app.ts
  ☐ registerAICronJobs() called in app.ts

Testing:
  ☐ Run: npm run test:e2e -- ai.orchestration.test.ts
  ☐ All tests pass
  ☐ Performance: <30s per workflow

Integration:
  ☐ brain.controller.ts: Wire handleSuggestionApproved on approve
  ☐ brain.controller.ts: Wire handleSuggestionRejected on reject
  ☐ Build passes: npm run build
  ☐ No TypeScript errors

Monitoring:
  ☐ Ollama logs show requests (if using local)
  ☐ Backend logs show "AI WORKFLOW STARTED/COMPLETED"
  ☐ Background jobs run hourly (check logs)
  ☐ Decisions appear in db.decision table
```

---

## 🎓 Key Concepts

| Concept | Meaning | Example |
|---------|---------|---------|
| **Signal** | Derived intelligence from data | Urgency = CRITICAL (not just "score = 20") |
| **Trigger** | Event that starts AI workflow | lead.created, activity.created |
| **Prompt** | Structured input to AI | "Lead: Acme Corp, Stage: Proposal, Risk: HIGH, Task: Recommend action" |
| **Provider** | AI backend (Ollama, OpenAI) | Try Ollama first, fallback to OpenAI |
| **Decision** | End result of AI reasoning | "SCHEDULE_CALL with HIGH priority" |
| **Confidence** | How sure is the system (0-1) | 0.85 means 85% confident in this decision |
| **Pattern** | User behavior learned over time | "This user prefers emails over calls" |
| **Feedback Loop** | Learning from user approvals | User approves → boost similar suggestions next time |

---

## 📈 Success Metrics

Track these to measure AI effectiveness:

```
✅ Approval Rate
   = (approved decisions / total suggestions) × 100
   Target: > 70%
   
✅ Average Decision Latency
   = total workflow time
   Target: < 3 seconds
   
✅ Action Conversion
   = (approved decisions that resulted in lead progress) / approved
   Target: > 60%

✅ Engagement Lift
   = (avg engagement score after AI) - (before)
   Target: +15 points

✅ Close Rate Improvement
   = (close rate with AI suggestions) / (without)
   Target: > 1.3x (30% improvement)

✅ User Satisfaction
   = (approved / approved + rejected)
   Target: > 80%
```

---

## 🔔 Alerts & Monitoring

System will automatically create alerts for:

```
🚨 CRITICAL DEALS AT RISK
   - Value > $100k
   - Score < 30
   - No activity > 7 days
   
⚠️  HIGH-VALUE INACTIVITY
   - Value > $50k
   - No contact > 14 days
   
ℹ️  SUGGESTED ACTIONS PENDING
   - Recommendations waiting > 3 days
   - Approval needed
   
✅ PATTERN UPDATES
   - New channel preference learned
   - Optimal contact time updated
```

---

Generated: 2026-03-29
System Status: PRODUCTION-READY
