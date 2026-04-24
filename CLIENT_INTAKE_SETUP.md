# 🚀 Premium Client Intake System - Setup & Integration Guide

## 🎯 Overview

This is a production-ready **Client Intake / Send Client Link Page** for "Unifies Business" with:
- ✅ Multi-step intelligent form (6 steps)
- ✅ Real-time AI analysis via Ollama
- ✅ Dynamic pricing engine
- ✅ Smart feature suggestions
- ✅ Floating contact hub
- ✅ Auto-save & validation
- ✅ AI-generated requirements page
- ✅ Backend API integration

---

## 📦 File Structure

```
src/
├── pages/
│   ├── ClientIntakePremium.tsx      # Main intake form (ENHANCED)
│   └── RequirementsPage.tsx         # AI requirements viewer
├── components/
│   ├── AIAnalysisBox.tsx            # AI insights component
│   └── FloatingContactHub.tsx       # Contact widget
├── lib/
│   └── ai-ollama-service.ts         # Ollama AI integration
backend/
├── src/modules/client-intake/
│   └── client-intake.routes.ts      # Backend API endpoints
```

---

## 🤖 OLLAMA AI SETUP (CRITICAL)

### Step 1: Install Ollama
1. Download from https://ollama.ai
2. Follow OS-specific instructions
3. Run: `ollama serve`

### Step 2: Pull a Model
```bash
# Fast & Smart (Recommended)
ollama pull mistral

# Alternative Options
ollama pull llama2        # Best quality
ollama pull neural-chat   # Fast & conversational
ollamapull dolphin-mixtral  # Dolphin optimized
```

### Step 3: Verify It's Running
```bash
curl http://localhost:11434/api/tags
# Should return a JSON list of available models
```

### Step 4: Configure Environment
Create `.env` in frontend root:
```env
VITE_OLLAMA_URL=http://localhost:11434
```

---

## 📥 INTEGRATION CHECKLIST

### Frontend Integration

#### 1. **Route Setup** (src/App.tsx or main router)
```tsx
import ClientIntakePremium from "./pages/ClientIntakePremium";
import RequirementsPage from "./pages/RequirementsPage";

// Add routes
<Route path="/intake/:accessId" element={<ClientIntakePremium />} />
<Route path="/requirements/:leadId" element={<RequirementsPage />} />
```

#### 2. **API Client Setup** (src/lib/api-client.ts)
```tsx
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export async function submitClientIntake(data: ClientIntakeForm) {
  const response = await fetch(`${API_URL}/client-intake/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Intake submission failed");
  return response.json();
}

export async function getRequirements(leadId: string) {
  const response = await fetch(`${API_URL}/requirements/${leadId}`, {
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  });
  
  return response.json();
}
```

### Backend Integration

#### 1. **Register Routes** (backend/src/routes/index.ts)
```tsx
import clientIntakeRoutes from "../modules/client-intake/client-intake.routes";

// Add to router
router.use("/client-intake", clientIntakeRoutes);
```

#### 2. **Database Schema** (backend/prisma/schema.prisma)
```prisma
model IntakeSubmission {
  id            String   @id @default(cuid())
  leadId        String
  lead          Lead     @relation(fields: [leadId], references: [id])
  formData      Json
  aiSummary     String?
  completionScore Int?
  suggestions   String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([leadId])
}

model Requirement {
  id            String   @id @default(cuid())
  title         String
  description   String?
  leadId        String
  lead          Lead     @relation(fields: [leadId], references: [id])
  features      String[]
  scope         Json?
  status        String   @default("draft")
  priority      String?
  dueDate       DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([leadId])
}
```

#### 3. **Run Migrations**
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

---

## 🎨 UI/UX Features

### Step-by-Step Breakdown

**Step 1: Client Info**
- Business name, industry, contact info
- Floating auto-save
- Real-time validation

**Step 2: Project Requirements**
- Project type selector
- Feature multi-select with AI suggestions
- Project description textarea
- Target audience input
- Smart Suggestions Box powered by Ollama

**Step 3: Budget & Timeline**
- Interactive budget slider
- Deadline picker with quick templates
- Priority selector (Low / Medium / Urgent)
- Real-time price update display

**Step 4: Package Selection**
- 3-tier pricing (Basic / Growth / Premium)
- Feature highlights per package
- "Recommended" badge on Growth

**Step 5: File Upload (Optional)**
- Drag & drop area
- File preview list
- Auto-deduplication

**Step 6: Meeting Scheduler**
- Pre-set meeting slots
- Terms agreement checkbox
- Submit button

### Sidebar Components

1. **Dynamic Pricing Engine**
   - Updates live as scope changes
   - Visual progress bar
   - Cost breakdown

2. **Smart Insights**
   - AI suggestions for missing features
   - Budget/timeline warnings
   - Scope optimization tips

3. **AI Analysis Box**
   - Completion score (0-100%)
   - Key insights
   - Risk assessment
   - Next steps

4. **Floating Contact Hub**
   - WhatsApp integration
   - Email link
   - Phone call button
   - Mobile-responsive inline version

---

## 💡 AI FEATURES EXPLAINED

### 1. **Smart Feature Suggestions** (Ollama)
```tsx
// Triggered when:
- User changes project type
- User types in description field

// Uses Ollama to:
- Analyze project context
- Suggest missing features
- Explain why features matter

