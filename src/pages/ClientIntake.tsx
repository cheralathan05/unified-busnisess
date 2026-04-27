import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  FileUp,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getClientAccessById } from "@/lib/collaboration-store";
import { getLeadById } from "@/lib/lead-store";
import { checkOllamaHealth } from "@/lib/ai-ollama-service";
import {
  getClientLinkByToken,
  submitIntakeToBackend,
  type ClientLinkRecord,
} from "@/lib/client-intake-api";
import {
  clearClientIntakeDraft,
  getClientIntakeDraft,
  saveClientIntakeDraft,
  submitClientIntake,
  normalizeClientIntakeFiles,
  type ClientIntakeForm,
  type IntakePackage,
  type IntakePriority,
} from "@/lib/client-intake-store";

const steps = [
  "Client Info",
  "Project Requirements",
  "Budget & Timeline",
  "Package Selection",
  "File Upload",
  "Meeting & Agreement",
];

const stepInfo = [
  { label: "Client Information", tip: "Use your official business details for better proposal accuracy." },
  { label: "Project Requirements", tip: "Be specific here so the proposal and AI estimate stay accurate." },
  { label: "Budget & Timeline", tip: "A realistic budget helps us recommend the right delivery plan." },
  { label: "Package Selection", tip: "Pick the package that matches the speed and support you need." },
  { label: "File Upload", tip: "Upload references early so design and delivery stay aligned." },
  { label: "Meeting & Agreement", tip: "This confirms kickoff details and locks the next step." },
];

