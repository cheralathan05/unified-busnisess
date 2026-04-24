/**
 * PREMIUM CLIENT INTAKE PAGE - UNIFIES BUSINESS
 * Production-ready client intake form with real Ollama AI integration
 * Features:
 * - Multi-step intelligent form
 * - Real-time AI analysis
 * - Dynamic pricing engine
 * - Smart suggestions via Ollama
 * - Floating contact hub
 * - Auto-save & validation
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  FileUp,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  WandSparkles,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AIAnalysisBox, SmartSuggestions, CompletionMeter } from "@/components/AIAnalysisBox";
import { FloatingContactHub } from "@/components/FloatingContactHub";
import {
  checkOllamaHealth,
  suggestFeaturesForProject,
  analyzeProjectScope,
  generateProjectSummary,
} from "@/lib/ai-ollama-service";

const steps = [
  "Client Info",
  "Project Requirements",
  "Budget & Timeline",
  "Package Selection",
  "File Upload",
  "Meeting & Agreement",
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

const makeAiSummary = (form: ClientIntakeForm) => {
  const urgency =
    form.priority === "urgent" ? "high urgency" : form.priority === "medium" ? "balanced urgency" : "flexible timeline";
  return `${form.businessName} is planning a ${form.projectType} initiative for ${form.targetAudience || "their core audience"}. The project emphasizes ${form.features.join(", ") || "core platform capabilities"} with ${urgency}. Selected package is ${packageMatrix[form.selectedPackage].title}, target delivery ${form.deadline || "to be finalized"}, and estimated investment around ${formatInr(form.estimatedPrice)}.`;
};

export default function ClientIntakePremium() {
  const { accessId = "" } = useParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<ClientIntakeForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    completionScore: number;
    insights: string[];
    risks: string[];
    recommendations: string[];
  } | null>(null);

  // Check Ollama availability on mount
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const available = await checkOllamaHealth();
        setOllamaAvailable(available);
        console.log(available ? "✅ Ollama AI is ready!" : "⚠️ Ollama not available - using fallback AI");
      } catch (error) {
        console.log("Ollama check failed:", error);
      }
    };

    checkOllama();
  }, []);

  // Generate AI suggestions when project type changes
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!form.projectType || isLoadingSuggestions) return;

      setIsLoadingSuggestions(true);
      try {
        const result = await suggestFeaturesForProject(form.projectType, form.ideaDescription, form.features);
        setAiSuggestions(result.suggestions);
      } catch (error) {
        console.error("Error generating suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(generateSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [form.projectType, form.ideaDescription]);

  // Analyze project scope
  useEffect(() => {
    const analyzeScope = async () => {
      if (!form.projectType || !form.features.length) return;

      try {
        const analysis = await analyzeProjectScope(
          form.projectType,
          form.features,
          form.budget,
          form.deadline,
          form.ideaDescription
        );
        setAiAnalysis(analysis);
      } catch (error) {
        console.error("Error analyzing scope:", error);
      }
    };

    const debounce = setTimeout(analyzeScope, 800);
    return () => clearTimeout(debounce);
  }, [form.projectType, form.features, form.budget, form.deadline, form.ideaDescription]);

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
    const next = {
      ...form,
      estimatedPrice: dynamicPrice,
      suggestionNotes: aiSuggestions,
    };
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicPrice, aiSuggestions]);

  // Auto-save draft
  useEffect(() => {
    if (!accessId) return;
    const timeout = window.setTimeout(() => {
      const withPrice = { ...form, estimatedPrice: dynamicPrice };
      window.localStorage.setItem(`ai-project-os.client-intake-active-step.${accessId}`, String(currentStep));
      saveClientIntakeDraft(accessId, withPrice);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [accessId, form, dynamicPrice, currentStep]);

  const smartSuggestions = useMemo(() => {
    const notes: string[] = [];
    if (form.projectType === "AI" && !form.features.includes("AI Assistant")) {
      notes.push("🤖 AI projects typically benefit from an assistant or agent workflow.");
    }
    if (form.features.includes("Payment") && form.features.includes("Login/Auth")) {
      notes.push("💳 Auth + payments combo? Add Analytics for conversion visibility.");
    }
    if (form.priority === "urgent" && getDaysToDeadline(form.deadline) > 35) {
      notes.push("⏰ Priority is urgent but deadline is flexible. Should this be medium?");
    }
    if (dynamicPrice > form.budget * 1.2) {
      notes.push("📊 Current scope exceeds budget. Growth package can optimize delivery cost.");
    }
    if (!notes.length) {
      notes.push("✨ Scope looks balanced. You're on track for a high-clarity proposal.");
    }
    return notes;
  }, [form.projectType, form.features, form.priority, form.deadline, dynamicPrice, form.budget]);

  const setField = <K extends keyof ClientIntakeForm>(key: K, value: ClientIntakeForm[K]) => {
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
      (file, index, arr) => arr.findIndex((item) => item.name === file.name && item.size === file.size) === index
    );
    setField("uploadedFiles", merged);
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.businessName.trim()) nextErrors.businessName = "Business name is required";
      if (!form.industry.trim()) nextErrors.industry = "Select an industry";
      if (!form.contactName.trim()) nextErrors.contactName = "Contact name is required";
      if (!form.email.includes("@")) nextErrors.email = "Enter a valid email";
      if (!form.phone.trim()) nextErrors.phone = "Phone is required";
      if (!form.companySize.trim()) nextErrors.companySize = "Company size is required";
    }

    if (step === 2) {
      if (!form.projectType) nextErrors.projectType = "Project type is required";
      if (!form.features.length) nextErrors.features = "Select at least one feature";
      if (!form.ideaDescription.trim()) nextErrors.ideaDescription = "Describe your idea";
      if (!form.targetAudience.trim()) nextErrors.targetAudience = "Target audience is required";
    }

    if (step === 3) {
      if (!form.deadline || Number.isNaN(new Date(form.deadline).getTime())) {
        nextErrors.deadline = "Select a valid deadline";
      }
      if (!form.priority) nextErrors.priority = "Select priority";
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
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const onBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async () => {
    if (!validateStep(6) || !accessId) return;

    setIsSubmitting(true);
    const summary =
      aiSummary ||
      (await generateProjectSummary(
        form.businessName,
        form.projectType,
        form.features,
        form.targetAudience,
        form.budget,
        form.selectedPackage,
        form.priority,
        form.ideaDescription
      ));

    await new Promise((resolve) => window.setTimeout(resolve, 1300));

    const submission = submitClientIntake(accessId, { ...form, estimatedPrice: dynamicPrice, suggestionNotes: smartSuggestions }, summary);
    setAiSummary(summary);
    setIsSubmitting(false);
    setIsSubmitted(true);
    clearClientIntakeDraft(accessId);

    // Redirect to lead-scoped requirements page after 3 seconds
    setTimeout(() => {
      if (submission.leadId) {
        navigate(`/requirements?leadId=${submission.leadId}`);
        return;
      }
      navigate("/requirements");
    }, 3000);
  };

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
            <h2 className="text-2xl font-semibold">Generating Your AI Proposal</h2>
            <p className="mt-2 text-sm text-white/70">Analyzing scope, pricing, and timeline with advanced AI...</p>
            {ollamaAvailable && (
              <p className="mt-3 text-xs text-cyan-300 flex items-center justify-center gap-1">
                <span className="h-2 w-2 bg-cyan-300 rounded-full animate-pulse" /> Ollama AI is processing
              </p>
            )}
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
                <p className="mt-2 max-w-3xl text-white/70">Your intake details are synced to our requirements engine. Redirecting to your AI-analyzed project brief...</p>
              </div>
              <div className="rounded-2xl border border-cyan-200/30 bg-cyan-200/10 px-4 py-3 text-sm">
                AI Confidence: <span className="font-semibold text-cyan-200">{confidence}%</span>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <WandSparkles className="h-5 w-5 text-cyan-300" /> AI Generated Summary
              </h2>
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
              <h3 className="text-lg font-semibold">Analysis Metrics</h3>
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
                Next: Attend your discovery session at <span className="text-white">{form.meetingSlot}</span>.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030712] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.16),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
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
                <Sparkles className="h-3.5 w-3.5" /> {ollamaAvailable ? "✨ AI-Powered Intake" : "Premium Client Link"}
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">Let's Build Something Exceptional</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                Share your goals once. We transform your vision into an execution-ready plan, timeline, and proposal with {ollamaAvailable ? "real Ollama AI" : "AI-assisted"} precision
                .
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setCurrentStep(1)}
                  className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-6 text-slate-950 hover:opacity-90"
                >
                  Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {ollamaAvailable && (
                  <p className="text-xs text-cyan-300 flex items-center gap-1">
                    <span className="h-2 w-2 bg-cyan-300 rounded-full animate-pulse" /> Ollama AI Ready
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Live AI Scope Engine</p>
              <div className="mt-4 space-y-3 text-sm text-white/75">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                  <span>Project Type:</span>
                  <span className="text-white font-medium">{form.projectType}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                  <span>Selected Features:</span>
                  <span className="text-white font-medium">{Math.max(form.features.length, 1)}</span>
                </div>
                <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 flex items-center justify-between">
                  <span>Dynamic Estimate:</span>
                  <span className="text-cyan-200 font-semibold">{formatInr(dynamicPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Progress Bar */}
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>Progress</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.45 }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => setCurrentStep(index + 1)}
                className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                  currentStep === index + 1
                    ? "border-cyan-200/60 bg-cyan-200/15 text-cyan-100"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-7 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          {/* Form Section */}
          <motion.section
            key={currentStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl md:p-7"
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 1: Client Info</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Input
                        value={form.businessName}
                        onChange={(e) => setField("businessName", e.target.value)}
                        placeholder="Business Name"
                        className="border-white/10 bg-black/20"
                      />
                      {errors.businessName && <p className="mt-1 text-xs text-rose-300">{errors.businessName}</p>}
                    </div>
                    <div>
                      <Select value={form.industry} onValueChange={(value) => setField("industry", value)}>
                        <SelectTrigger className="border-white/10 bg-black/20">
                          <SelectValue placeholder="Industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && <p className="mt-1 text-xs text-rose-300">{errors.industry}</p>}
                    </div>
                    <div>
                      <Input
                        value={form.contactName}
                        onChange={(e) => setField("contactName", e.target.value)}
                        placeholder="Contact Name"
                        className="border-white/10 bg-black/20"
                      />
                      {errors.contactName && <p className="mt-1 text-xs text-rose-300">{errors.contactName}</p>}
                    </div>
                    <div>
                      <Input
                        value={form.companySize}
                        onChange={(e) => setField("companySize", e.target.value)}
                        placeholder="Company Size (e.g. 50-200)"
                        className="border-white/10 bg-black/20"
                      />
                      {errors.companySize && <p className="mt-1 text-xs text-rose-300">{errors.companySize}</p>}
                    </div>
                    <div>
                      <Input
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="Email"
                        className="border-white/10 bg-black/20"
                      />
                      {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
                    </div>
                    <div>
                      <Input
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="Phone"
                        className="border-white/10 bg-black/20"
                      />
                      {errors.phone && <p className="mt-1 text-xs text-rose-300">{errors.phone}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 2: Project Requirements</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Select value={form.projectType} onValueChange={(value) => setField("projectType", value as ClientIntakeForm["projectType"])}>
                        <SelectTrigger className="border-white/10 bg-black/20">
                          <SelectValue placeholder="Project Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        value={form.targetAudience}
                        onChange={(e) => setField("targetAudience", e.target.value)}
                        placeholder="Target Audience"
                        className="border-white/10 bg-black/20"
                      />
                      {errors.targetAudience && <p className="mt-1 text-xs text-rose-300">{errors.targetAudience}</p>}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-white/70 flex items-center justify-between">
                      <span>Features</span>
                      {isLoadingSuggestions && <span className="text-xs text-cyan-300 flex items-center gap-1"><Loader className="h-3 w-3 animate-spin" /> AI suggesting...</span>}
                    </p>
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
                    {errors.features && <p className="mt-1 text-xs text-rose-300">{errors.features}</p>}
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <SmartSuggestions
                      suggestions={aiSuggestions}
                      onAddFeature={(feature) => {
                        if (!form.features.includes(feature)) {
                          toggleFeature(feature);
                        }
                      }}
                      isLoading={isLoadingSuggestions}
                    />
                  )}

                  <div>
                    <Textarea
                      value={form.ideaDescription}
                      onChange={(e) => setField("ideaDescription", e.target.value)}
                      placeholder="Describe your idea in detail..."
                      className="min-h-32 border-white/10 bg-black/20"
                    />
                    {errors.ideaDescription && <p className="mt-1 text-xs text-rose-300">{errors.ideaDescription}</p>}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <h2 className="text-2xl font-semibold">Step 3: Budget & Timeline</h2>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                      <span>Budget Range</span>
                      <span className="text-cyan-200">{formatInr(form.budget)}</span>
                    </div>
                    <Slider
                      min={10000}
                      max={1000000}
                      step={10000}
                      value={[form.budget]}
                      onValueChange={(value) => setField("budget", value[0] ?? 10000)}
                    />
                    <p className="mt-2 text-xs text-white/60">Range: INR 10K to INR 10L+</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Input
                        type="datetime-local"
                        min={toDateTimeLocal(new Date())}
                        value={form.deadline}
                        onChange={(e) => setField("deadline", e.target.value)}
                        className="border-cyan-300/20 bg-black/20 text-white [color-scheme:dark]"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { label: "+7 days", days: 7 },
                          { label: "+14 days", days: 14 },
                          { label: "+1 month", days: 30 },
                        ].map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => {
                              const target = new Date();
                              target.setDate(target.getDate() + option.days);
                              target.setHours(11, 0, 0, 0);
                              setField("deadline", toDateTimeLocal(target));
                            }}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/10"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {errors.deadline && <p className="mt-1 text-xs text-rose-300">{errors.deadline}</p>}
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
              )}

              {currentStep === 4 && (
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
                          {pkg === "growth" && (
                            <span className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-2 py-0.5 text-[10px] text-emerald-200">
                              Recommended
                            </span>
                          )}
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
              )}

              {currentStep === 5 && (
                <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 5: File Upload (optional)</h2>
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
                    {!form.uploadedFiles.length && <p className="text-sm text-white/60">No files added. Files are optional.</p>}
                  </div>
                </motion.div>
              )}

              {currentStep === 6 && (
                <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <h2 className="text-2xl font-semibold">Step 6: Meeting & Agreement</h2>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-white/70 mb-3">Select a discovery consultation slot</p>
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
                    {errors.meetingSlot && <p className="mt-2 text-xs text-rose-300">{errors.meetingSlot}</p>}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium">Terms & Agreement</p>
                    <ul className="mt-2 space-y-1 text-xs text-white/65">
                      <li>• 50% kickoff payment secures your production slot.</li>
                      <li>• Timeline starts after requirement freeze and content availability.</li>
                      <li>• Two major revision rounds are included per milestone.</li>
                      <li>• Deliverables remain your property after payment completion.</li>
                    </ul>
                    <label className="mt-3 flex items-center gap-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(event) => setField("termsAccepted", event.target.checked)}
                        className="h-4 w-4 rounded border-white/30 bg-black/40"
                      />
                      I agree to the terms and conditions.
                    </label>
                    {errors.termsAccepted && <p className="mt-2 text-xs text-rose-300">{errors.termsAccepted}</p>}
                  </div>

                  <Button
                    onClick={onSubmit}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 py-6 text-base font-semibold text-slate-950 hover:opacity-90"
                  >
                    Submit & Generate Proposal
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={currentStep === 1}
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Back
              </Button>
              {currentStep < 6 && (
                <Button onClick={onNext} className="bg-gradient-to-r from-cyan-300 to-sky-400 text-slate-950 hover:opacity-90">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.section>

          {/* Sidebar */}
          <section className="space-y-6">
            {/* Dynamic Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-cyan-300" /> Dynamic Engine
              </h3>
              <p className="mt-2 text-sm text-white/65">Estimate updates live as you customize your scope.</p>
              <motion.p key={dynamicPrice} initial={{ opacity: 0.3, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-3xl font-semibold text-cyan-200">
                {formatInr(dynamicPrice)}
              </motion.p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  style={{ width: `${Math.min(100, Math.round((dynamicPrice / 1000000) * 100))}%` }}
                />
              </div>
            </motion.div>

            {/* Smart Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <WandSparkles className="h-4 w-4 text-cyan-300" /> Smart Insights
              </h3>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                {smartSuggestions.map((note) => (
                  <p key={note} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    {note}
                  </p>
                ))}
              </div>
            </motion.div>

            {/* AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              {aiAnalysis ? (
                <AIAnalysisBox
                  projectType={form.projectType}
                  features={form.features}
                  description={form.ideaDescription}
                  budget={form.budget}
                  deadline={form.deadline}
                  priority={form.priority}
                  isLoading={false}
                />
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
                  <p className="text-sm text-white/60">Add project details to unlock AI insights</p>
                </div>
              )}
            </motion.div>

            {/* Contact Hub */}
            <FloatingContactHub email={form.email || "contact@unifies.business"} businessName={form.businessName || "Unifies Business"} />
          </section>
        </div>

        {/* Portfolio & Testimonials */}
        <section className="mt-10 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl md:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Portfolio Showcase</h2>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              View Case Study
            </Button>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {[
                { title: "Neo Commerce", metric: "+41% conversion", tag: "E-commerce" },
                { title: "Pulse CRM", metric: "2.3x faster operations", tag: "CRM" },
                { title: "Atlas AI", metric: "78% support automation", tag: "AI" },
                { title: "FinEdge App", metric: "36% retention uplift", tag: "Mobile" },
              ].map((item) => (
                <motion.div key={item.title} whileHover={{ y: -6 }} className="w-[280px] rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-cyan-200">{item.tag}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.metric}</p>
                  <p className="mt-5 text-xs text-white/50">View Case Study</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-7 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h2 className="text-xl font-semibold">What Clients Say</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                "They transformed our rough brief into an enterprise-ready product plan in one week.",
                "The intake and proposal process felt premium, transparent, and deeply strategic.",
              ].map((quote, index) => (
                <motion.div
                  key={quote}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75"
                >
                  <div className="mb-2 flex text-amber-300">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
                  {quote}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h2 className="text-xl font-semibold">Trust & Results</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {["Nova", "SplineX", "Orbit", "Bento", "Quark", "Moneta"].map((logo) => (
                <div key={logo} className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-white/70">
                  {logo}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                <p className="text-lg font-semibold">120+</p>
                <p className="text-[11px] text-white/60">Projects Delivered</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                <p className="text-lg font-semibold">98%</p>
                <p className="text-[11px] text-white/60">Client Satisfaction</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                <p className="text-lg font-semibold">4.9/5</p>
                <p className="text-[11px] text-white/60">Average Rating</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
