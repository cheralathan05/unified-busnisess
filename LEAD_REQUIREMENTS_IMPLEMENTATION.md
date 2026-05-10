# Lead Requirements - How to Get Maximum AI Response Quality

## Understanding Lead Requirements

For AI to provide smart analysis, leads need proper requirements data. Without it, AI has nothing to analyze.

### Lead Requirements Object Structure

```typescript
export type LeadRequirements = {
  features: string[];           // e.g., ["User dashboard", "Payment gateway"]
  budgetSummary: string;        // e.g., "₹1,50,000 - ₹2,00,000 for MVP"
  timelineSummary: string;      // e.g., "MVP in 2 weeks, Phase 2 in Q3"
  prioritySummary: string;      // e.g., "Payment integration is critical path"
  frontend: string[];           // e.g., ["React", "Tailwind CSS", "TypeScript"]
  backend: string[];            // e.g., ["Node.js", "PostgreSQL", "GraphQL"]
  integrations: string[];       // e.g., ["Stripe", "Zapier", "Slack"]
};
```

## Where Requirements Come From

### Source 1: Lead Input Form
When a lead is created, capture project details:
```json
{
  "name": "Rahul Sharma",
  "company": "Rahul Enterprises",
  "project": "E-commerce Website",
  "requirements": {
    "features": ["Product catalog", "User auth", "Payment", "Admin dashboard"],
    "budgetSummary": "₹1,50,000 - ₹2,00,000",
    "timelineSummary": "MVP in 4 weeks, Phase 2 in Q2",
    "prioritySummary": "Fast checkout flow is critical",
    "frontend": ["React", "Tailwind"],
    "backend": ["Node.js", "PostgreSQL"],
    "integrations": ["Razorpay", "AWS S3"]
  }
}
```

### Source 2: Meeting Transcript Analysis
When you upload a Google Meet transcript, AI extracts requirements:

**Meeting Transcript:**
> "We need a website for our e-commerce business. It should have a product catalog with search, user login system, and Razorpay payment integration. We want the MVP launched in 4 weeks, not more. The most critical thing is making the checkout fast - we want less than 3 seconds load time. We're planning Phase 2 features like mobile app for Q2 next year. Our budget is around ₹1.5 to 2 lakhs."

**AI Extracts → Requirements:**
```json
{
  "features": ["Product catalog", "Search", "User login", "Razorpay payment integration", "Fast checkout"],
  "budgetSummary": "₹1,50,000 - ₹2,00,000",
  "timelineSummary": "MVP in 4 weeks, Phase 2 in Q2 next year",
  "prioritySummary": "Checkout performance <3s load time is critical",
  "frontend": ["React or Vue.js"],
  "backend": ["Node.js", "Python or similar"],
  "integrations": ["Razorpay"]
}
```

### Source 3: Manual Update After Discovery Call
After talking to the lead, sales rep fills in details:
```
Lead: Rahul Sharma
Meeting Notes: Discussed tech stack preferences
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL
- They want AWS deployment
- Budget confirmed: ₹1.5L - ₹2L
- Timeline: Strict 4-week deadline for MVP
- Priority: Payment integration + fast performance
```

## What AI Does With Requirements

### 1. Scoring Uses Requirements

**Without Requirements:**
```
Lead score calculation uses:
- Stage (Discovery, Qualified, etc.)
- Budget value (numeric)
- Time since last activity
- Score: 45-60 (generic range)
```

**With Requirements:**
```
Lead score calculation uses:
- Stage + engagement history
- Budget value + requirements complexity match
- Feature requests vs typical project scope
- Technology stack sophistication
- Timeline urgency signals
- Score: 65-95 (more accurate, contextual)

Reasoning: "Lead Rahul has sophisticated requirements (React + PostgreSQL + 
integrations) with ₹1.5L budget - realistic for 4-week MVP. High decision-maker 
involvement (discussed tech stack). Urgent deadline signals serious intent. Score 82."
```

### 2. Next Action Suggests Based on Requirements

**Without Requirements:**
```
Action: "call"
Message: "Follow up to help move this deal forward"
```

**With Requirements:**
```
Action: "Schedule discovery call"
Message: "Discuss React vs Vue choice, Razorpay integration timeline, 
        confirm PostgreSQL preference, and set up technical workshop"
Channel: "call"
Confidence: 0.92
```

### 3. Email Draft References Requirements

**Without Requirements:**
```
Subject: Let's discuss your project
Hi Rahul,
I'd love to hear more about your project and see how we can help.
Best regards
```

**With Requirements:**
```
Subject: E-commerce MVP - React + Razorpay Integration Strategy

Hi Rahul,

Thanks for discussing your e-commerce platform needs. Your 4-week MVP timeline 
with React frontend + Node.js backend is ambitious but achievable. 

Given your focus on fast checkout performance (<3s), I'd recommend:
• Express.js with caching layer for API responses
• Razorpay integration with webhooks for reliability
• React optimization (code splitting, lazy loading)

For your ₹1.5L - ₹2L budget, here's what we can scope:
Phase 1 (Weeks 1-4): Product catalog, auth, Razorpay integration
Phase 2 (Q2): Mobile app, advanced analytics, inventory management

I'd like to set up a technical workshop with your team to finalize the 
stack and confirm deployment requirements.

Are you available this week for a 30-minute call?

Best regards
```