// Fallback: Rule-based suggestions if Ollama unavailable
```

### 2. **Project Scope Analysis** (Ollama)
```tsx
// Analyzes:
- Completion score (0-100%)
- Key insights about the project
- Potential risks
- Recommended next steps

// Updates automatically as form changes
```

### 3. **Auto Summary Generation** (Ollama)
```tsx
// On form submission:
- Generates executive summary
- Lists key features
- Estimates timeline
- Confidence score

// Result shown in success screen & requirements page
```

---

## 🔌 API Endpoints

### Client Intake Submission
```
POST /api/client-intake/submit
Headers: Authorization: Bearer {token}
Body: ClientIntakeForm

Response:
{
  "success": true,
  "data": {
    "leadId": "lead_123",
    "requirementId": "req_456",
    "submissionId": "sub_789",
    "aiInsights": { ... }
  }
}
```

### Get Submission
```
GET /api/client-intake/submission/:submissionId
Response: IntakeSubmission details
```

### List Submissions
```
GET /api/client-intake/submissions?limit=20&offset=0
Response: Paginated submission list
```

### Analyze Submission
```
POST /api/client-intake/:submissionId/analyze
Response: Fresh AI analysis
```

---

## 🛠️ ENVIRONMENT VARIABLES

### Frontend (.env)
```env
# Ollama AI Configuration
VITE_OLLAMA_URL=http://localhost:11434

# API Configuration
VITE_API_URL=http://localhost:3001/api

# Optional: Feature flags
VITE_ENABLE_AI=true
VITE_OLLAMA_MODEL=mistral
```

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your_secret_key

# API
API_PORT=3001
API_URL=http://localhost:3001

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

---

## 🚀 DEPLOYMENT

### Development
```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
npm run start

# Ollama should run on server/container
# Consider using GPU for better performance
```

### Docker Option
```dockerfile
# Create docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - ollama

  frontend:
    build: .
    ports:
      - "5173:5173"
    environment:
      - VITE_OLLAMA_URL=http://localhost:11434
      - VITE_API_URL=http://localhost:3001/api

volumes:
  ollama:
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Ollama Tips
1. **Use Mistral for speed** (7B model = fast)
2. **Allocate GPU memory**: `OLLAMA_NUM_GPU=1`
3. **Cache responses** to avoid repeated calls
4. **Set reasonable timeouts** (3-5 seconds)

### Frontend Tips
1. **Debounce AI calls** (500ms for suggestions)
2. **Use React Query** for API caching
3. **Lazy load requirements page**
4. **Compress uploaded files**

### Backend Tips
1. **Queue AI analysis jobs** for bulk processing
2. **Cache feature library** in Redis
3. **Use database indexes** on lead lookups
4. **Implement rate limiting** per user

---

## 🧪 TESTING

### Manual Testing Checklist
- [ ] Fill form with valid data
- [ ] Verify Ollama suggestions appear
- [ ] Check dynamic price updates
- [ ] Upload and preview files
- [ ] Submit form
- [ ] Verify success screen
- [ ] Check requirements page loads
- [ ] Confirm AI summary generated
- [ ] Test contact hub links
- [ ] Verify auto-save works

### Test Data
```tsx
const testIntake = {
  businessName: "TechStartup Inc",
  industry: "SaaS",
  contactName: "John Doe",
  email: "john@techstartup.com",
  phone: "+91 98765 43210",
  companySize: "20-50",
  projectType: "App",
  features: ["Login/Auth", "Payment", "Dashboard"],
  ideaDescription: "A mobile app for fitness tracking with AI coaching",
  targetAudience: "Fitness enthusiasts aged 18-45",
  budget: 250000,
  deadline: "2024-06-30T11:00",
  priority: "urgent",
  selectedPackage: "growth",
  meetingSlot: "Wed 05:00 PM",
  termsAccepted: true,
};
```

---

## 🐛 TROUBLESHOOTING

### Ollama Not Connecting
```bash
# Check if running
curl http://localhost:11434/api/tags

# Check logs
ollama logs

#Start fresh
ollama serve
```

### Model Not Found
```bash
# List available models
ollama list

# Pull required model
ollama pull mistral
```

### AI Features Not Working
- Check `VITE_OLLAMA_URL` environment variable
- Verify Ollama service is running
- Check browser console for API errors
- System falls back to rule-based suggestions

### Database Errors
```bash
# Reset migrations
npm run prisma:migrate reset

# Check connection string
echo $DATABASE_URL
```

---

## 📈 NEXT STEPS & ENHANCEMENTS

### Immediate
1. ✅ Wire up real API endpoints
2. ✅ Connect to actual database
3. ✅ Test with real Ollama instance
4. ⚠️ Add error handling & logging

### Short-term
- [ ] Email notifications on submission
- [ ] Proposal PDF generation
- [ ] Client portal for requirements review
- [ ] Slack integration for notifications
- [ ] SMS integration for reminders

### Long-term
- [ ] Custom AI model fine-tuning
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Video call integration (Zoom/Google Meet)
- [ ] Document collaboration (Figma/Notion embed)

---

## 📞 SUPPORT & RESOURCES

**Ollama Documentation**: https://ollama.ai/library  
**React + TypeScript**: https://react.dev  
**Tailwind CSS**: https://tailwindcss.com  
**ShadCN/UI**: https://ui.shadcn.com  
**Prisma ORM**: https://www.prisma.io/docs  

---

**Built with ❤️ for Unifies Business**  
Premium, production-ready client intake system.
