# Lead Requirements & AI Response Guide

## Problem
The AI is not responding with proper analysis based on actual lead requirements. The system falls back to default responses instead of generating contextual, requirement-based analysis.

## Lead Requirements Structure

### Lead Record Type (`src/lib/lead-store.ts`)
```typescript
export type LeadRequirements = {
  features: string[];           // What features the lead needs
  budgetSummary: string;        // Budget breakdown/summary
  timelineSummary: string;      // Project timeline expectations
  prioritySummary: string;      // Priority indicators
  frontend: string[];           // Frontend tech requirements
  backend: string[];            // Backend tech requirements
  integrations: string[];       // Third-party integrations needed
};

export type LeadRecord = {
  id: number;
  dealId: string;
  name: string;
  company: string;
  project: string;
  status: "hot" | "warm" | "cold";
  budgetLabel: string;          // e.g., "₹1,50,000"
  budgetValue: number;          // Numeric value for calculations
  score: number;                // 0-100 lead score
  source: string;               // Where lead came from
  owner: string;                // Sales person assigned
  phone: string;
  email: string;
  insight: string;              // AI-generated insight
  nextAction: string;           // Recommended next action
  lastActivity: string;         // When last touched
  notes: string;                // Sales notes
  projectDescription?: string;  // Full project description
  meetingNotes?: string;        // Notes from meetings
  requirements?: LeadRequirements; // *** CRITICAL: Project requirements
};
```

## AI Response Methods (Backend: `backend/src/modules/ai/ai.service.ts`)

### 1. Lead Scoring (`scoreLead`)
**Purpose**: Score lead 0-100 based on engagement, budget, stage, communication
**Input**: Lead object with all fields
**Output**: `{ score: number; reasoning: string }`
**Currently**: Returns fallback if AI times out

**What Should Happen**:
- Analyze: Budget value, stage, communication frequency, payment history
- Consider: Company size signals, decision-maker indicators
- Return: Score 0-100 with specific reasons (NOT generic fallback)

### 2. Next Action Suggestion (`suggestNextAction`)
**Purpose**: Recommend specific next action based on lead state
**Input**: Lead data, recent activities, payment history
**Output**: `{ action: string; channel: "email"|"whatsapp"|"call"; message: string; confidence: number }`
**Currently**: Returns generic "Send Reminder" fallback

**What Should Happen**:
- If hot + qualified: "Schedule Discovery Call" via call
- If warm + unresponsive 3+ days: "Send re-engagement email" via email
- If proposal pending: "Check proposal status" via call
- If payment received: "Send onboarding sequence" via email
- Specific, actionable messages (NOT templates)

### 3. Deal Prediction (`predictDeal`)
**Purpose**: Predict close probability, timeline, risks
**Input**: Lead with all context
**Output**: `{ probability: number; expectedCloseDate: string; confidence: number; riskLevel: "low"|"medium"|"high"; riskFactors: string[] }`
**Currently**: Returns 35-90% with generic risk factors

**What Should Happen**:
- Analyze: Stage, activity frequency, budget vs complexity match
- Consider: Historical lead patterns, industry signals
- Identify Actual Risks:
  - "No decision-maker identified" (if owner missing)
  - "Budget ₹50k unrealistic for 3-month project" (if mismatch)
  - "3 days silence after proposal" (if stalled)
- Date prediction: Based on stage duration averages, NOT generic +7 days

### 4. Meeting Transcript Analysis (`analyzeMeetingTranscript`)
**Purpose**: Extract requirements from Google Meet transcript
**Input**: Meeting transcript + lead context
**Output**: `{ summary, requirements: MeetingRequirement[], nextAction, confidence }`
**Requirements Format**: `{ title, category: "feature"|"technical"|"business"|"timeline", priority: "high"|"medium"|"low", confidence }`
**Currently**: Falls back to keyword extraction if AI unavailable

**What Should Happen**:
- Parse transcript for explicit requirements
- Categories:
  - **Feature**: "User dashboard", "Payment gateway", "Mobile app"
  - **Technical**: "React frontend", "Node.js backend", "PostgreSQL", "AWS"
  - **Business**: "Budget ₹2,50,000", "30-day delivery", "Maintenance contract"
  - **Timeline**: "MVP in 2 weeks", "Phase 2 in Q3", "Go-live by Dec 31"
- Priority based on emphasis/repetition in transcript
- Confidence 0.7+ if explicit, 0.5-0.6 if inferred

## Current Issues & Fixes

### Issue 1: Fallback Summaries
**Current**: "Lead Rahul at Rahul Enterprises is in Discovery stage with estimated value ₹1,50,000."
**Should Be**: "[AI from lead.summary field] OR analyzed from requirements"

