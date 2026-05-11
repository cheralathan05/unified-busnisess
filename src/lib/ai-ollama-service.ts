/**
 * AI Ollama Integration Service
 * Connects to local Ollama instance for smart suggestions and analysis
 * Make sure Ollama is running: ollama serve (default: http://localhost:11434)
 */

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

interface StreamingOllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3:latest";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const OLLAMA_HEALTH_TIMEOUT_MS = 3000;
const OLLAMA_REQUEST_TIMEOUT_MS = 12000;

async function requestBackendAI<T>(path: string, payload?: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: payload ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { data?: T } | T;
    if (data && typeof data === "object" && "data" in (data as { data?: T })) {
      return (data as { data?: T }).data ?? null;
    }

    return data as T;
  } catch {
    return null;
  }
}

/**
 * Check if Ollama server is accessible
 */
export async function checkOllamaHealth(): Promise<boolean> {
  const backendHealth = await requestBackendAI<{ available?: boolean }>("/intake/ai/health");
  if (typeof backendHealth?.available === "boolean") {
    return backendHealth.available;
  }

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      signal: AbortSignal.timeout(OLLAMA_HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    console.warn("⚠️ Ollama not accessible at", OLLAMA_API_URL);
    return false;
  }
}

/**
 * Generate smart feature suggestions based on project type and description
 */
export async function suggestFeaturesForProject(
  projectType: string,
  description: string,
  currentFeatures: string[]
): Promise<{ suggestions: string[]; reasoning: string }> {
  const backendResult = await requestBackendAI<{ suggestions: string[]; reasoning: string }>("/intake/ai/suggest", {
    projectType,
    description,
    currentFeatures,
  });

  if (backendResult?.suggestions?.length || backendResult?.reasoning) {
    return {
      suggestions: Array.isArray(backendResult.suggestions) ? backendResult.suggestions.slice(0, 4) : [],
      reasoning: typeof backendResult.reasoning === "string" ? backendResult.reasoning : "Smart suggestions generated",
    };
  }

  const featurePool = [
    "Login/Auth",
    "Payment",
    "Dashboard",
    "AI Assistant",
    "Analytics",
    "Admin Panel",
    "API Integration",
    "Notifications",
    "Landing Page",
    "Mobile Responsive",
    "CRM Modules",
  ];

  const prompt = `You are a product strategy expert. Given a ${projectType} project with description: "${description}"

Current selected features: ${currentFeatures.length > 0 ? currentFeatures.join(", ") : "None yet"}

Available features to suggest from: ${featurePool.join(", ")}

Provide 2-4 highly relevant feature recommendations that this project would benefit from, but ARE NOT already selected.
Focus on features that add the most value for this specific use case.

Return ONLY a JSON object (no markdown, no code blocks):
{
  "suggestions": ["Feature1", "Feature2", "Feature3"],
  "reasoning": "Brief explanation why these features matter for this project type"
}`;

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(OLLAMA_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

    const data = (await response.json()) as OllamaResponse;
    
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((s: string) => !currentFeatures.includes(s)).slice(0, 4) : [],
          reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "Smart suggestions generated",
        };
      }
    } catch {
      // Fallback to rule-based suggestions
      return generateFallbackSuggestions(projectType, currentFeatures);
    }

    return generateFallbackSuggestions(projectType, currentFeatures);
  } catch (error) {
    console.error("Error getting feature suggestions:", error);
    return generateFallbackSuggestions(projectType, currentFeatures);
  }
}

/**
 * Analyze project scope and provide insights
 */