const projectTypes: ClientIntakeForm["projectType"][] = ["Website", "App", "AI", "CRM", "Other"];
const industries = ["SaaS", "E-commerce", "Healthcare", "Finance", "Education", "Real Estate", "Agency", "Other"];
const featureLibrary = [
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

const packageMatrix: Record<IntakePackage, { price: number; title: string; subtitle: string; features: string[] }> = {
  basic: {
    price: 35000,
    title: "Basic",
    subtitle: "Launch-ready fundamentals",
    features: ["Discovery workshop", "Core UI/UX", "QA smoke pass", "Standard support"],
  },
  growth: {
    price: 120000,
    title: "Growth",
    subtitle: "Conversion and scale focus",
    features: ["Advanced UX", "Automation flows", "Analytics instrumentation", "Priority support"],
  },
  premium: {
    price: 260000,
    title: "Premium",
    subtitle: "Elite product + AI acceleration",
    features: ["AI strategy sprint", "Executive dashboards", "Performance optimization", "Dedicated pod"],
  },
};

const meetingSlots = [
  "Mon 10:00 AM",
  "Mon 03:30 PM",
  "Tue 11:30 AM",
  "Wed 05:00 PM",
  "Thu 01:00 PM",
  "Fri 06:00 PM",
];

const defaultForm: ClientIntakeForm = {
  businessName: "",
  industry: "",
  contactName: "",
  email: "",
  phone: "",
  companySize: "",
  projectType: "Website",
  features: [],
  ideaDescription: "",
  targetAudience: "",
  budget: 100000,
  deadline: "",
  priority: "medium",
  selectedPackage: "growth",
  uploadedFiles: [],
  meetingSlot: "",
  termsAccepted: false,
  estimatedPrice: 120000,
  suggestionNotes: [],
};

const stepPurpose: Record<number, string> = {
  1: "Helps us personalize your proposal with the right business context.",
  2: "Defines core scope so we can generate an accurate execution plan.",
  3: "Aligns delivery speed and investment with realistic milestones.",
  4: "Matches your scope with the right delivery model and support level.",
  5: "Reference files reduce rework and improve design-dev alignment.",
  6: "Confirms kickoff details so we can generate your proposal instantly.",
};

const getProgressLabel = (currentStep: number, form: ClientIntakeForm) => {
  if (currentStep === 1) return "Basic info completed";
  if (currentStep === 2) return form.features.length ? "Requirements captured" : "Add at least one feature";
  if (currentStep === 3) return form.budget && form.deadline ? "Budget and timeline set" : "Set budget and timeline";
  if (currentStep === 4) return form.selectedPackage ? "Package selected" : "Choose a package";
  if (currentStep === 5) return form.uploadedFiles.length ? "Files uploaded" : "Add reference files";
  return form.meetingSlot && form.termsAccepted ? "Meeting and agreement ready" : "Finalize meeting and agreement";
};

const getProgressChecklist = (form: ClientIntakeForm) => [
  { label: "Client Info", done: Boolean(form.businessName && form.contactName && form.email) },
  { label: "Requirements", done: Boolean(form.projectType && form.ideaDescription && form.features.length) },
  { label: "Budget", done: Boolean(form.budget && form.deadline) },
  { label: "Files", done: Boolean(form.uploadedFiles.length) },
  { label: "Meeting", done: Boolean(form.meetingSlot) },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_REGEX = /^(?:\+?\d{1,3}[\s-]?)?\d{10}$/;
const CONTACT_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;
const BUSINESS_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s&.,'()/-]{1,79}$/;
const COMPANY_SIZE_REGEX = /^(?:\d{1,6}(?:\s*-\s*\d{1,6})?|\d{1,6}\+|[A-Za-z][A-Za-z0-9\s&-]{1,40})$/;
const TARGET_AUDIENCE_REGEX = /^(?=.*[A-Za-z])[A-Za-z0-9\s,&.'()/-]{3,120}$/;
const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "mistral";

type OllamaScopeAnalysis = {
  completionScore: number;
  insights: string[];
  risks: string[];
  recommendations: string[];
};

type OllamaGenerateResponse = {
  response?: string;
};

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const toDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDaysToDeadline = (deadline: string) => {
  if (!deadline) return 0;
  const date = new Date(deadline).getTime();
  if (Number.isNaN(date)) return 0;
  const now = Date.now();
  return Math.max(0, Math.ceil((date - now) / (1000 * 60 * 60 * 24)));
};

const isValidFutureDateTime = (value: string) => {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return false;
  return parsed > Date.now();
};

const runStrictOllamaPrompt = async (prompt: string, temperature = 0.5) => {
  const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with ${response.status}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  if (!data.response?.trim()) {
    throw new Error("Empty response from Ollama");
  }

  return data.response.trim();
};

const getStrictFeatureSuggestions = async (
  projectType: string,
  description: string,
  currentFeatures: string[],
) => {
  const prompt = `You are a product strategy expert.
Project type: ${projectType}
Description: ${description || "No description yet"}
Current selected features: ${currentFeatures.join(", ") || "None"}

Return plain text only with this format:
Reasoning: one short paragraph
Suggestions:
- item 1
- item 2
- item 3

Rules:
- Suggest 2 to 4 features not already selected
- Keep suggestions practical for delivery
- Do not use markdown tables or JSON`;

  const raw = await runStrictOllamaPrompt(prompt, 0.6);
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const reasoningLine = lines.find((line) => /^reasoning:/i.test(line)) ?? "";
  const suggestionLines = lines.filter((line) => /^[-*]\s+/.test(line)).map((line) => line.replace(/^[-*]\s+/, "")).filter((item) => !currentFeatures.includes(item)).slice(0, 4);

  return {
    suggestions: suggestionLines,
    reasoning: reasoningLine.replace(/^reasoning:\s*/i, ""),
    raw,
  };
};

const getStrictScopeAnalysis = async (
  projectType: string,
  features: string[],
  budget: number,
  deadline: string,
  description: string,
) => {
  const daysToDeadline = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const prompt = `You are a project delivery analyst.
Project type: ${projectType}
Features: ${features.join(", ") || "None"}
Budget INR: ${budget}
Days to deadline: ${daysToDeadline}
Description: ${description || "Not provided"}

Return plain text only with this format:
CompletionScore: number from 0 to 100
Insights:
- insight 1
- insight 2
Risks:
- risk 1
Recommendations:
- recommendation 1

Rules:
- Keep it concise
- Do not use JSON or markdown code fences`;

  const raw = await runStrictOllamaPrompt(prompt, 0.5);
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const scoreLine = lines.find((line) => /^completionscore:/i.test(line)) ?? "CompletionScore: 60";
  const parsedScore = Number(scoreLine.replace(/^[^:]+:\s*/i, ""));
  const insightStart = lines.findIndex((line) => /^insights:/i.test(line));
  const riskStart = lines.findIndex((line) => /^risks:/i.test(line));
  const recommendationStart = lines.findIndex((line) => /^recommendations:/i.test(line));

  const sectionItems = (start: number, end: number) =>
    lines
      .slice(start + 1, end === -1 ? undefined : end)
      .map((line) => line.replace(/^[-*]\s+/, ""))
      .filter(Boolean)
      .slice(0, 3);

  return {
    completionScore: Number.isFinite(parsedScore) ? Math.min(100, Math.max(0, parsedScore)) : 60,
    insights: insightStart >= 0 ? sectionItems(insightStart, riskStart) : [],
    risks: riskStart >= 0 ? sectionItems(riskStart, recommendationStart) : [],
    recommendations: recommendationStart >= 0 ? sectionItems(recommendationStart, -1) : [],
    raw,
  };
};

const getStrictProjectSummary = async (form: ClientIntakeForm, dynamicPrice: number) => {
  const prompt = `Write a concise executive summary (2 to 3 sentences).\nBusiness: ${form.businessName}\nProject Type: ${form.projectType}\nPackage: ${form.selectedPackage}\nBudget INR: ${form.budget}\nEstimated Cost INR: ${dynamicPrice}\nPriority: ${form.priority}\nTarget Audience: ${form.targetAudience}\nFeatures: ${form.features.join(", ") || "None"}\nDescription: ${form.ideaDescription}\n\nDo not use markdown or bullets.`;
  return runStrictOllamaPrompt(prompt, 0.6);
};

export default function ClientIntake() {
  const { accessId = "" } = useParams();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [highestUnlockedStep, setHighestUnlockedStep] = useState(1);
  const [form, setForm] = useState<ClientIntakeForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [linkRecord, setLinkRecord] = useState<ClientLinkRecord | null>(null);
  const [linkError, setLinkError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitWarning, setSubmitWarning] = useState("");
  const [checkingLink, setCheckingLink] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved">("saved");
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<OllamaScopeAnalysis | null>(null);
  const [aiPanelStatus, setAiPanelStatus] = useState("Checking Ollama connection...");
  const [aiRawResponse, setAiRawResponse] = useState("");

  const tokenFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token")?.trim() || "";
  }, [location.search]);

  const intakeToken = tokenFromQuery || accessId;

  const access = useMemo(() => getClientAccessById(accessId), [accessId]);
  const lead = useMemo(() => (access ? getLeadById(access.leadId) : undefined), [access]);

  useEffect(() => {
    let cancelled = false;

    const loadLink = async () => {
      if (!intakeToken) return;
      setCheckingLink(true);

      try {
        const record = await getClientLinkByToken(intakeToken);
        if (cancelled) return;
        setLinkRecord(record);
        setLinkError("");

        setForm((prev) => ({
          ...prev,
          email: prev.email || record.email || "",
        }));
      } catch {
        if (cancelled) return;
        setLinkError("This intake link is invalid or expired.");
      } finally {
        if (!cancelled) {
          setCheckingLink(false);
        }
      }
    };

    void loadLink();

    return () => {
      cancelled = true;
    };
  }, [intakeToken]);

  useEffect(() => {
    if (!accessId) return;
    const draft = getClientIntakeDraft(accessId);
    if (draft) {
      setForm(draft);
      return;
    }

    if (lead) {
      setForm((prev) => ({
        ...prev,
        businessName: lead.company,
        contactName: lead.name,
        email: lead.email,
        phone: lead.phone,
      }));
    }
  }, [accessId, lead]);

  useEffect(() => {
    const loadOllamaHealth = async () => {
      const available = await checkOllamaHealth();
      setOllamaAvailable(available);
      setAiPanelStatus(available ? "Ollama connected" : "Ollama offline. Start Ollama to enable live AI insights.");
    };

    void loadOllamaHealth();
  }, []);

  const dynamicPrice = useMemo(() => {
    const projectBase = {
      Website: 80000,
      App: 150000,
      AI: 260000,
      CRM: 180000,
      Other: 120000,
    }[form.projectType];

    const featureCost = form.features.reduce((total, feature) => {
      const map: Record<string, number> = {
        "Login/Auth": 10000,
        Payment: 25000,
        Dashboard: 18000,
        "AI Assistant": 65000,
        Analytics: 14000,
        "Admin Panel": 22000,
        "API Integration": 30000,
        Notifications: 10000,
        "Landing Page": 12000,
        "Mobile Responsive": 16000,
        "CRM Modules": 50000,
      };
      return total + (map[feature] ?? 9000);
    }, 0);

    const packageBase = packageMatrix[form.selectedPackage].price;
    const priorityFactor: Record<IntakePriority, number> = {
      low: 0.95,
      medium: 1,
      urgent: 1.2,
    };

    const days = getDaysToDeadline(form.deadline);
    const deadlineFactor = days > 0 && days < 21 ? 1.22 : days > 0 && days < 45 ? 1.08 : 1;

    const total = Math.round((projectBase + featureCost + packageBase) * priorityFactor[form.priority] * deadlineFactor);
    return Math.max(total, form.budget);
  }, [form.projectType, form.features, form.selectedPackage, form.priority, form.deadline, form.budget]);

  useEffect(() => {
    if (!accessId) return;
    setForm((prev) => ({
      ...prev,
      estimatedPrice: dynamicPrice,
      suggestionNotes: aiSuggestions,
    }));
  }, [dynamicPrice, aiSuggestions, accessId]);

  useEffect(() => {
    if (!ollamaAvailable || !form.projectType) {
      if (!ollamaAvailable) {
        setAiSuggestions([]);
        setAiReasoning("");
      }
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        setAiPanelStatus("Generating feature suggestions from Ollama...");
        const result = await getStrictFeatureSuggestions(form.projectType, form.ideaDescription, form.features);
        if (cancelled) return;
        setAiSuggestions(result.suggestions);
        setAiReasoning(result.reasoning);
        setAiRawResponse(result.raw);
        setAiPanelStatus("Ollama connected");
      } catch {
        if (cancelled) return;
        setAiSuggestions([]);
        setAiReasoning("");
        setAiRawResponse("");
        setAiPanelStatus("Ollama response not usable yet. Try a clearer project description.");
      }
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [ollamaAvailable, form.projectType, form.ideaDescription, form.features]);

  useEffect(() => {
    if (!ollamaAvailable || !form.projectType || !form.features.length) {
      if (!ollamaAvailable) {
        setAiAnalysis(null);
      }
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        setAiPanelStatus("Analyzing project scope with Ollama...");
        const result = await getStrictScopeAnalysis(
          form.projectType,
          form.features,
          form.budget,
          form.deadline,
          form.ideaDescription,
        );
        if (cancelled) return;
        setAiAnalysis(result);
        setAiRawResponse(result.raw);
        setAiPanelStatus("Ollama connected");
      } catch {
        if (cancelled) return;
        setAiAnalysis(null);
        setAiPanelStatus("Live AI analysis not usable yet. Add a few more project details.");
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [ollamaAvailable, form.projectType, form.features, form.budget, form.deadline, form.ideaDescription]);

  useEffect(() => {
    if (!accessId || !access) return;
    const timeout = window.setTimeout(() => {
      const withPrice = { ...form, estimatedPrice: dynamicPrice };
      window.localStorage.setItem(`ai-project-os.client-intake-active-step.${accessId}`, String(currentStep));
      saveClientIntakeDraft(accessId, withPrice);
      setSaveStatus("saved");
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [accessId, access, form, dynamicPrice, currentStep]);

  const setField = <K extends keyof ClientIntakeForm>(key: K, value: ClientIntakeForm[K]) => {
    setSaveStatus("saving");
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const toggleFeature = (feature: string) => {
    const next = form.features.includes(feature)
      ? form.features.filter((item) => item !== feature)
      : [...form.features, feature];
    setField("features", next);
  };

  const addFiles = async (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const normalized = await normalizeClientIntakeFiles(incoming);

    const merged = [...form.uploadedFiles, ...normalized].filter(
      (file, index, arr) => arr.findIndex((item) => item.name === file.name && item.size === file.size) === index,
    );
    setField("uploadedFiles", merged);
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};
    const businessName = form.businessName.trim();
    const contactName = form.contactName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const companySize = form.companySize.trim();
    const ideaDescription = form.ideaDescription.trim();
    const targetAudience = form.targetAudience.trim();

    if (step === 1) {
      if (!businessName) nextErrors.businessName = "Business name is required";
      else if (!BUSINESS_NAME_REGEX.test(businessName)) {
        nextErrors.businessName = "Enter a valid business name (2-80 chars)";
      }

      if (!form.industry.trim()) nextErrors.industry = "Select an industry";

      if (!contactName) nextErrors.contactName = "Contact name is required";
      else if (!CONTACT_NAME_REGEX.test(contactName)) {
        nextErrors.contactName = "Enter a valid contact name";
      }

      if (!email) nextErrors.email = "Email is required";
      else if (!EMAIL_REGEX.test(email)) {
        nextErrors.email = "Enter a valid email address";
      }

      if (!phone) nextErrors.phone = "Phone is required";
      else if (!PHONE_REGEX.test(phone.replace(/[()]/g, ""))) {
        nextErrors.phone = "Enter a valid phone number";
      }

      if (!companySize) nextErrors.companySize = "Company size is required";
      else if (!COMPANY_SIZE_REGEX.test(companySize)) {
        nextErrors.companySize = "Use format like 50-200, 200+, or Small team";
      }
    }

    if (step === 2) {
      if (!form.projectType) nextErrors.projectType = "Project type is required";
      if (!form.features.length) nextErrors.features = "Select at least one feature";
      if (!ideaDescription) nextErrors.ideaDescription = "Describe your idea";
      else if (ideaDescription.length < 20) {
        nextErrors.ideaDescription = "Idea description should be at least 20 characters";
      }

      if (!targetAudience) nextErrors.targetAudience = "Target audience is required";
      else if (!TARGET_AUDIENCE_REGEX.test(targetAudience)) {
        nextErrors.targetAudience = "Enter a valid target audience";
      }
    }

    if (step === 3) {
      if (!form.deadline || !isValidFutureDateTime(form.deadline)) {
        nextErrors.deadline = "Select a future deadline";
      }
      if (!form.priority) nextErrors.priority = "Select priority";
      if (!Number.isFinite(form.budget) || form.budget < 1000) {
        nextErrors.budget = "Budget should be at least INR 1,000";
      }
    }

    if (step === 6) {
      if (!form.meetingSlot) nextErrors.meetingSlot = "Select a meeting slot";
      if (!form.termsAccepted) nextErrors.termsAccepted = "You must agree before submitting";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onNext = () => {
    if (!validateStep(currentStep)) return;
    const nextStep = Math.min(6, currentStep + 1);
    setCurrentStep(nextStep);
    setHighestUnlockedStep((prev) => Math.max(prev, nextStep));
    setSaveStatus("saving");
  };

  const onBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
    setSaveStatus("saving");
  };

  const onSubmit = async () => {
    if (!validateStep(6) || !accessId) return;
    if (!ollamaAvailable) {
      setSubmitWarning("Ollama is offline right now. Submitting without a fresh AI summary.");
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitWarning("");

    let summary = aiRawResponse.trim();
    try {
      if (!summary) {
        summary = await getStrictProjectSummary({ ...form, estimatedPrice: dynamicPrice }, dynamicPrice);
      }
    } catch {
      summary = summary || `${form.businessName || "This project"} is a ${form.projectType} initiative for ${form.targetAudience || "the intended audience"}.`;
      setSubmitWarning("AI summary could not be refreshed, so the latest available text was used.");
    }

    try {
      await submitIntakeToBackend({
        ...form,
        estimatedPrice: dynamicPrice,
        suggestionNotes: aiSuggestions,
        token: intakeToken || undefined,
        leadId: linkRecord?.leadId || access?.leadId || accessId,
      });
    } catch {
      setSubmitWarning("Submitted successfully. Cloud sync is delayed and will retry shortly.");
    }

    await new Promise((resolve) => window.setTimeout(resolve, 800));

    try {
      submitClientIntake(accessId, { ...form, estimatedPrice: dynamicPrice, suggestionNotes: aiSuggestions }, summary);
      setAiSummary(summary);
      setIsSubmitting(false);
      setIsSubmitted(true);
      clearClientIntakeDraft(accessId);
    } catch {
      setSubmitError("Unable to submit at the moment. Please retry in a few seconds.");
      setIsSubmitting(false);
    }
  };

  if (!access && !linkRecord && checkingLink) {
    return (
      <div className="min-h-screen bg-[#040712] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h1 className="text-2xl font-semibold">Validating Secure Link...</h1>
          <p className="mt-3 text-sm text-white/70">Please wait while we verify your intake token.</p>
        </div>
      </div>
    );
  }

  if (!access && !linkRecord && !checkingLink) {
    return (
      <div className="min-h-screen bg-[#040712] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h1 className="text-2xl font-semibold">Invalid Client Link</h1>
          <p className="mt-3 text-sm text-white/70">{linkError || "This intake URL is no longer active. Please request a fresh link from your project team."}</p>
        </div>
      </div>
    );
  }

  if (submitError) {
    return (
      <div className="min-h-screen bg-[#040712] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-3xl border border-rose-300/30 bg-rose-500/10 p-8 text-center backdrop-blur-xl">
          <h1 className="text-2xl font-semibold">Submission Failed</h1>
          <p className="mt-3 text-sm text-white/80">{submitError}</p>
          <button
            type="button"
            onClick={() => setSubmitError("")}
            className="mt-5 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030814] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(62,134,255,0.25),transparent_44%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.2),transparent_40%)]" />
        <div className="relative flex min-h-screen items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
          >
            <div className="mx-auto mb-5 h-14 w-14 rounded-full border border-cyan-300/40 p-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: "linear" }}
                className="h-full w-full rounded-full border-2 border-transparent border-t-cyan-300"
              />
            </div>
            <h2 className="text-2xl font-semibold">Generating your cinematic proposal brief</h2>
            <p className="mt-2 text-sm text-white/70">Analyzing scope, delivery velocity, and pricing confidence...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const confidence = Math.min(98, 68 + form.features.length * 3 + (form.priority === "urgent" ? 8 : 0));
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020611] text-white p-6 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.24),transparent_42%)]" />
        <div className="relative mx-auto max-w-6xl space-y-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Intake Submitted Successfully
                </p>
                <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Your project blueprint is ready</h1>
                <p className="mt-2 max-w-3xl text-white/70">Your details are now synced to our requirements engine. A strategy specialist will share your custom proposal after your selected meeting slot.</p>
                {submitWarning ? <p className="mt-3 text-xs text-amber-200">{submitWarning}</p> : null}
              </div>
              <div className="rounded-2xl border border-cyan-200/30 bg-cyan-200/10 px-4 py-3 text-sm">
                AI Confidence: <span className="font-semibold text-cyan-200">{confidence}%</span>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><WandSparkles className="h-5 w-5 text-cyan-300" /> AI Generated Summary</h2>
              <p className="text-sm leading-7 text-white/75">{aiSummary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/60">Estimated Engagement</p>
                  <p className="mt-1 text-2xl font-semibold">{formatInr(form.estimatedPrice)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/60">Selected Package</p>
                  <p className="mt-1 text-2xl font-semibold">{packageMatrix[form.selectedPackage].title}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl space-y-4">
              <h3 className="text-lg font-semibold">Visual Breakdown</h3>
              {["Scope", "Speed", "Risk", "Conversion"].map((item, index) => {
                const widths = [88, 76, 63, 91];
                return (
                  <div key={item}>
                    <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                      <span>{item}</span>
                      <span>{widths[index]}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widths[index]}%` }}
                        transition={{ delay: 0.35 + index * 0.12, duration: 0.7 }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                Next step: attend your selected discovery session at <span className="text-white">{form.meetingSlot}</span>.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentStep / steps.length) * 100);
  const currentStepMeta = stepInfo[currentStep - 1] ?? stepInfo[0];
  const progressLabel = getProgressLabel(currentStep, form);
  const progressChecklist = getProgressChecklist(form);
  const savedLabel = saveStatus === "saving" ? "Saving..." : "Saved just now ✓";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.16),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-2xl md:p-10"
        >
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" /> Premium Client Link
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">Tell us about your project - we'll build your plan instantly</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                This intake is built to collect only what is required for an accurate proposal. Once submitted, we generate scope, timeline, and cost guidance instantly.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/75">⏱ Takes 2-3 minutes</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/75">🔒 Your data is secure</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/75">🤖 AI-powered estimation</span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={() => setCurrentStep(1)} className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-6 text-slate-950 hover:opacity-90">
                  Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-white/60">Secure intake for {access.clientName}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Live AI Scope Engine</p>
              <div className="mt-4 space-y-3 text-sm text-white/75">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">Project Type: <span className="text-white">{form.projectType}</span></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">Selected Features: <span className="text-white">{Math.max(form.features.length, 1)}</span></div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">Dynamic Estimate: <span className="text-cyan-200">{formatInr(dynamicPrice)}</span></div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="mb-2 flex flex-col gap-1 text-xs text-white/70 md:flex-row md:items-center md:justify-between">
            <span className="font-medium text-white">Step {currentStep} of {steps.length} — {currentStepMeta.label}</span>
            <span>{savedLabel}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-white/65">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">⏱ Takes ~30 seconds</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">🔒 Your data is secure</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">💾 Auto-saved</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.45 }}
            />
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm text-white/85">Progress: <span className="font-semibold text-white">{progressLabel}</span></p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
              {progressChecklist.map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full border px-3 py-1 ${item.done ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-white/15 bg-white/5 text-white/60"}`}
                >
                  {item.done ? "✔" : "⬜"} {item.label}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-white/60">We use this information to generate your project plan and pricing.</p>
          <p className="mt-2 rounded-lg border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-xs text-cyan-100">Tip: {currentStepMeta.tip}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
            {steps.map((label, index) => (
              (() => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isLocked = stepNumber > highestUnlockedStep;

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={isLocked}
                    title={isLocked ? "Complete the current step first" : `Go to ${label}`}
                    onClick={() => {
                      if (isLocked) return;
                      setCurrentStep(stepNumber);
                    }}
                    className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                      isActive
                        ? "border-cyan-200/60 bg-cyan-200/15 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/60"
                    } ${isLocked ? "cursor-not-allowed opacity-45" : "hover:text-white"}`}
                  >
                    {stepNumber}. {label}
                  </button>
                );
              })()
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.7fr_0.75fr]">
          <motion.section
            key={currentStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl md:p-8"
          >
            <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <p className="text-sm font-semibold text-cyan-100">Step {currentStep}: {steps[currentStep - 1]}</p>
              <p className="mt-1 text-sm text-white/75">{stepPurpose[currentStep]}</p>
            </div>
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 1: Client Info</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Input value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} placeholder="Business Name" className="h-11 border-white/10 bg-black/20" />
                      {errors.businessName ? <p className="mt-1 text-xs text-rose-300">{errors.businessName}</p> : null}
                    </div>
                    <div>
                      <Select value={form.industry} onValueChange={(value) => setField("industry", value)}>
                        <SelectTrigger className="h-11 border-white/10 bg-black/20"><SelectValue placeholder="Industry" /></SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => <SelectItem key={industry} value={industry}>{industry}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.industry ? <p className="mt-1 text-xs text-rose-300">{errors.industry}</p> : null}
                    </div>
                    <div>
                      <Input value={form.contactName} onChange={(e) => setField("contactName", e.target.value)} placeholder="Contact Name" className="h-11 border-white/10 bg-black/20" />
                      {errors.contactName ? <p className="mt-1 text-xs text-rose-300">{errors.contactName}</p> : null}
                    </div>
                    <div>
                      <Input value={form.companySize} onChange={(e) => setField("companySize", e.target.value)} placeholder="Company Size (e.g. 50-200)" className="h-11 border-white/10 bg-black/20" />
                      {errors.companySize ? <p className="mt-1 text-xs text-rose-300">{errors.companySize}</p> : null}
                    </div>
                    <div>
                      <Input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="Email" className="h-11 border-white/10 bg-black/20" />
                      {errors.email ? <p className="mt-1 text-xs text-rose-300">{errors.email}</p> : null}
                    </div>
                    <div>
                      <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="Phone" className="h-11 border-white/10 bg-black/20" />
                      {errors.phone ? <p className="mt-1 text-xs text-rose-300">{errors.phone}</p> : null}
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {currentStep === 2 ? (
                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 2: Project Requirements</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Select value={form.projectType} onValueChange={(value) => setField("projectType", value as ClientIntakeForm["projectType"])}>
                        <SelectTrigger className="h-11 border-white/10 bg-black/20"><SelectValue placeholder="Project Type" /></SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input value={form.targetAudience} onChange={(e) => setField("targetAudience", e.target.value)} placeholder="Target Audience" className="h-11 border-white/10 bg-black/20" />
                      {errors.targetAudience ? <p className="mt-1 text-xs text-rose-300">{errors.targetAudience}</p> : null}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-white/70">Features</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {featureLibrary.map((feature) => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            form.features.includes(feature)
                              ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                              : "border-white/10 bg-black/20 text-white/70 hover:text-white"
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                    {errors.features ? <p className="mt-1 text-xs text-rose-300">{errors.features}</p> : null}
                  </div>

                  <div>
                    <Textarea
                      value={form.ideaDescription}
                      onChange={(e) => setField("ideaDescription", e.target.value)}
                      placeholder="Describe your idea"
                      className="min-h-32 border-white/10 bg-black/20"
                    />
                    {errors.ideaDescription ? <p className="mt-1 text-xs text-rose-300">{errors.ideaDescription}</p> : null}
                  </div>
                </motion.div>
              ) : null}

              {currentStep === 3 ? (
                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <h2 className="text-2xl font-semibold">Step 3: Budget & Timeline</h2>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                      <span>Budget Range</span>
                      <span className="text-cyan-200">{formatInr(form.budget)}</span>
                    </div>
                    <Slider min={10000} max={1000000} step={10000} value={[form.budget]} onValueChange={(value) => setField("budget", value[0] ?? 10000)} />
                    <p className="mt-2 text-xs text-white/60">Range: INR 10K to INR 10L+</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="space-y-2">
                        <Input
                          type="datetime-local"
                          min={toDateTimeLocal(new Date())}
                          value={form.deadline}
                          onChange={(e) => setField("deadline", e.target.value)}
                          className="border-cyan-300/20 bg-black/20 text-white [color-scheme:dark]"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date();
                              target.setDate(target.getDate() + 7);
                              target.setHours(11, 0, 0, 0);
                              setField("deadline", toDateTimeLocal(target));
                            }}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/10"
                          >
                            +7 days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date();
                              target.setDate(target.getDate() + 14);
                              target.setHours(11, 0, 0, 0);
                              setField("deadline", toDateTimeLocal(target));
                            }}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/10"
                          >
                            +14 days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date();
                              target.setMonth(target.getMonth() + 1);
                              target.setHours(11, 0, 0, 0);
                              setField("deadline", toDateTimeLocal(target));
                            }}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/10"
                          >
                            +1 month
                          </button>
                        </div>
                      </div>
                      {errors.deadline ? <p className="mt-1 text-xs text-rose-300">{errors.deadline}</p> : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["low", "medium", "urgent"] as IntakePriority[]).map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setField("priority", priority)}
                          className={`rounded-xl border px-3 py-2 text-sm capitalize transition ${
                            form.priority === priority
                              ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                              : "border-white/10 bg-black/20 text-white/70"
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm">
                    <p className="text-white/70">Real-time estimate</p>
                    <p className="mt-1 text-2xl font-semibold text-cyan-100">{formatInr(dynamicPrice)}</p>
                  </div>
                </motion.div>
              ) : null}

              {currentStep === 4 ? (
                <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 4: Package Selection</h2>
                  <div className="grid gap-3 md:grid-cols-3">
                    {(Object.keys(packageMatrix) as IntakePackage[]).map((pkg) => (
                      <button
                        key={pkg}
                        type="button"
                        onClick={() => setField("selectedPackage", pkg)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          form.selectedPackage === pkg
                            ? "border-cyan-200/60 bg-cyan-300/10 shadow-[0_0_20px_rgba(56,189,248,0.22)]"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{packageMatrix[pkg].title}</h3>
                          {pkg === "growth" ? <span className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-2 py-0.5 text-[10px] text-emerald-200">Recommended</span> : null}
                        </div>
                        <p className="mt-1 text-xs text-white/60">{packageMatrix[pkg].subtitle}</p>
                        <p className="mt-4 text-xl font-semibold text-cyan-200">{formatInr(packageMatrix[pkg].price)}</p>
                        <div className="mt-3 space-y-1 text-xs text-white/70">
                          {packageMatrix[pkg].features.map((item) => (
                            <p key={item}>• {item}</p>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {currentStep === 5 ? (
                <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 5: File Upload</h2>
                  <label
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      void addFiles(event.dataTransfer.files);
                    }}
                    className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition ${
                      dragActive ? "border-cyan-300/70 bg-cyan-300/10" : "border-white/20 bg-black/20"
                    }`}
                  >
                    <FileUp className="mb-3 h-8 w-8 text-cyan-200" />
                    <p className="font-medium">Drag and drop logos, docs, and references</p>
                    <p className="mt-1 text-xs text-white/60">or click to select files</p>
                    <input type="file" multiple className="hidden" onChange={(e) => void addFiles(e.target.files)} />
                  </label>

                  <div className="space-y-2">
                    {form.uploadedFiles.map((file) => (
                      <div key={`${file.name}-${file.size}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                        {file.name} • {(file.size / 1024).toFixed(1)} KB
                      </div>
                    ))}
                    {!form.uploadedFiles.length ? <p className="text-sm text-white/60">No files added yet.</p> : null}
                  </div>
                </motion.div>
              ) : null}

              {currentStep === 6 ? (
                <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 6: Meeting Scheduler & Agreement</h2>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-white/70 mb-3">Select a discovery slot (Google Meet style)</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {meetingSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setField("meetingSlot", slot)}
                          className={`rounded-xl border px-3 py-2 text-sm transition ${
                            form.meetingSlot === slot
                              ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                              : "border-white/10 bg-white/5 text-white/70"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    {errors.meetingSlot ? <p className="mt-2 text-xs text-rose-300">{errors.meetingSlot}</p> : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium">Terms & Agreement</p>
                    <ul className="mt-2 space-y-1 text-xs text-white/65">
                      <li>• 50% kickoff payment secures your production slot.</li>
                      <li>• Timeline starts after requirement freeze and content availability.</li>
                      <li>• Two major revision rounds are included per milestone.</li>
                    </ul>
                    <label className="mt-3 flex items-center gap-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(event) => setField("termsAccepted", event.target.checked)}
                        className="h-4 w-4 rounded border-white/30 bg-black/40"
                      />
                      I agree to the above terms.
                    </label>
                    {errors.termsAccepted ? <p className="mt-2 text-xs text-rose-300">{errors.termsAccepted}</p> : null}
                  </div>

                  <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm text-white/85">
                    <p className="font-semibold text-emerald-200">You will receive instantly:</p>
                    <p className="mt-2">- Project plan</p>
                    <p>- Cost estimate</p>
                    <p>- Timeline</p>
                    <p className="mt-3 text-xs text-white/70">Sent to your email immediately after submission.</p>
                  </div>

                  <Button
                    onClick={onSubmit}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 py-6 text-base font-semibold text-slate-950"
                  >
                    Submit & Generate Proposal
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" onClick={onBack} disabled={currentStep === 1} className="border-white/20 bg-transparent text-white hover:bg-white/10">
                Back
              </Button>
              {currentStep < 6 ? (
                <Button onClick={onNext} className="bg-gradient-to-r from-cyan-300 to-sky-400 text-slate-950 hover:opacity-90">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </motion.section>

          <section className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <h3 className="text-lg font-semibold flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-cyan-300" /> AI Estimate</h3>
              <p className="mt-2 text-sm text-white/65">Live pricing + reasoning based on project type, features, timeline, and urgency.</p>
              <motion.p key={dynamicPrice} initial={{ opacity: 0.3, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-3xl font-semibold text-cyan-200">
                {formatInr(dynamicPrice)}
              </motion.p>
              <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                <p>Project Type: <span className="text-white">{form.projectType}</span></p>
                <p>Features: <span className="text-white">{form.features.length} selected</span></p>
                <p>AI Status: <span className="text-white">{aiPanelStatus}</span></p>
                <p>Brief Readiness: <span className="text-white">{aiAnalysis ? `${aiAnalysis.completionScore}%` : "Waiting for live analysis"}</span></p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.min(100, Math.round((dynamicPrice / 1000000) * 100))}%` }} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <h3 className="text-lg font-semibold flex items-center gap-2"><WandSparkles className="h-4 w-4 text-cyan-300" /> AI Insight</h3>
              {!ollamaAvailable ? (
                <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">
                  Ollama is offline. Start Ollama to enable live AI insight.
                </p>
              ) : (
                <>
                  {aiRawResponse ? (
                    <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80 whitespace-pre-line">{aiRawResponse}</p>
                  ) : null}
                  <div className="mt-3 space-y-2 text-sm text-white/80">
                    {aiAnalysis?.insights?.map((insight) => (
                      <p key={`insight-${insight}`} className="rounded-xl border border-white/10 bg-black/20 p-3">{insight}</p>
                    ))}
                    {aiAnalysis?.recommendations?.map((recommendation) => (
                      <p key={`recommendation-${recommendation}`} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">{recommendation}</p>
                    ))}
                    {aiAnalysis?.risks?.map((risk) => (
                      <p key={`risk-${risk}`} className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3">Risk: {risk}</p>
                    ))}
                    {!aiAnalysis && !aiSuggestions.length ? (
                      <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-white/70">Fill project details to generate live AI insight.</p>
                    ) : null}
                    {aiSuggestions.map((suggestion) => (
                      <p key={`suggestion-${suggestion}`} className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3">Suggested feature: {suggestion}</p>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 hidden md:block">
        <div className="rounded-2xl border border-white/15 bg-black/40 p-2 backdrop-blur-xl">
          <div className="grid gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent("Need help with the intake form")}`} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400/20 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/30">
              WhatsApp
            </a>
            <a href={`mailto:${access.email}`} className="rounded-xl bg-sky-400/20 px-3 py-2 text-xs text-sky-100 hover:bg-sky-400/30">
              Email
            </a>
            <a href={`tel:${lead?.phone || "+91 00000 00000"}`} className="rounded-xl bg-violet-400/20 px-3 py-2 text-xs text-violet-100 hover:bg-violet-400/30">
              Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