**Fix Location**: `backend/src/modules/lead/lead.service.ts` (lines 95-100)
```typescript
// BEFORE: Uses buildReadableSummary as fallback
function isPlaceholderSummary(summary: unknown): boolean {
  return !s || s.includes("ai unavailable");
}

// SHOULD: Never use placeholder if requirements exist
function isPlaceholderSummary(summary: unknown, requirements?: LeadRequirements): boolean {
  const s = String(summary || "").toLowerCase();
  if (requirements?.features?.length) return false; // Has real data
  return !s || s.includes("ai unavailable");
}
```

### Issue 2: No AI Response on Lead Details
**Current**: `GET /api/leads/:id/intelligence` returns hardcoded breakdown values
**Should Be**: Call `aiService.scoreLead()` and `aiService.predictDeal()` to generate actual analysis

**Fix Location**: `backend/src/modules/lead/lead.service.ts` (lines 450-480, `getIntelligence` method)
```typescript
// Generate budgetMatch from actual lead requirements vs industry standards
// Generate urgency from stage + recent activity + deadline
// Generate industryFit from requirements match + score
// DON'T use fixed thresholds like score >= 85
```

### Issue 3: Generic Next Actions
**Current**: Falls back to "call" for Discovery, "email" for others
**Should**: Analyze actual lead state (activity, stage, requirements)

**Fix Location**: `backend/src/modules/lead/lead.service.ts` (lines 340-355, `getAction` method)
```typescript
// This method calls aiService.suggestNextAction but result isn't used properly
const suggestion = await aiService.suggestNextAction({
  lead,
  activities: lastActivities,
  payments: lastPayments
});

// CURRENTLY: Returns generic response, SHOULD: Return AI suggestion with context
```

### Issue 4: No Requirements-Based Email Drafts
**Current**: `draftEmail` uses basic lead data
**Should**: Include requirements context in prompt

**Fix Location**: `backend/src/modules/ai/ai.prompts.ts`
```typescript
// SHOULD include requirements in context:
export function buildAIFollowupEmailPrompt(data: LeadPromptInput & { requirements?: LeadRequirements }): string {
  // Mention specific features/timeline from requirements
  // Reference technical requirements for credibility
  // Show understanding of budget constraints
}
```

## Implementation Checklist

- [ ] **Verify Ollama Running**: `ollama serve` (check env: `VITE_OLLAMA_URL` defaults to `http://localhost:11434`)
- [ ] **Check AI Timeout**: If calls timeout, increase `env.OLLAMA_TIMEOUT_MS` (backend)
- [ ] **Test scoreLead**: Ensure it returns actual score, not 0
- [ ] **Test suggestNextAction**: Should return specific action, not generic "Send Reminder"
- [ ] **Test predictDeal**: Should have real risk factors, not empty array
- [ ] **Test analyzeMeetingTranscript**: Should extract real requirements from transcript
- [ ] **Update prompts**: Ensure AI system prompts include requirements context
- [ ] **Frontend Integration**: Lead detail page should display AI-generated insights, not defaults

## API Endpoints That Depend on AI Responses

| Endpoint | Method | Purpose | AI Service Used |
|----------|--------|---------|-----------------|
| `/api/leads/:id/intelligence` | GET | Lead analysis dashboard | scoreLead, predictDeal |
| `/api/leads/:id/score` | POST | Get lead score | scoreLead |
| `/api/leads/:id/predict` | POST | Close probability & risks | predictDeal |
| `/api/leads/:id/action` | GET | Next recommended action | suggestNextAction |
| `/api/leads/:id/summary` | GET | Lead summary | (stored in DB, from AI) |
| `/api/leads/:id/insights` | GET | Lead insights | (stored in DB, from AI) |
| `/api/leads/:id/email` | POST | Draft follow-up email | generateText (with prompts) |
| `/api/leads/:id/meeting/transcript` | POST | Ingest meeting notes | analyzeMeetingTranscript |
| `/api/leads/analyze-all` | POST | Batch analyze all leads | scoreLead + predictDeal |

## Debug Commands

```bash
# Test backend AI endpoint directly
curl -X POST http://localhost:5000/api/leads/1/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check Ollama health
curl http://localhost:11434/api/tags

# Check environment variables
echo $OLLAMA_MODEL_TEXT
echo $OLLAMA_MODEL_CLASSIFIER
echo $OLLAMA_TIMEOUT_MS
```

## Summary

**The AI system has the infrastructure but lacks:**
1. Real requirement parsing (everything is placeholder)
2. Contextual analysis (uses fallbacks instead of AI)
3. Requirement-aware prompts (generic templates, not lead-specific)
4. Proper error handling (doesn't differentiate between timeouts and empty responses)

**Fix Strategy:**
1. Ensure Ollama is running and responding
2. Check AI service methods are returning non-null, non-fallback responses
3. Update prompts to include lead requirements context
4. Validate lead data has requirements populated from meetings/intake
