# AI Response Fix - Implementation Guide

## Root Cause
The backend is configured to use models that don't exist in Ollama:
- Expects: `phi3` (classifier), `mistral` (reasoning)
- Available: Only `llama3:latest`

When backend tries to call non-existent models, Ollama returns 404, and the service returns fallback "AI unavailable" responses.

## Solution Options

### Option 1: Install Missing Models (Recommended for Production)
```bash
ollama pull phi3
ollama pull mistral
```
Then Ollama will have all models ready.

### Option 2: Configure Backend to Use llama3 Only (Quick Fix)
Update backend environment to use `llama3` for all tasks:
```env
OLLAMA_MODEL=llama3
OLLAMA_MODEL_TEXT=llama3
OLLAMA_MODEL_CLASSIFIER=llama3
OLLAMA_MODEL_REASONING=llama3
OLLAMA_TIMEOUT_MS=6000  # Increase timeout since one model handles all
```

### Option 3: Update Code to Fallback Better
Modify `backend/src/modules/ai/ollama.service.ts` to fallback gracefully when model doesn't exist.

## Implementation Steps

### Step 1: Check Installed Models
```bash
curl -s http://localhost:11434/api/tags | jq '.models[].name'
# Output: llama3:latest
```

### Step 2: Fix Backend Configuration
Create or update `backend/.env`:
```
OLLAMA_MODEL=llama3
OLLAMA_MODEL_TEXT=llama3
OLLAMA_MODEL_CLASSIFIER=llama3
OLLAMA_MODEL_REASONING=llama3
OLLAMA_TIMEOUT_MS=6000
OLLAMA_URL=http://localhost:11434
```

### Step 3: Restart Backend
```bash
cd backend
npm run dev  # or restart current process
```

### Step 4: Test AI Responses
```bash
# Test lead scoring
curl -X POST http://localhost:5000/api/leads/1/score \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should return: { success: true, data: { score: <number>, reasoning: <string> } }
# NOT: { success: true, data: { score: 0, reasoning: "AI unavailable" } }
```

## Code Changes Required

### File: `backend/.env`
**Add these lines or update existing ones:**
```env
OLLAMA_MODEL=llama3
OLLAMA_MODEL_TEXT=llama3
OLLAMA_MODEL_CLASSIFIER=llama3
OLLAMA_MODEL_REASONING=llama3
OLLAMA_TIMEOUT_MS=6000
```

### File: `backend/src/modules/ai/ollama.service.ts` (Optional Improvement)
**Add model fallback logic:**
```typescript
// Lines 74-82 - Improve fallback chain
const modelCandidates = [
  options.model,
  this.model,
  env.OLLAMA_MODEL_TEXT,  // Add TEXT as fallback
  "llama3",                // Ultimate fallback
  "llama3:latest"          // Last resort
].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

// For each model, try to generate - this ensures we find a working model
```

## Test Checklist

After fix, verify these endpoints work:

- [ ] `POST /api/leads/:id/score` - Returns score 0-100, not 0 with fallback
- [ ] `POST /api/leads/:id/predict` - Returns real probability, confidence, risk factors
- [ ] `GET /api/leads/:id/action` - Returns specific action, not generic
- [ ] `GET /api/leads/:id/intelligence` - Shows analysis breakdown
- [ ] `POST /api/leads/:id/email` - Drafts contextual email
- [ ] `GET /api/leads/:id/summary` - Shows summary (not placeholder)
- [ ] `GET /api/leads/:id/insights` - Shows insights array

## Expected Behavior After Fix

### Before Fix (Current)
```json
{
  "success": true,
  "data": {
    "score": 0,
    "reasoning": "Lead Rahul at Rahul Enterprises is in Discovery stage with estimated value ₹1,50,000."
  },
  "status": "fallback"
}
```

### After Fix
```json
{
  "success": true,
  "data": {
    "score": 87,
    "reasoning": "Strong engagement signals: Active communication history, high-value deal (₹1,50,000), decision-maker available. Recent activity shows 4 interactions in last 7 days.",
    "status": "success"
  },
  "meta": {
    "source": "ai",
    "cache": "miss",
    "processingMs": 2145
  }
}
```

## Why Each AI Call Fails Currently

| Method | Model Used | Status | Issue |
|--------|-----------|--------|-------|
| `scoreLead()` | phi3 (CLASSIFIER) | ❌ Not installed | Returns 404 → Fallback |
| `predictDeal()` | llama3 (TEXT) | ✓ Available | Works, but called with phi3 first |
| `analyzeSentiment()` | phi3 (CLASSIFIER) | ❌ Not installed | Returns 404 → Fallback |
| `suggestNextAction()` | llama3 (TEXT) | ✓ Available | Works but sometimes times out |
| `analyzeMeetingTranscript()` | mistral (REASONING) | ❌ Not installed | Returns 404 → Fallback |
| `validatePaymentProof()` | mistral (REASONING) | ❌ Not installed | Returns 404 → Fallback |

## Verification Command

After applying the fix, run this to verify AI is responding:

```bash
# Navigate to backend
cd backend

# Run a quick test
npm run dev &

# Wait 5 seconds then test
sleep 5

# Test Ollama connection
curl -s http://localhost:11434/api/tags | jq '.' 

# Test backend health (if there's a health endpoint)
curl -s http://localhost:5000/api/health

# Test lead API with a real lead ID
curl -s http://localhost:5000/api/leads/1/intelligence \
  -H "Authorization: Bearer test_token"
```

## Environment Variables Reference

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3                          # Default/fallback model
OLLAMA_MODEL_TEXT=llama3                     # For text generation, summaries
OLLAMA_MODEL_CLASSIFIER=llama3               # For classification tasks (use phi3 if available)
OLLAMA_MODEL_REASONING=llama3                # For complex reasoning (use mistral if available)
OLLAMA_TIMEOUT_MS=6000                       # Timeout for each AI call in ms

# Recommendation for Current Setup:
# All models should be 'llama3' since only that's installed
```

## Next Steps After Fix

1. **Verify responses are not fallbacks** - Check status field is "success", not "fallback"
2. **Test with real lead data** - Ensure AI analyzes actual lead details, not defaults
3. **Check Frontend displays insights** - Lead detail page should show AI analysis
4. **Monitor performance** - Adjust OLLAMA_TIMEOUT_MS if calls are slow
5. **Consider installing phi3/mistral** - For production, install specialized models for better accuracy

## Rollback If Issues Occur

If the fix causes problems:
```bash
# Revert env variables to fallback-only mode
OLLAMA_MODEL=llama3
OLLAMA_TIMEOUT_MS=4500

# This will still return fallback responses but won't break
```

## Additional Notes

- Each AI model is specialized (phi3 = classification, mistral = reasoning), so llama3 for all is a compromise
- Llama3 is capable but slower for classification tasks (~2-3 seconds per call)
- Increase OLLAMA_TIMEOUT_MS to 6000-8000ms for better reliability
- The caching system in lead.service.ts will reduce repeated calls (2-minute TTL)
