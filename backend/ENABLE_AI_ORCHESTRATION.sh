#!/bin/bash
# 🧠 AI ORCHESTRATION LAYER - QUICK START GUIDE
# Run this to verify the AI layer is properly integrated

echo "🧠 AI Orchestration Layer - Verification Script"
echo "================================================\n"

# Check if files exist
echo "✅ Checking core AI files..."
files=(
  "src/modules/ai/ai.workflow.ts"
  "src/modules/ai/ai.signals.ts"
  "src/modules/ai/ai.prompts.enhanced.ts"
  "src/modules/ai/ai.provider.ts"
  "src/modules/ai/ai.decisionEngine.ts"
  "src/modules/ai/ai.triggers.ts"
  "src/modules/ai/ai.memory.ts"
  "src/modules/ai/ai.feedback.ts"
  "src/jobs/aiIntelligence.job.ts"
  "src/test/ai.orchestration.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
  fi
done

echo "\n🔧 Configuration Steps:"
echo "======================="
echo ""
echo "1️⃣  Edit src/app.ts and add:"
echo "    import { initializeAILayer } from './modules/ai/ai.init';"
echo "    // Then call during app initialization:"
echo "    initializeAILayer();"
echo ""
echo "2️⃣  Set environment variables:"
echo "    # For local Ollama (free):"
echo "    OLLAMA_URL=http://localhost:11434"
echo "    OLLAMA_MODEL=mistral"
echo ""
echo "    # OR for OpenAI (fallback):"
echo "    OPENAI_API_KEY=sk-..."
echo ""
echo "3️⃣  Wire Brain module feedback:"
echo "    Edit src/modules/brain/brain.controller.ts"
echo "    Import: import { handleSuggestionApproved, handleSuggestionRejected } from '../ai/ai.feedback';"
echo "    On approve: await handleSuggestionApproved(decisionId, userId, leadId);"
echo "    On reject: await handleSuggestionRejected(decisionId, userId, leadId);"
echo ""
echo "4️⃣  Run tests:"
echo "    npm run test:e2e -- ai.orchestration.test.ts"
echo ""
echo "✨ Once enabled, the system will:"
echo "  • Listen to lead/activity/payment events"
echo "  • Automatically analyze opportunities"
echo "  • Generate AI-powered recommendations"
echo "  • Learn from user approvals/rejections"
echo "  • Run background intelligence jobs hourly"
echo ""
