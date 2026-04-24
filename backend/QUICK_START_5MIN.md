# ⚡ QUICK START: 5-MINUTE DEPLOYMENT GUIDE

> Get the master orchestrator system running in 5 minutes

---

## 📋 PRE-REQUISITES

- [x] Node.js + npm installed
- [x] PostgreSQL running (or use existing db)
- [x] 61 E2E tests passing: `npm run test`
- [x] Clean build: `npm run build`

If not ready: See [WORKFLOW_INTEGRATION_GUIDE.md](WORKFLOW_INTEGRATION_GUIDE.md)

---

## ⚡ 5-MINUTE STEPS

### MINUTE 1: Wire Orchestrator in app.ts

**File**: `backend/src/app.ts`

```typescript
// Add imports at top
import { orchestrator } from './core/workflows/workflow.orchestrator';

// Inside Express app initialization (after middleware):
app.use((req: any, res, next) => {
  req.orchestrator = orchestrator;
  next();
});

// That's it. Orchestrator is now available in all routes.
```

### MINUTE 2: Update Routes to Use Orchestrator

**File**: `backend/src/routes/api.ts` (or wherever routes are defined)

Replace:
```typescript
// OLD: Direct service call
router.post('/leads', async (req, res) => {
  const lead = await leadService.create(req.user.id, req.body);
  res.json(lead);
});
```

With:
```typescript
// NEW: Via orchestrator
router.post('/leads', async (req, res) => {
  try {
    const result = await req.orchestrator.execute({
      userId: req.user.id,
      action: 'CREATE_LEAD',
      module: 'CRM',
      timestamp: new Date(),
      metadata: req.body
    });
    res.status(201).json(result.data);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});
```

### MINUTE 3: Connect Event Listeners

**File**: `backend/src/core/events/eventBus.ts` (or create if missing)

```typescript
import { eventBus } from '../core/events/eventBus';

// User events
eventBus.on('user.registered', async (data) => {
  console.log('✅ User registered:', data.id);
  // Queue welcome email
});

// Lead events  
eventBus.on('lead.created', async (data) => {
  console.log('✅ Lead created:', data.id);
  // AI workflow automatically triggers in lead module
});

eventBus.on('activity.created', async (data) => {
  console.log('✅ Activity logged:', data.id);
  // Engagement updates + AI re-evaluation
});

// AI events
eventBus.on('brain.suggested', async (data) => {
  console.log('🤖 Suggestion:', data.decisionId);
  // Dashboard displays suggestion
});

eventBus.on('suggestion.approved', async (data) => {
  console.log('✅ User approved:', data.decisionId);
  // AI learns + executes action
});
```

### MINUTE 4: Build & Test

```bash
# Build (should complete with 0 errors)
npm run build

# Test (should show 61/61 passing)
npm run test

# Expected output:
# ✓ src/test/api.e2e.test.ts (61 tests)
# Tests: 61 passed (61)
```

### MINUTE 5: Start Server

```bash
# Start server
npm run dev

# Expected output:
# Server running on http://localhost:3000
# Orchestrator initialized
# Event bus connected
# Ready for requests
```

---

## ✅ VERIFY IT'S WORKING

### Test 1: Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'
```

**Expected**: 201 Created, user object returned

### Test 2: Create Lead

```bash
# Use token from login
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Acme Corp",
    "company": "Acme Inc",
    "email": "contact@acme.com",
    "value": 100000,
    "stage": "INITIAL_CONTACT"
  }'