export async function analyzeProjectScope(
  projectType: string,
  features: string[],
  budget: number,
  deadline: string,
  description: string
): Promise<{
  completionScore: number;
  insights: string[];
  risks: string[];
  recommendations: string[];
}> {
  const backendResult = await requestBackendAI<{
    completionScore: number;
    insights: string[];
    risks: string[];
    recommendations: string[];
  }>("/intake/ai/analyze", {
    projectType,
    features,
    budget,
    deadline,
    description,
  });

  if (backendResult) {
    return {
      completionScore: Math.min(100, Math.max(0, Number(backendResult.completionScore ?? 0))),
      insights: Array.isArray(backendResult.insights) ? backendResult.insights.slice(0, 3) : [],
      risks: Array.isArray(backendResult.risks) ? backendResult.risks.slice(0, 2) : [],
      recommendations: Array.isArray(backendResult.recommendations) ? backendResult.recommendations.slice(0, 2) : [],
    };
  }

  const daysToDeadline = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const prompt = `You are a project delivery expert. Analyze this project:
- Type: ${projectType}
- Features: ${features.join(", ") || "None specified"}
- Budget: ₹${budget}
- Days to deadline: ${daysToDeadline}
- Description: ${description}

Provide a JSON analysis with:
1. completionScore (0-100): How complete is the project brief?
2. insights (2-3): Positive observations
3. risks (1-2): Potential challenges
4. recommendations (1-2): Next steps

Return ONLY valid JSON (no markdown):
{
  "completionScore": 0,
  "insights": ["insight1", "insight2"],
  "risks": ["risk1"],
  "recommendations": ["rec1"]
}`;

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(OLLAMA_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

    const data = (await response.json()) as OllamaResponse;
    
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          completionScore: Math.min(100, Math.max(0, typeof parsed.completionScore === "number" ? parsed.completionScore : 60)),
          insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 2) : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 2) : [],
        };
      }
    } catch {
      return generateFallbackAnalysis(projectType, features, budget, daysToDeadline);
    }

    return generateFallbackAnalysis(projectType, features, budget, daysToDeadline);
  } catch (error) {
    console.error("Error analyzing project scope:", error);
    return generateFallbackAnalysis(projectType, features, budget, daysToDeadline);
  }
}

/**
 * Generate AI summary of the project
 */
export async function generateProjectSummary(
  businessName: string,
  projectType: string,
  features: string[],
  targetAudience: string,
  budget: number,
  selectedPackage: string,
  priority: string,
  description: string
): Promise<string> {
  const backendResult = await requestBackendAI<{ summary: string }>("/intake/ai/summary", {
    businessName,
    projectType,
    features,
    targetAudience,
    budget,
    selectedPackage,
    priority,
    description,
  });

  if (typeof backendResult?.summary === "string" && backendResult.summary.trim()) {
    return backendResult.summary.trim();
  }

  const prompt = `Write a compelling, executive-level summary of this business development opportunity:

Business: ${businessName}
Project Type: ${projectType}
Package: ${selectedPackage}
Budget: ₹${budget}
Priority: ${priority}
Target Audience: ${targetAudience}
Key Features: ${features.join(", ")}
Description: ${description}

Create a 2-3 sentence professional summary that:
1. Captures the project's core value
2. Highlights the selected features strategically
3. Positions it as a high-impact engagement

Be concise, strategic, and compelling. No section headers or formatting.`;

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(OLLAMA_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        temperature: 0.6,
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

    const data = (await response.json()) as OllamaResponse;
    return data.response.trim() || generateFallbackSummary(businessName, projectType, features);
  } catch (error) {
    console.error("Error generating summary:", error);
    return generateFallbackSummary(businessName, projectType, features);
  }
}

/**
 * Generate project requirements from client intake
 */