### 4. Risk Analysis Uses Requirements

**Without Requirements:**
```
Risk Level: Medium
Risk Factors: ["Limited contact frequency", "Budget to scope mismatch"]
```

**With Requirements:**
```
Risk Level: Low
Risk Factors: ["4-week MVP timeline is tight for 6 features", 
              "Payment integration adds complexity"]
Close Probability: 78%
Reasoning: "All critical signals aligned: clear scope, realistic budget-scope 
          match, technical preferences defined, decision-maker engaged, 
          urgent timeline shows commitment. Main risk is timeline aggressiveness 
          with payment integration, but feasible with React + Node.js stack."
```

## How to Populate Requirements

### API: Create Lead with Requirements
```bash
POST /api/leads
{
  "name": "Rahul Sharma",
  "company": "Rahul Enterprises",
  "email": "rahul@enterprise.com",
  "value": 175000,
  "stage": "Discovery",
  "projectDescription": "E-commerce website with catalog, auth, payment",
  "requirements": {
    "features": ["Product catalog", "User auth", "Payment gateway", "Admin panel"],
    "budgetSummary": "₹1,50,000 - ₹2,00,000",
    "timelineSummary": "MVP in 4 weeks, Phase 2 in Q2",
    "prioritySummary": "Fast checkout <3s, Razorpay integration critical",
    "frontend": ["React", "Tailwind CSS", "TypeScript"],
    "backend": ["Node.js", "Express", "PostgreSQL"],
    "integrations": ["Razorpay", "AWS S3", "SendGrid"]
  }
}
```

### API: Ingest Meeting Transcript
```bash
POST /api/leads/1/meeting/transcript
{
  "transcript": "[Full Google Meet transcript here]",
  "meetingTitle": "E-commerce Platform Requirements Discussion",
  "meetingDate": "2026-05-10"
}

# AI Automatically Extracts:
# - features: [...]
# - budgetSummary: "..."
# - timelineSummary: "..."
# - prioritySummary: "..."
# - frontend: [...]
# - backend: [...]
# - integrations: [...]
```

### Frontend: Lead Update Form
Requirements should be fillable in the lead detail form:
```
[Lead Name] [Company] [Email] [Phone]
[Budget] [Stage] [Owner]

=== REQUIREMENTS ===
[Textarea] Project Description
[Multi-input] Features needed
[Textarea] Budget summary
[Textarea] Timeline summary  
[Textarea] Priority summary
[Multi-input] Frontend tech
[Multi-input] Backend tech
[Multi-input] Integrations needed

[Save Lead]
```

## Testing Requirements -> AI Response

### Test 1: Score Improvement
```bash
# Lead WITHOUT requirements
POST /api/leads
{
  "name": "John Doe",
  "company": "Company",
  "value": 100000,
  "stage": "Discovery"
}
Response: score: 45, reasoning: "generic"

# Same lead WITH requirements
PUT /api/leads/1
{
  "requirements": {
    "features": ["Dashboard", "API", "Admin"],
    "budgetSummary": "₹1L fixed for 8 weeks",
    ...
  }
}
Response: score: 72, reasoning: "Smart analysis using requirements"
```

### Test 2: Meeting Transcript Extraction
```bash
POST /api/leads/1/meeting/transcript
{
  "transcript": "[Your Google Meet transcript]"
}

Response:
{
  "requirements": {
    "features": ["extracted from transcript"],
    "budgetSummary": "extracted from transcript",
    ...
  }
}
```

### Test 3: Intelligence Endpoint Shows Requirements
```bash
GET /api/leads/1/intelligence

Response:
{
  "breakdown": {
    "budgetMatch": 92,  # ← Uses requirements to calculate
    "urgency": "High",   # ← From timelineSummary
    "industryFit": "Strong",
    "communication": "Responsive"
  }
}
```

## Key Takeaways

1. **AI needs input to provide output** - Requirements are the fuel for AI analysis
2. **Three ways to add requirements:**
   - During lead creation (form input)
   - From meeting transcripts (automatic extraction)
   - Manual update after discovery call
3. **Requirements unlock smarter features:**
   - Accurate scoring (not generic)
   - Contextual recommendations (not template)
   - Risk identification (based on actual data)
   - Better email drafts (personalized)
4. **All features work without requirements** - They just use defaults
   - With requirements: Score 72 vs without: Score 45
   - With requirements: Specific email vs without: Template

## Next Action

1. **For Existing Leads**: Update with requirements from past meetings
2. **For New Leads**: Capture requirements during intake
3. **For Leads from Meetings**: Upload transcript for automatic extraction
4. **Test AI Response**: Compare before/after intelligence endpoint

This is how AI becomes "Smart" - it analyzes real data, not placeholders.