```

**Expected**:
```json
{
  "id": "lead_xxx",
  "name": "Acme Corp",
  "score": 30,
  "health": "HEALTHY",
  "engagement": 0,
  "createdAt": "..."
}
```

### Test 3: Check Event Emission

**Server logs should show**:
```
🚀 WORKFLOW STARTED: CRM:CREATE_LEAD
📍 Workflow: CRM:CREATE_LEAD
✅ Lead created: lead_xxx
🤖 AI workflow triggered
✅ WORKFLOW COMPLETED: CRM:CREATE_LEAD
✅ Execution Time: 1247ms
✅ Events Emitted: 2
✅ Side Effects: 5
```

---

## 🎯 WHAT'S NOW ACTIVE

✅ **Orchestrator**: Routes all requests through master workflow engine  
✅ **Event Bus**: All modules emit events, listeners react  
✅ **State Machine**: Lead transitions validated  
✅ **AI Brain**: Generates suggestions on lead creation  
✅ **Background Jobs**: Running intelligence tasks hourly/daily  
✅ **Audit Trail**: All actions logged  
✅ **Metrics**: Dashboard shows real-time stats  

---

## 🚀 NEXT STEPS

1. **Monitor AI Suggestions** in dashboard
   - Create leads, watch AI suggestions appear
   - Approve/reject to trigger learning

2. **Check Logs** for event flow
   - See user.registered → init org → send email chain

3. **Test State Machine** 
   - Create lead, log activities, update stage
   - Watch score/health update

4. **Verify Cascade Safety**
   - Create lead with activities/payments
   - Delete lead → activities cascade
   - Payments preserved for audit

5. **Load Test** (optional)
   - Create 100 leads quickly
   - Watch background jobs handle rescoring
   - Monitor performance metrics

---

## 🐛 TROUBLESHOOTING

### Issue: "Orchestrator not found"
```
Error: req.orchestrator is undefined
```
**Solution**: Ensure orchestrator is imported and wired in app.ts
```typescript
import { orchestrator } from './core/workflows/workflow.orchestrator';
app.use((req: any, res, next) => {
  req.orchestrator = orchestrator;
  next();
});
```

### Issue: "Events not firing"
```
No console.log output
```
**Solution**: Check event listeners are registered with event bus
```typescript
import { eventBus } from './core/events/eventBus';
eventBus.on('lead.created', (data) => {
  console.log('Lead event fired:', data);
});
```

### Issue: "State transition blocked"
```
Error: Cannot transition from INITIAL_CONTACT to CLOSED_WON
```
**Solution**: Follow valid state machine transitions (see lead.stateMachine.ts)
```
Valid path: INITIAL → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON
```

### Issue: "AI not responding"
```
Workflow times out at AI phase
```
**Solution**: Check Ollama/OpenAI configuration in .env
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
# or
OPENAI_API_KEY=sk-xxx
```

---

## 📊 MONITORING CHECKLIST

- [ ] Server starts without errors
- [ ] 61 E2E tests pass
- [ ] HTTP requests return 2xx/4xx (not 5xx)
- [ ] Event logs show emission + listener execution
- [ ] Timestamps are consistent across events
- [ ] Database updates match request data
- [ ] Cache invalidates correctly
- [ ] Audit trail populates all actions
- [ ] AI suggestions appear within 5s
- [ ] Background jobs run on schedule

---

## 🎉 SUCCESS INDICATOR

When you see this in logs:

```
🚀 WORKFLOW STARTED: CRM:CREATE_LEAD
📍 Workflow: CRM:CREATE_LEAD
✅ Lead created: lead_abc123
🤖 AI workflow triggered
✅ WORKFLOW COMPLETED: CRM:CREATE_LEAD
✅ Execution Time: 1247ms
✅ Events Emitted: 2
✅ Side Effects: 5
```

**You're live! 🚀**

---

## 📚 DEEPER LEARNING

- **Complete System**: [MASTER_WORKFLOW_ORCHESTRATION.md](MASTER_WORKFLOW_ORCHESTRATION.md)
- **Integration Details**: [WORKFLOW_INTEGRATION_GUIDE.md](WORKFLOW_INTEGRATION_GUIDE.md)  
- **Architecture**: [SYSTEM_ARCHITECTURE_COMPLETE.md](SYSTEM_ARCHITECTURE_COMPLETE.md)
- **Phase Completion**: [PHASE_6_COMPLETION_SUMMARY.md](PHASE_6_COMPLETION_SUMMARY.md)

---

**You now have a production-grade CRM orchestration system. Welcome to the future! 🌟**