export async function generateRequirementsDocument(
  businessName: string,
  projectType: string,
  features: string[],
  description: string,
  targetAudience: string,
  budget: number
): Promise<{
  overview: string;
  functionalRequirements: string[];
  technicalRequirements: string[];
  successCriteria: string[];
}> {
  const prompt = `Generate a technical requirements document for:
Business: ${businessName}
Type: ${projectType}
Features: ${features.join(", ")}
Description: ${description}
Target Users: ${targetAudience}
Budget: ₹${budget}

Provide JSON with:
- overview (1-2 sentences)
- functionalRequirements (3-5 items)
- technicalRequirements (2-3 items)
- successCriteria (2-3 measurable items)

Return ONLY JSON (no markdown):
{
  "overview": "string",
  "functionalRequirements": ["item1", "item2"],
  "technicalRequirements": ["item1"],
  "successCriteria": ["item1"]
}`;

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(OLLAMA_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

    const data = (await response.json()) as OllamaResponse;
    
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
  } catch (error) {
    console.error("Error generating requirements:", error);
  }

  return {
    overview: `${businessName} requires a ${projectType} with ${features.length} core capabilities to serve ${targetAudience} effectively.`,
    functionalRequirements: features.slice(0, 5),
    technicalRequirements: ["Responsive design", "API integration", "Scalable architecture"],
    successCriteria: ["On-time delivery", "Client satisfaction", "Performance standards"],
  };
}

/**
 * Stream AI response for real-time typing effect
 */
export async function streamAIAnalysis(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(OLLAMA_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: true,
        temperature: 0.6,
      }),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line) as StreamingOllamaResponse;
            onChunk(data.response);
          } catch {
            // Invalid JSON line, skip
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer) as StreamingOllamaResponse;
        onChunk(data.response);
      } catch {
        // Final buffer parsing
      }
    }
  } catch (error) {
    console.error("Error in stream analysis:", error);
  }
}

// ============= FALLBACK GENERATORS (Rule-based, no Ollama) =============

function generateFallbackSuggestions(
  projectType: string,
  currentFeatures: string[]
): { suggestions: string[]; reasoning: string } {
  const suggestions: Record<string, string[]> = {
    Website: ["Dashboard", "Admin Panel", "Analytics", "API Integration"],
    App: ["Login/Auth", "Mobile Responsive", "Notifications", "Analytics"],
    AI: ["AI Assistant", "API Integration", "Dashboard", "Analytics"],
    CRM: ["Login/Auth", "Dashboard", "Admin Panel", "API Integration"],
    Other: ["Login/Auth", "Dashboard", "Analytics", "Mobile Responsive"],
  };

  const recommended = (suggestions[projectType] || suggestions.Other).filter((f) => !currentFeatures.includes(f)).slice(0, 3);

  return {
    suggestions: recommended,
    reasoning: `These features are commonly recommended for ${projectType} projects to enhance functionality and user experience.`,
  };
}

function generateFallbackAnalysis(
  projectType: string,
  features: string[],
  budget: number,
  daysToDeadline: number
): {
  completionScore: number;
  insights: string[];
  risks: string[];
  recommendations: string[];
} {
  let score = 50;
  if (features.length > 0) score += 15;
  if (budget > 100000) score += 15;
  if (daysToDeadline > 30) score += 10;

  return {
    completionScore: Math.min(100, score),
    insights: [
      `Good foundation for a ${projectType} project`,
      `Budget allocation appears reasonable for selected scope`,
      features.length > 0 ? "Solid feature selection for core functionality" : "Feature selection will strengthen the proposal",
    ],
    risks: daysToDeadline < 21 ? ["Tight timeline may require expanded team"] : ["Standard timeline risks apply"],
    recommendations: ["Schedule discovery meeting to finalize requirements", "Prepare design mockups for review"],
  };
}

function generateFallbackSummary(businessName: string, projectType: string, features: string[]): string {
  const featureText = features.length > 0 ? ` featuring ${features.slice(0, 3).join(", ")}` : "";
  return `${businessName} is building a strategic ${projectType} initiative${featureText} to drive growth and user engagement. This comprehensive solution positions the business for market leadership through modern technology and user-centric design.`;
}

export default {
  checkOllamaHealth,
  suggestFeaturesForProject,
  analyzeProjectScope,
  generateProjectSummary,
  generateRequirementsDocument,
  streamAIAnalysis,
};
