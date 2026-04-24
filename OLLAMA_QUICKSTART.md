# ⚡ QUICK START: Ollama AI Integration for Client Intake

## 🚀 Get Started in 5 Minutes

### 1. Install Ollama (2 min)
```bash
# macOS / Linux / Windows
# Download: https://ollama.ai

# Verify installation
ollama --version
```

### 2. Start Ollama Service (1 min)
```bash
# In a terminal window, run:
ollama serve

# Output will show: "Listening on 127.0.0.1:11434"
```

### 3. Pull a Model (1 min)
```bash
# In another terminal:
ollama pull mistral

# For better quality (slower):
ollama pull llama2
```

### 4. Test Connection (30 sec)
```bash
curl http://localhost:11434/api/tags

# Should return JSON with available models
```

### 5. Set Environment Variable
Create `.env` in your frontend folder:
```env
VITE_OLLAMA_URL=http://localhost:11434
```

**Done! 🎉 Your Ollama AI is ready!**

---

## 🧠 What AI Features Are Now Active?

✅ **Smart Feature Suggestions** - AI suggests missing features  
✅ **Project Scope Analysis** - Completion score & insights  
✅ **Auto Summary** - Generates executive summaries  
✅ **Real-time Suggestions** - As you type descriptions  
✅ **Risk Detection** - Identifies project risks  

---

## 🎯 For Developers

### Check Ollama Status
```bash
# Is it running?
curl http://localhost:11434/api/tags

# Get models
ollama list

# Stop Ollama
# Press Ctrl+C in the terminal where it's running
```

### Test AI Directly
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "Suggest 3 features for a fitness app",
    "stream": false
  }'
```

### Available Models (Speed vs Quality)

| Model | Speed | Quality | Size | Notes |
|-------|-------|---------|------|-------|
| mistral | ⚡⚡⚡ | ⭐⭐⭐ | 7B | **Best for intake** - Fast & accurate |
| neural-chat | ⚡⚡ | ⭐⭐⭐ | 13B | Good balance |
| dolphin-mixtral | ⚡ | ⭐⭐⭐⭐ | 46B | Highest quality (slower) |
| llama2 | ⚡⚡ | ⭐⭐⭐⭐ | 13B | Very good general purpose |

---

## 🔧 Troubleshooting

### "Connection Refused" Error
```bash
# Make sure Ollama is running
ollama serve

# Double-check URL in .env
VITE_OLLAMA_URL=http://localhost:11434
```

### Model Not Found
```bash
# Pull the model
ollama pull mistral

# Verify it's there
ollama list
```

### Slow Responses
- Reduce model size: use `mistral` instead of `llama2`
- Check system resources: CPU, RAM, GPU
- Increase timeout in code (default: 3s)

### AI Features Not Working?
- Check console for errors
- Verify Ollama is running
- System will auto-fallback to rule-based suggestions

---

## 📝 Example Usage

### In Your Code
```tsx
import { suggestFeaturesForProject } from "@/lib/ai-ollama-service";

// Get suggestions
const result = await suggestFeaturesForProject(
  "Website",
  "E-commerce platform",
  ["Login/Auth", "Payment"]
);

console.log(result.suggestions);  // ["Dashboard", "Analytics", ...]
console.log(result.reasoning);    // "These features enhance..."
```

---

## 🚢 Production Deployment

### Option 1: Cloud GPU Provider
```bash
# RunPod, Lambda Labs, Replicate, etc.
# Ollama runs faster with GPU (100x+)
```

### Option 2: Docker
```bash
docker run -d -p 11434:11434 ollama/ollama
ollama pull mistral  # Pull model inside container
```

### Option 3: Dedicated Server
```bash
# AWS EC2 / DigitalOcean / Linode
# SSH in and: ollama serve
# Use systemd for auto-start

# Create /etc/systemd/system/ollama.service
[Unit]
Description=Ollama Service
After=network.target

[Service]
ExecStart=/usr/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target

# Enable it
sudo systemctl enable ollama
sudo systemctl start ollama
```

---

## 💡 Pro Tips

1. **Cold Start**: First query takes longer (model loading). Subsequent queries are fast.
2. **Memory**: Ollama caches models. More RAM = faster operation.
3. **GPU Support**: Enable with `OLLAMA_NUM_GPU=1` for 10-100x speedup.
4. **Production**: Use a reverse proxy (nginx) in front of Ollama.
5. **Fallback**: System automatically uses rule-based AI if Ollama unavailable.

---

## 📚 Next: Integration

1. Route setup: Route `/intake/:accessId` → `ClientIntakePremium`
2. Backend API: Implement `/api/client-intake/submit`
3. Database: Add Prisma models for submissions
4. Testing: Fill form with test data
5. Deploy: Move Ollama to production server

---

**Questions?** Check `CLIENT_INTAKE_SETUP.md` for detailed setup.  
**Ready?** Start Ollama and test the form! 🚀
