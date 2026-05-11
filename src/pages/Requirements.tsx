import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Layers,
  Lock,
  Pencil,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  SquareStack,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createProjectFromLead } from "@/lib/project-store";
import { getAuthSession } from "@/lib/auth-store";
import {
  getClientIntakeSubmissions,
  type ClientIntakeForm,
  type ClientIntakeSubmission,
  updateClientIntakeSubmission,
} from "@/lib/client-intake-store";
import { getLeads, type LeadRecord } from "@/lib/lead-store";
import {
  fetchBackendClientIntakeSubmissions,
  fetchLeadRequirementBundle,
  lockLeadRequirements,
  regenerateLeadRequirements,
  refineIntakeDescriptionWithAI,
  resendClientLink,
  unlockLeadRequirements,
  type RequirementBundle,
} from "@/lib/client-intake-api";
import { createOrGetClientAccessByLead, getClientIntakeLinkForLead } from "@/lib/collaboration-store";
import { toast } from "sonner";

type RequirementLifecycleStatus = "pending" | "submitted" | "verified" | "locked";

type SubmittedLeadEntry = {
  key: string;
  lead: LeadRecord;
  submission: ClientIntakeSubmission;
  hasLinkedLead: boolean;
};

type PipelineStage = {
  key: string;
  label: string;
  status: "done" | "in-progress" | "locked";
  progress: number;
};

type FeatureCategory = "Auth" | "Payment" | "AI" | "CRM";

type RefinementVersion = {
  id: string;
  label: string;
  editedAt: number;
  summary: string;
};

type RefinementVersionStore = Record<string, RefinementVersion[]>;

type RequirementLockValidation = {
  missing: string[];
  lockScore: number;
  readyToLock: boolean;
  completionPercent: number;
};

const REFINEMENT_VERSION_STORAGE_KEY = "ai-project-os.refinement-versions";

const FEATURE_LIBRARY: Record<FeatureCategory, string[]> = {
  Auth: ["Login/Auth", "Role-based Access", "SSO", "2FA"],
  Payment: ["Payment", "Subscriptions", "Invoicing", "Refund Flow"],
  AI: ["AI Assistant", "AI Recommendations", "Smart Search", "Summarization"],
  CRM: ["Lead Tracking", "CRM Modules", "Analytics", "Notifications"],
};

const ROLE_PRESETS = ["Admin", "Customer", "Vendor", "Staff"];
const MODULE_PRESETS = ["Home", "Dashboard", "Checkout", "Profile", "Settings", "Reports"];
const PROJECT_TYPE_OPTIONS: ClientIntakeForm["projectType"][] = ["Website", "App", "AI", "CRM", "Other"];
const PRIORITY_OPTIONS: ClientIntakeForm["priority"][] = ["low", "medium", "urgent"];
const PACKAGE_OPTIONS: ClientIntakeForm["selectedPackage"][] = ["basic", "growth", "premium"];
const COMPANY_SIZE_OPTIONS = ["1-5", "6-20", "21-50", "51-200", "200+"];

const DEFAULT_INTAKE_FORM: ClientIntakeForm = {
  businessName: "",
  industry: "",
  businessWebsite: "",
  country: "India",
  timezone: "Asia/Kolkata",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  preferredContactMethod: "Email",
  companySize: "",
  businessStage: "Startup",
  launchUrgency: "Flexible",
  projectType: "Website",
  goal: "",
  features: [],
  userRoles: [],
  modules: [],
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

const buildScopeSeedDescription = (form: Partial<ClientIntakeForm>) => {
  const businessName = String(form.businessName ?? "").trim() || "the client";
  const industry = String(form.industry ?? "").trim() || "their industry";
  const contactName = String(form.contactName ?? "").trim() || "the key contact";
  const projectType = String(form.projectType ?? DEFAULT_INTAKE_FORM.projectType).toLowerCase();
  const goal = String(form.goal ?? "").trim() || "business growth";
  const companySize = String(form.companySize ?? "").trim() || "unspecified team size";
  const targetAudience = String(form.targetAudience ?? "").trim() || "end users";
  const deadline = String(form.deadline ?? "").trim() || "the agreed launch window";
  const budget = Number.isFinite(form.budget) ? formatCurrency(Number(form.budget)) : "an agreed project budget";
  const priority = String(form.priority ?? DEFAULT_INTAKE_FORM.priority);
  const packageLabel = String(form.selectedPackage ?? DEFAULT_INTAKE_FORM.selectedPackage);
  const roles = Array.isArray(form.userRoles) && form.userRoles.length ? form.userRoles.slice(0, 4).join(", ") : "Admin, Customer";
  const modules = Array.isArray(form.modules) && form.modules.length ? form.modules.slice(0, 5).join(", ") : "Dashboard, Profile, Settings";
  const features = Array.isArray(form.features) && form.features.length ? form.features.slice(0, 6).join(", ") : "Login/Auth, Analytics, API Integration";

  return `Build a ${projectType} solution for ${businessName} in the ${industry} space, aligned with ${goal}. Key contact: ${contactName}. Company size: ${companySize}. Audience: ${targetAudience}. Priority: ${priority}. Package: ${packageLabel}. Budget: ${budget}. Deadline: ${deadline}. Primary users: ${roles}. Key pages: ${modules}. Core capabilities: ${features}. Include API contracts, milestones, launch plan, and measurable KPIs.`;
};

const normalizeIdeaDescription = (form: Partial<ClientIntakeForm>) => {
  const rawDescription = String(form.ideaDescription ?? "").trim();
  if (!rawDescription) return rawDescription;

  const looksStructured = rawDescription.startsWith("{") || rawDescription.startsWith("[");
  if (!looksStructured) return rawDescription;

  try {
    const parsed = JSON.parse(rawDescription) as Record<string, unknown>;
    const candidateFields = [parsed.description, parsed.summary, parsed.text, parsed.content, parsed.message];

    for (const candidate of candidateFields) {
      if (typeof candidate === "string") {
        const text = candidate.trim();
        if (text && !/^AI unavailable$/i.test(text)) {
          return text;
        }
      }
    }
  } catch {
    // Fall back to a generated scope paragraph below.
  }

  return buildScopeSeedDescription(form);
};

const normalizeIntakeForm = (input?: Partial<ClientIntakeForm> | null): ClientIntakeForm => {
  const form = input ?? {};
  return {
    ...DEFAULT_INTAKE_FORM,
    ...form,
    businessName: String(form.businessName ?? DEFAULT_INTAKE_FORM.businessName),
    industry: String(form.industry ?? DEFAULT_INTAKE_FORM.industry),
    contactName: String(form.contactName ?? DEFAULT_INTAKE_FORM.contactName),
    email: String(form.email ?? DEFAULT_INTAKE_FORM.email),
    phone: String(form.phone ?? DEFAULT_INTAKE_FORM.phone),
    companySize: String(form.companySize ?? DEFAULT_INTAKE_FORM.companySize),
    projectType: (form.projectType ?? DEFAULT_INTAKE_FORM.projectType) as ClientIntakeForm["projectType"],
    goal: String(form.goal ?? DEFAULT_INTAKE_FORM.goal),
    features: Array.isArray(form.features) ? form.features : [],
    userRoles: Array.isArray(form.userRoles) ? form.userRoles : [],
    modules: Array.isArray(form.modules) ? form.modules : [],
    ideaDescription: normalizeIdeaDescription(form),
    targetAudience: String(form.targetAudience ?? DEFAULT_INTAKE_FORM.targetAudience),
    budget: Number.isFinite(form.budget) ? Number(form.budget) : DEFAULT_INTAKE_FORM.budget,
    deadline: String(form.deadline ?? DEFAULT_INTAKE_FORM.deadline),
    priority: (form.priority ?? DEFAULT_INTAKE_FORM.priority) as ClientIntakeForm["priority"],
    selectedPackage: (form.selectedPackage ?? DEFAULT_INTAKE_FORM.selectedPackage) as ClientIntakeForm["selectedPackage"],
    uploadedFiles: Array.isArray(form.uploadedFiles) ? form.uploadedFiles : [],
    meetingSlot: String(form.meetingSlot ?? DEFAULT_INTAKE_FORM.meetingSlot),
    termsAccepted: Boolean(form.termsAccepted),
    estimatedPrice: Number.isFinite(form.estimatedPrice) ? Number(form.estimatedPrice) : DEFAULT_INTAKE_FORM.estimatedPrice,
    suggestionNotes: Array.isArray(form.suggestionNotes) ? form.suggestionNotes : [],
  };
};

const cloneForm = (form: Partial<ClientIntakeForm> | null | undefined): ClientIntakeForm => {
  return JSON.parse(JSON.stringify(normalizeIntakeForm(form))) as ClientIntakeForm;
};

const normalizeIntakeSubmission = (input: Partial<ClientIntakeSubmission> | null | undefined): ClientIntakeSubmission => {
  const submission = input ?? {};
  const fallbackId = `intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: String(submission.id ?? fallbackId),
    accessId: String(submission.accessId ?? "unknown-access"),
    leadId: typeof submission.leadId === "number" ? submission.leadId : undefined,
    leadName: String(submission.leadName ?? "Unknown lead"),
    submittedAt: Number.isFinite(submission.submittedAt) ? Number(submission.submittedAt) : Date.now(),
    aiSummary: String(submission.aiSummary ?? ""),
    form: normalizeIntakeForm(submission.form),
  };
};

const estimateComplexityScore = (form: ClientIntakeForm) => {
  const weightedFeatures = form.features.length * 4;
  const weightedModules = form.modules.length * 3;
  const weightedRoles = form.userRoles.length * 5;
  const aiWeight = form.features.some((item) => /ai/i.test(item)) ? 12 : 0;
  return Math.min(100, 20 + weightedFeatures + weightedModules + weightedRoles + aiWeight);
};

const toComplexityLabel = (score: number) => {
  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";
};

const estimateRefinedBudget = (form: ClientIntakeForm) => {
  const multiplier = 1 + estimateComplexityScore(form) / 220;
  const baseline = form.budget || 0;
  return Math.round(baseline * multiplier);
};

const estimateTimelineDays = (form: ClientIntakeForm) => {
  const complexityFactor = estimateComplexityScore(form);
  const baseDays = 12 + form.features.length * 2 + form.modules.length + form.userRoles.length;
  return Math.max(10, Math.round(baseDays + complexityFactor / 10));
};

const computeRefinementCompleteness = (form: ClientIntakeForm) => {
  const checks = [
    Boolean(form.businessName),
    Boolean(form.industry),
    Boolean(form.contactName),
    Boolean(form.email),
    Boolean(form.phone),
    Boolean(form.companySize),
    Boolean(form.goal),
    Boolean(form.projectType),
    Boolean(form.features.length),
    Boolean(form.userRoles.length),
    Boolean(form.modules.length),
    Boolean(form.ideaDescription),
    Boolean(form.targetAudience),
    Number(form.budget) > 0,
    Boolean(form.deadline),
    Boolean(form.priority),
    Boolean(form.selectedPackage),
    Boolean(form.meetingSlot),
    Boolean(form.uploadedFiles.length),
    Boolean(form.suggestionNotes.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const buildValidationIssues = (form: ClientIntakeForm) => {
  const issues: string[] = [];

  if (!form.businessName.trim()) issues.push("Missing business name");
  if (!form.industry.trim()) issues.push("Missing industry context");
  if (!form.contactName.trim()) issues.push("Missing contact person");
  if (!form.email.trim()) issues.push("Missing contact email");
  if (!form.phone.trim()) issues.push("Missing contact phone");
  if (!form.companySize.trim()) issues.push("Missing company size");
  if (!form.goal.trim()) issues.push("Missing explicit product goal");
  if (!form.targetAudience.trim()) issues.push("Missing target audience");
  if (!form.userRoles.length) issues.push("No user roles defined");
  if (!form.modules.length) issues.push("No modules/pages selected");
  if (!form.ideaDescription.trim()) issues.push("Description is empty");
  if (!Number(form.budget) || Number(form.budget) <= 0) issues.push("Missing budget range");
  if (!form.deadline.trim()) issues.push("No launch deadline provided");
  if (!form.selectedPackage) issues.push("No package selected");
  if (!form.features.some((item) => /api|integration|payment/i.test(item))) issues.push("Missing API or integration details");
  if (!form.meetingSlot.trim()) issues.push("No meeting slot selected");
  if (!form.uploadedFiles.length) issues.push("No supporting files uploaded");

  return issues;
};

const buildRefinementSuggestions = (form: ClientIntakeForm, issues: string[]) => {
  const suggestions = new Set<string>();
  issues.forEach((issue) => {
    if (/business|industry|contact/i.test(issue)) suggestions.add("Add the business context and stakeholder details");
    if (/roles/i.test(issue)) suggestions.add("Define Admin and Customer roles");
    if (/api|integration/i.test(issue)) suggestions.add("Add API Integration or Payment scope");
    if (/modules/i.test(issue)) suggestions.add("Add Dashboard and Profile modules");
    if (/goal/i.test(issue)) suggestions.add("Write one measurable business goal");
    if (/description/i.test(issue)) suggestions.add("Expand use-cases in description");
    if (/budget|deadline|package/i.test(issue)) suggestions.add("Add delivery and commercial details");
  });

  if (form.features.includes("Payment") && !form.features.includes("Analytics")) {
    suggestions.add("Add Analytics to track payment conversion");
  }

  if (!form.suggestionNotes.length) {
    suggestions.add("Capture any special constraints, approvals, or launch notes");
  }

  return Array.from(suggestions);
};

const buildTaskPreview = (form: ClientIntakeForm) => {
  const frontend = Array.from(new Set([...form.modules, ...form.features.filter((item) => /dashboard|landing|profile|checkout/i.test(item))]));
  const backend = Array.from(
    new Set([
      ...form.features.filter((item) => /api|auth|payment|crm|notification|analytics/i.test(item)).map((item) => `${item} API`),
      ...form.userRoles.map((role) => `${role} access control`),
    ]),
  );

  return { frontend, backend };
};

const buildGoalAlignment = (form: ClientIntakeForm) => {
  const goal = form.goal.toLowerCase();
  const checks: Array<{ ok: boolean; label: string }> = [];

  if (/sales|revenue|conversion/.test(goal)) {
    checks.push({ ok: form.features.includes("Payment"), label: "Payment flow included" });
    checks.push({ ok: form.features.includes("Analytics"), label: "Analytics included" });
  }

  if (/support|engagement|retention/.test(goal)) {
    checks.push({ ok: form.features.some((item) => /ai assistant|notifications/i.test(item)), label: "Engagement features present" });
  }

  if (!checks.length) {
    checks.push({ ok: true, label: "Goal is generic; baseline alignment assumed" });
  }

  return checks;
};

const improveDescriptionDraft = (form: ClientIntakeForm) => {
  const businessName = form.businessName || "the client";
  const industry = form.industry || "their industry";
  const roleSummary = form.userRoles.length ? form.userRoles.join(", ") : "Admin and Customer";
  const moduleSummary = form.modules.length ? form.modules.join(", ") : "Dashboard and Profile";
  const featureSummary = form.features.length ? form.features.slice(0, 6).join(", ") : "Login/Auth and Analytics";
  const commercialSummary = `${form.priority || "medium"} priority, ${form.selectedPackage || "growth"} package, ${formatCurrency(form.budget)} budget, deadline ${form.deadline || "to be defined"}`;

  return `${buildScopeSeedDescription(form)}\n\nRefined Scope: Expand the ${form.projectType} build for ${businessName} in ${industry} with stronger workflow detail, delivery sequencing, and launch metrics. Primary roles: ${roleSummary}. Key modules/pages: ${moduleSummary}. Core capabilities: ${featureSummary}. Commercial context: ${commercialSummary}. Include API contracts, milestones, acceptance criteria, and measurable launch KPIs.`.trim();
};

const buildStudioSummary = (form: ClientIntakeForm, completeness: number, issues: string[]) => {
  const issueLine = issues.length ? `Open issues: ${issues.slice(0, 3).join(", ")}.` : "No critical issues detected.";
  return `Refinement Studio summary for ${form.businessName || "client"}: Goal ${form.goal || "to be finalized"}. Scope includes ${form.features.length} features, ${form.modules.length} modules, and ${form.userRoles.length} user roles. Completeness ${completeness}%. ${issueLine}`;
};

const getVersionStore = (): RefinementVersionStore => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REFINEMENT_VERSION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RefinementVersionStore;
  } catch {
    return {};
  }
};

const saveVersionStore = (store: RefinementVersionStore) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFINEMENT_VERSION_STORAGE_KEY, JSON.stringify(store));
};

const formatDateTime = (value?: string | number) => {
  if (!value) return "Not available";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

const formatRelativeTime = (value?: string | number) => {
  if (!value) return "Just now";
  const time = typeof value === "number" ? value : new Date(value).getTime();
  if (Number.isNaN(time)) return "Just now";
  const diff = Date.now() - time;
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (file: { type?: string; isImage?: boolean }) => {
  return Boolean(file.isImage || (file.type && file.type.startsWith("image/")));
};

const statusTone = (status: RequirementLifecycleStatus) => {
  if (status === "locked") return "border-blue-400/40 bg-blue-500/15 text-blue-200";
  if (status === "verified") return "border-blue-400/30 bg-blue-500/10 text-blue-100";
  if (status === "submitted") return "border-blue-400/25 bg-blue-500/5 text-blue-100";
  return "border-white/20 bg-white/5 text-white/70";
};

const titleCaseStatus = (status: RequirementLifecycleStatus) => {
  if (status === "pending") return "Pending";
  if (status === "submitted") return "Submitted";
  if (status === "verified") return "Verified";
  return "Locked";
};

const getLifecycleStatus = (bundle: RequirementBundle | null, hasSubmission: boolean): RequirementLifecycleStatus => {
  if (bundle?.requirements?.locked) return "locked";
  if (bundle?.requirements) return "verified";
  if (hasSubmission) return "submitted";
  return "pending";
};

const toFallbackLead = (submission: ClientIntakeSubmission): LeadRecord => ({
  id: submission.leadId ?? (Number(submission.id.replace(/\D/g, "").slice(-6)) || Date.now()),
  dealId: `SUB-${submission.id.slice(-6).toUpperCase()}`,
  name: submission.form.contactName || submission.leadName || "Unknown contact",
  company: submission.form.businessName || "Unknown company",
  project: submission.form.projectType,
  status: "warm",
  budgetLabel: formatCurrency(submission.form.budget),
  budgetValue: submission.form.budget,
  score: 70,
  source: "Client Intake",
  owner: "System",
  phone: submission.form.phone || "",
  email: submission.form.email || "",
  insight: "Submitted through intake form",
  nextAction: "Review and verify requirement",
  lastActivity: formatRelativeTime(submission.submittedAt),
  notes: submission.form.ideaDescription,
  createdAt: submission.submittedAt,
});

const buildRequirementBreakdown = (submission: ClientIntakeSubmission, bundle: RequirementBundle | null) => {
  const sectionTitles: Record<string, string> = {
    auth: "Authentication",
    authentication: "Authentication",
    ai: "AI Assistant",
    assistant: "AI Assistant",
    dashboard: "Dashboard",
    admin: "Dashboard",
    integration: "Integrations",
    integrations: "Integrations",
    backend: "Integrations",
    frontend: "Frontend",
    design: "Design",
    testing: "Testing",
  };

  const sectionMap = new Map<string, Set<string>>();

  (bundle?.requirements?.items ?? []).forEach((item) => {
    const key = item.bucket.toLowerCase();
    const title = sectionTitles[key] ?? item.bucket.charAt(0).toUpperCase() + item.bucket.slice(1);
    if (!sectionMap.has(title)) sectionMap.set(title, new Set<string>());
    sectionMap.get(title)?.add(item.label);
  });

  if (!sectionMap.size) {
    submission.form.features.forEach((feature) => {
      const key = feature.toLowerCase();
      let title = "Core Requirements";

      if (/login|auth|signup/.test(key)) title = "Authentication";
      else if (/ai|chat/.test(key)) title = "AI Assistant";
      else if (/dashboard|admin/.test(key)) title = "Dashboard";
      else if (/api|payment|integration/.test(key)) title = "Integrations";

      if (!sectionMap.has(title)) sectionMap.set(title, new Set<string>());
      sectionMap.get(title)?.add(feature);
    });
  }

  return Array.from(sectionMap.entries()).map(([title, labels]) => ({
    title,
    items: Array.from(labels),
  }));
};

const computeCompleteness = (submission: ClientIntakeSubmission, bundle: RequirementBundle | null) => {
  const checks = {
    clientProfile: Boolean(submission.form.businessName && submission.form.contactName && submission.form.email),
    requirements: Boolean(submission.form.projectType && submission.form.ideaDescription && submission.form.features.length),
    budgetTimeline: Boolean(submission.form.budget && submission.form.deadline),
    assets: Boolean(submission.form.uploadedFiles.length),
    meeting: Boolean(submission.form.meetingSlot || bundle?.meeting?.dateTime),
    aiSummary: Boolean(submission.aiSummary || bundle?.requirements?.summary),
  };

  const done = Object.values(checks).filter(Boolean).length;
  const percent = Math.round((done / Object.keys(checks).length) * 100);

  const missing: string[] = [];
  if (!checks.clientProfile) missing.push("Client profile");
  if (!checks.requirements) missing.push("Requirement clarity");
  if (!checks.budgetTimeline) missing.push("Budget and timeline");
  if (!checks.assets) missing.push("Reference files");
  if (!checks.meeting) missing.push("Meeting context");
  if (!checks.aiSummary) missing.push("AI summary");

  if (!bundle?.requirements?.items?.some((item) => item.bucket === "backend")) {
    missing.push("API endpoints");
  }
  if (!submission.form.targetAudience) {
    missing.push("User flow and user roles");
  }

  return { percent, missing };
};

const inferUsers = (submission: ClientIntakeSubmission) => {
  if (submission.form.targetAudience.trim()) return submission.form.targetAudience;
  if (/health|patient|clinic/i.test(`${submission.form.industry} ${submission.form.ideaDescription}`)) {
    return "Patients + Admin";
  }
  return "End users + Admin";
};

const inferPriorityNarrative = (submission: ClientIntakeSubmission) => {
  if (submission.form.priority === "urgent") return "Speed + launch readiness";
  if (submission.form.features.some((feature) => /ai|assistant|chat/i.test(feature))) return "Speed + AI integration";
  return "Balanced quality + predictable delivery";
};

const buildPipeline = (status: RequirementLifecycleStatus, completeness: number): PipelineStage[] => {
  if (status === "locked") {
    return [
      { key: "design", label: "Design", status: "done", progress: 100 },
      { key: "frontend", label: "Frontend", status: "done", progress: 100 },
      { key: "backend", label: "Backend", status: "done", progress: 100 },
      { key: "testing", label: "Testing", status: "done", progress: 100 },
    ];
  }

  return [
    { key: "design", label: "Design", status: "done", progress: 100 },
    {
      key: "frontend",
      label: "Frontend",
      status: completeness >= 45 ? "in-progress" : "locked",
      progress: completeness >= 45 ? Math.min(92, Math.max(35, completeness)) : 15,
    },
    {
      key: "backend",
      label: "Backend",
      status: completeness >= 75 ? "in-progress" : "locked",
      progress: completeness >= 75 ? Math.min(80, completeness - 20) : 10,
    },
    {
      key: "testing",
      label: "Testing",
      status: completeness >= 90 ? "in-progress" : "locked",
      progress: completeness >= 90 ? Math.min(65, completeness - 30) : 5,
    },
  ];
};

const getAssetTag = (file: { name: string; type?: string; isImage?: boolean }) => {
  const name = file.name.toLowerCase();
  if (/api|swagger|postman|json/.test(name)) return "API";
  if (/figma|wireframe|ui|design/.test(name) || isImageFile(file)) return "Design";
  return "Reference";
};

export function RequirementsPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [leads, setLeads] = useState<LeadRecord[]>(getLeads());
  const [clientSubmissions, setClientSubmissions] = useState<ClientIntakeSubmission[]>(
    getClientIntakeSubmissions().map((item) => normalizeIntakeSubmission(item)),
  );
  const [search, setSearch] = useState("");
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [requirementBundle, setRequirementBundle] = useState<RequirementBundle | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementForm, setRefinementForm] = useState<ClientIntakeForm>(cloneForm(null));
  const [refinementVersions, setRefinementVersions] = useState<RefinementVersionStore>(getVersionStore());
  const [isRefiningAi, setIsRefiningAi] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getAuthSession();
      setIsAdmin(session?.role === "admin");
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [loadedLeads, localSubmissions, backendSubmissions] = await Promise.all([
        getLeads(),
        getClientIntakeSubmissions(),
        fetchBackendClientIntakeSubmissions(),
      ]);

      setLeads(loadedLeads);

      const submissionMap = new Map<string, ClientIntakeSubmission>();
      [...localSubmissions, ...backendSubmissions].forEach((sub) => {
        const normalized = normalizeIntakeSubmission(sub);
        if (!submissionMap.has(normalized.id)) {
          submissionMap.set(normalized.id, normalized);
        }
      });
      setClientSubmissions(Array.from(submissionMap.values()));
    };

    loadData();
  }, []);

  const submittedEntries = useMemo<SubmittedLeadEntry[]>(() => {
    const leadMap = new Map<number, LeadRecord>();
    leads.forEach((lead) => lead.id && leadMap.set(lead.id, lead));

    return clientSubmissions
      .map((submission) => {
        const lead = submission.leadId ? leadMap.get(submission.leadId) : undefined;
        const hasLinkedLead = Boolean(lead);
        const displayLead = lead || toFallbackLead(submission);
        return {
          key: `${displayLead.id}-${submission.id}`,
          lead,
          submission,
          hasLinkedLead,
        };
      })
      .sort((a, b) => b.submission.submittedAt - a.submission.submittedAt);
  }, [leads, clientSubmissions]);

  const filteredEntries = useMemo(() => {
    if (!search) return submittedEntries;
    const q = search.toLowerCase();
    return submittedEntries.filter(({ lead, submission }) => {
      return (
        lead.company?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        submission.form.businessName?.toLowerCase().includes(q) ||
        submission.form.email?.toLowerCase().includes(q)
      );
    });
  }, [submittedEntries, search]);

  const {
    selectedSubmission,
    selectedLead,
    selectedDisplayLead,
    hasLinkedLead,
  } = useMemo(() => {
    const entry = submittedEntries.find((item) => item.key === selectedEntryKey);
    if (!entry) return { selectedSubmission: null, selectedLead: null, selectedDisplayLead: null, hasLinkedLead: false, accessRecord: null };

    const { submission, lead, hasLinkedLead } = entry;
    return {
      selectedSubmission: submission,
      selectedLead: hasLinkedLead ? lead : null,
      selectedDisplayLead: lead,
      hasLinkedLead,
    };
  }, [selectedEntryKey, submittedEntries, requirementBundle]);

  const lifecycleStatus = getLifecycleStatus(requirementBundle, Boolean(selectedSubmission));
  const studioLocked = lifecycleStatus === "locked";
  const lockSnapshot = requirementBundle?.requirements?.lock;

  const lastUpdated = useMemo(() => {
    if (!selectedSubmission) return Date.now();
    const bundleUpdate = requirementBundle?.requirements?.updatedAt;
    const submissionUpdate = selectedSubmission.submittedAt;
    return Math.max(Number(bundleUpdate) || 0, submissionUpdate || 0);
  }, [selectedSubmission, requirementBundle]);

  const aiConfidence = useMemo(() => {
    if (!requirementBundle?.requirements) return 60;
    const conf = Number((requirementBundle.requirements.analysis as any)?.confidence ?? 0);
    return conf > 0 ? Math.round(conf * 100) : 60;
  }, [requirementBundle]);

  const draftCompleteness = useMemo(() => computeRefinementCompleteness(refinementForm), [refinementForm]);
  const draftIssues = useMemo(() => buildValidationIssues(refinementForm), [refinementForm]);
  const draftSuggestions = useMemo(() => buildRefinementSuggestions(refinementForm, draftIssues), [draftIssues, refinementForm]);

  const aiSummary = useMemo(() => {
    if (!selectedSubmission) return "";
    const bundleSummary = requirementBundle?.requirements?.summary;
    if (bundleSummary && !/^AI unavailable/i.test(bundleSummary)) return bundleSummary;
    return selectedSubmission.aiSummary || "AI summary not available. Regenerate to create one.";
  }, [selectedSubmission, requirementBundle]);

  const requirementBreakdown = useMemo(() => {
    if (!selectedSubmission) return [];
    return buildRequirementBreakdown(selectedSubmission, requirementBundle);
  }, [selectedSubmission, requirementBundle]);

  const completeness = useMemo(() => {
    if (!selectedSubmission) return { percent: 0, missing: [] };
    return computeCompleteness(selectedSubmission, requirementBundle);
  }, [selectedSubmission, requirementBundle]);

  const { lockScore, readyToLock, missing: lockMissing } = useMemo((): RequirementLockValidation => {
    if (!selectedSubmission) return { lockScore: 0, readyToLock: false, missing: ["No submission"], completionPercent: 0 };

    const missing: string[] = [];
    if (completeness.percent < 80) missing.push("Low completeness score");
    if (!hasLinkedLead) missing.push("Not linked to a lead");
    if (!requirementBundle?.requirements?.items?.length) missing.push("No requirement items");

    const score = Math.max(0, 100 - missing.length * 25 - (100 - completeness.percent) / 2);

    return {
      lockScore: Math.round(score),
      readyToLock: score >= 70,
      missing,
      completionPercent: completeness.percent,
    };
  }, [selectedSubmission, completeness, aiConfidence, hasLinkedLead, requirementBundle]);

  const finalVersion = useMemo(() => {
    if (!selectedLead) return 1;
    const versions = refinementVersions[selectedLead.id] ?? [];
    return versions.length + 1;
  }, [selectedLead, refinementVersions]);

  const pipeline = useMemo((): PipelineStage[] => {
    const base: PipelineStage[] = [
      { key: "design", label: "Design", status: "locked", progress: 0 },
      { key: "frontend", label: "Frontend", status: "locked", progress: 0 },
      { key: "backend", label: "Backend", status: "locked", progress: 0 },
      { key: "testing", label: "Testing", status: "locked", progress: 0 },
    ];

    if (!selectedSubmission) return base;

    const status = lifecycleStatus;
    if (status === "pending") return base;

    base[0] = { key: "design", label: "Design", status: "in-progress", progress: 75 };
    if (status === "submitted") return base;

    base[0] = { key: "design", label: "Design", status: "done", progress: 100 };
    base[1] = { key: "frontend", label: "Frontend", status: "in-progress", progress: 40 };
    if (status === "verified") return base;

    base[1] = { key: "frontend", label: "Frontend", status: "done", progress: 100 };
    base[2] = { key: "backend", label: "Backend", status: "in-progress", progress: 15 };
    if (status === "locked") return base;

    return base;
  }, [selectedSubmission, lifecycleStatus]);

  const handleSelectEntry = async (entry: SubmittedLeadEntry) => {
    setSelectedEntryKey(entry.key);
    setRequirementBundle(null);

    if (entry.hasLinkedLead) {
      const bundle = await fetchLeadRequirementBundle(entry.lead.id);
      setRequirementBundle(bundle);
    } else {
      const access = await createOrGetClientAccessByLead(entry.lead);
      setRequirementBundle({
        access,
        lead: entry.lead,
        intake: entry.submission,
        requirements: null,
        meeting: null,
      } as unknown as RequirementBundle);
    }
  };

  const handleOpenEditStudio = () => {
    if (!selectedSubmission) return;
    setRefinementForm(cloneForm(selectedSubmission.form));
    setIsRefining(true);
  };

  const handleSaveRefinement = async () => {
    if (!selectedSubmission || !selectedLead) return;
    const liveCompleteness = computeRefinementCompleteness(refinementForm);
    const liveIssues = buildValidationIssues(refinementForm);

    const updatedSubmission: ClientIntakeSubmission = {
      ...selectedSubmission,
      form: refinementForm,
    };

    await updateClientIntakeSubmission({ submissionId: updatedSubmission.id, form: updatedSubmission.form, aiSummary: updatedSubmission.aiSummary });

    const newVersion: RefinementVersion = {
      id: `v${finalVersion}`,
      label: `Version ${finalVersion}`,
      editedAt: Date.now(),
      summary: buildStudioSummary(refinementForm, liveCompleteness, liveIssues),
    };

    const updatedVersions = { ...refinementVersions };
    const leadVersions = updatedVersions[selectedLead.id] ?? [];
    leadVersions.push(newVersion);
    updatedVersions[selectedLead.id] = leadVersions;
    setRefinementVersions(updatedVersions);
    saveVersionStore(updatedVersions);

    setClientSubmissions((prev) => prev.map((s) => (s.id === updatedSubmission.id ? updatedSubmission : s)));
    setIsRefining(false);
    toast.success("Requirement saved", { description: `Version ${finalVersion} is now active.` });
  };

  const handleRegenerate = async () => {
    if (!selectedLead) return;
    const leadId = selectedLead.id;
    toast.info("Regenerating AI analysis...", { description: "This may take a moment." });
    await regenerateLeadRequirements(leadId);
    const bundle = await fetchLeadRequirementBundle(leadId);
    setRequirementBundle(bundle);
    toast.success("AI analysis complete", { description: "Requirement bundle has been updated." });
  };

  const handleLock = async () => {
    if (!selectedLead) {
      toast.error("Select a lead first", { description: "Choose a submitted client record before locking." });
      return;
    }

    setIsLocking(true);

    if (!readyToLock) {
      toast.info("Review first", {
        description: lockMissing.length ? lockMissing[0] : "Add more requirements before locking.",
      });
    }
  };

  const handleConfirmLock = async () => {
    if (!selectedLead || !password) return;
    const leadId = selectedLead.id;
    toast.info("Locking requirement...", { description: "Securing final version." });
    try {
      await lockLeadRequirements(leadId, { password, confirmPassword: password });
      const bundle = await fetchLeadRequirementBundle(leadId);
      setRequirementBundle(bundle);
      toast.success("Requirement locked", { description: `Version ${finalVersion} is secured.` });
    } catch (err) {
      toast.error("Lock failed", { description: (err as Error).message });
    } finally {
      setIsLocking(false);
      setPassword("");
    }
  };

  const handleUnlock = async () => {
    if (!selectedLead || !isAdmin) return;
    setIsUnlocking(true);
  };

  const handleConfirmUnlock = async () => {
    if (!selectedLead || !password) return;
    const leadId = selectedLead.id;
    toast.info("Unlocking requirement...", { description: "Authenticating..." });
    try {
      await unlockLeadRequirements(leadId, { password });
      const bundle = await fetchLeadRequirementBundle(leadId);
      setRequirementBundle(bundle);
      toast.success("Requirement unlocked", { description: "You can now edit the requirement." });
    } catch (err) {
      toast.error("Unlock failed", { description: (err as Error).message });
    } finally {
      setIsUnlocking(false);
      setPassword("");
    }
  };

  const handleConvertToProject = async () => {
    if (!selectedLead) return;
    toast.info("Converting to project...", { description: "This may take a moment." });
    try {
      await createProjectFromLead(selectedLead);
      toast.success("Project created", { description: "Find it in the Projects dashboard." });
      navigate("/projects");
    } catch (err) {
      toast.error("Conversion failed", { description: (err as Error).message });
    }
  };

  const handleGenerateTasks = async () => {
    if (!selectedLead) return;
    toast.info("Task generation not implemented", { description: "This feature is coming soon." });
  };

  const handleResendLink = async () => {
    if (!selectedLead) return;
    toast.info("Resending client link...", { description: "This may take a moment." });
    try {
      await resendClientLink({ leadId: String(selectedLead.id), name: selectedLead.name, company: selectedLead.company, email: selectedLead.email });
      toast.success("Link sent", { description: `A new link has been sent to ${selectedLead.email}.` });
    } catch (err) {
      toast.error("Failed to send link", { description: (err as Error).message });
    }
  };

  const handleRefineWithAI = async () => {
    if (isRefiningAi) return;

    const originalDescription = refinementForm.ideaDescription;
    const draft = improveDescriptionDraft(refinementForm);
    setIsRefiningAi(true);
    toast.info("Refining with AI...", { description: "This may take a moment." });

    try {
      const refined = await refineIntakeDescriptionWithAI({
        description: draft,
        businessName: refinementForm.businessName,
        industry: refinementForm.industry,
        contactName: refinementForm.contactName,
        projectType: refinementForm.projectType,
        goal: refinementForm.goal,
        targetAudience: refinementForm.targetAudience,
        userRoles: refinementForm.userRoles,
        modules: refinementForm.modules,
        features: refinementForm.features,
        budget: refinementForm.budget,
        deadline: refinementForm.deadline,
        priority: refinementForm.priority,
        selectedPackage: refinementForm.selectedPackage,
      });
      setRefinementForm((prev) => ({ ...prev, ideaDescription: String((refined as any).description ?? refined).trim() }));
      toast.success("AI refinement complete");
    } catch (error) {
      setRefinementForm((prev) => ({ ...prev, ideaDescription: originalDescription }));
      toast.error("AI refinement failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsRefiningAi(false);
    }
  };

  const inferUsers = (submission: ClientIntakeSubmission) => {
    if (submission.form.userRoles.length) return submission.form.userRoles.join(", ");
    if (submission.form.targetAudience) return submission.form.targetAudience;
    return "General users";
  };

  const inferPriorityNarrative = (submission: ClientIntakeSubmission) => {
    const priority = submission.form.priority;
    if (priority === "urgent") return "Urgent launch to capture market opportunity";
    if (priority === "low") return "Exploratory build, flexible timeline";
    return "Standard development cycle, balancing speed and quality";
  };

  return (
    <DashboardLayout>
      <div className="grid h-full grid-cols-[380px_1fr] overflow-hidden">
        <div className="flex flex-col border-r border-white/10 bg-[#0a1224]">
          <div className="border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold text-white">Requirement Command Center</h2>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company or email"
                className="border-cyan-300/25 bg-white/5 pl-9 text-white placeholder:text-white/45"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {!filteredEntries.length ? (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <Users className="h-10 w-10 text-white/50" />
                <h3 className="mt-3 font-semibold text-white">No client submissions</h3>
                <p className="mt-1 text-sm text-white/70">No records match your search.</p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const { lead, submission } = entry;
                const active = selectedEntryKey === entry.key;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => handleSelectEntry(entry)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-cyan-300/55 bg-cyan-500/15 shadow-[0_10px_30px_rgba(34,211,238,0.12)]"
                        : "border-white/10 bg-white/5 hover:border-cyan-300/35 hover:bg-cyan-500/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{submission.form.businessName || lead.company}</p>
                    <p className="text-xs text-white/65">{submission.form.email || lead.email}</p>
                    <p className="mt-1 text-xs text-white/50">Updated {formatRelativeTime(submission.submittedAt)}</p>
                    {!entry.hasLinkedLead ? (
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-200/85">Unlinked intake record</p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="relative overflow-y-auto bg-[#020710]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

          {!selectedSubmission ? (
            <div className="flex h-full flex-col items-center justify-center p-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-white/50" />
              <h1 className="text-2xl font-semibold text-white">No client submissions yet</h1>
              <p className="mt-2 text-sm text-white/70">Requirement Command Center only shows submitted client records.</p>
              <Button className="mt-6 bg-blue-600 text-white hover:bg-blue-500" onClick={() => navigate("/leads")}>Go to Leads</Button>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <section className="sticky top-0 z-30 -mx-6 -mt-6 rounded-b-2xl border-b border-blue-400/30 bg-[#0a1429]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h1 className="text-3xl font-semibold text-white">
                        {selectedSubmission.form.businessName || selectedDisplayLead?.company || "Client Submission"} • {selectedSubmission.form.projectType}
                      </h1>
                      <p className="mt-2 text-sm text-blue-100/80">
                        {selectedSubmission.form.ideaDescription || "Project description not provided."}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${statusTone(lifecycleStatus)} px-3 py-1 text-xs`}>
                      {titleCaseStatus(lifecycleStatus)}
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85">Budget<br /><span className="text-sm font-semibold text-white">{formatCurrency(selectedSubmission.form.budget)}</span></div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85">Timeline<br /><span className="text-sm font-semibold text-white">{selectedSubmission.form.deadline || "Not provided"}</span></div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85">Priority<br /><span className="text-sm font-semibold capitalize text-white">{selectedSubmission.form.priority}</span></div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85">AI Confidence<br /><span className="text-sm font-semibold text-white">{aiConfidence}%</span></div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85">Last Updated<br /><span className="text-sm font-semibold text-white">{formatRelativeTime(lastUpdated)}</span></div>
                  </div>

                  <p className="text-xs text-white/65">
                    Contact: {selectedSubmission.form.email || selectedDisplayLead?.email || "Not available"} · {selectedSubmission.form.phone || selectedDisplayLead?.phone || "Not available"}
                  </p>
                </div>
              </section>

              {studioLocked ? (
                <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5 text-emerald-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-base font-semibold">
                        <Lock className="h-4 w-4" /> Requirement Locked
                      </p>
                      <p className="mt-1 text-sm text-emerald-50/80">
                        Final Version (v{finalVersion}) · Secured with password{lockSnapshot?.lockedBy ? ` · Locked by ${lockSnapshot.lockedBy}` : ""}
                      </p>
                    </div>
                    <div className="text-sm text-emerald-50/80">
                      <p>Locked at {lockSnapshot?.lockedAt ? formatDateTime(lockSnapshot.lockedAt) : "Not available"}</p>
                      <p>Audit trail captured for execution handoff</p>
                    </div>
                  </div>
                </section>
              ) : null}

              {!hasLinkedLead ? (
                <section className="rounded-2xl border border-amber-300/35 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-5 text-amber-50">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Intake captured without linked lead
                  </p>
                  <p className="mt-2 text-sm text-amber-100/85">
                    Completed client information is shown below. To enable lock, regenerate, project conversion, and resend-link actions, attach this submission to a lead first.
                  </p>
                </section>
              ) : null}

              <section className="rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.22),rgba(10,18,36,0.95)_55%)] p-7">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Client Intake Snapshot</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Completed Information Overview</h2>
                  </div>
                  <Badge variant="outline" className="w-fit border-cyan-300/40 bg-cyan-400/10 text-cyan-100">
                    Submission {formatDateTime(selectedSubmission.submittedAt)}
                  </Badge>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-cyan-100/70">Business</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedSubmission.form.businessName || "Not provided"}</p>
                    <p className="mt-2 text-xs text-white/65">Industry: {selectedSubmission.form.industry || "Not provided"}</p>
                    <p className="text-xs text-white/65">Company Size: {selectedSubmission.form.companySize || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-cyan-100/70">Primary Contact</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedSubmission.form.contactName || selectedSubmission.leadName || "Not provided"}</p>
                    <p className="mt-2 text-xs text-white/65">Email: {selectedSubmission.form.email || "Not provided"}</p>
                    <p className="text-xs text-white/65">Phone: {selectedSubmission.form.phone || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-cyan-100/70">Goal and Audience</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedSubmission.form.goal || "Not provided"}</p>
                    <p className="mt-2 text-xs text-white/65">Target Audience: {selectedSubmission.form.targetAudience || "Not provided"}</p>
                    <p className="text-xs text-white/65">Package: {selectedSubmission.form.selectedPackage}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-cyan-100/70">Scope Stats</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedSubmission.form.features.length} Features</p>
                    <p className="mt-2 text-xs text-white/65">{selectedSubmission.form.userRoles.length} User Roles</p>
                    <p className="text-xs text-white/65">{selectedSubmission.form.modules.length} Modules</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-cyan-100">Feature Selection</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSubmission.form.features.length ? (
                        selectedSubmission.form.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="border-cyan-300/35 bg-cyan-400/10 text-cyan-100">
                            {feature}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-white/65">No features selected</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-cyan-100">User Roles</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSubmission.form.userRoles.length ? (
                        selectedSubmission.form.userRoles.map((role) => (
                          <Badge key={role} variant="outline" className="border-emerald-300/35 bg-emerald-400/10 text-emerald-100">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-white/65">No roles selected</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-cyan-100">Modules / Pages</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSubmission.form.modules.length ? (
                        selectedSubmission.form.modules.map((moduleName) => (
                          <Badge key={moduleName} variant="outline" className="border-sky-300/35 bg-sky-400/10 text-sky-100">
                            {moduleName}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-white/65">No modules selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-amber-300/20 bg-[linear-gradient(145deg,rgba(31,18,5,0.35),rgba(8,14,28,0.92))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-amber-200/80">Client Intake Form Ledger</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">All Submitted Intake Fields</h2>
                  </div>
                  <Badge variant="outline" className="w-fit border-amber-300/35 bg-amber-500/10 text-amber-100">
                    Source: Client Intake Form
                  </Badge>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Business Name</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.businessName || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Industry</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.industry || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Company Size</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.companySize || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Contact Name</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.contactName || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Email</p>
                    <p className="mt-1 font-medium text-white break-all">{selectedSubmission.form.email || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Phone</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.phone || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Project Type</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.projectType || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85 md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Goal</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.goal || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85 xl:col-span-3">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Idea Description</p>
                    <p className="mt-1 leading-6 text-white/90">{selectedSubmission.form.ideaDescription || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85 xl:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Target Audience</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.targetAudience || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Priority</p>
                    <p className="mt-1 font-medium capitalize text-white">{selectedSubmission.form.priority || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Budget</p>
                    <p className="mt-1 font-medium text-white">{formatCurrency(selectedSubmission.form.budget)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Estimated Price</p>
                    <p className="mt-1 font-medium text-white">{formatCurrency(selectedSubmission.form.estimatedPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Deadline</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.deadline || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Selected Package</p>
                    <p className="mt-1 font-medium capitalize text-white">{selectedSubmission.form.selectedPackage || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Meeting Slot</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.meetingSlot || "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
                    <p className="text-xs uppercase tracking-wide text-amber-100/75">Terms Accepted</p>
                    <p className="mt-1 font-medium text-white">{selectedSubmission.form.termsAccepted ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-amber-100">Features</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSubmission.form.features.length
                        ? selectedSubmission.form.features.map((feature) => (
                            <Badge key={`ledger-feature-${feature}`} variant="outline" className="border-cyan-300/35 bg-cyan-500/10 text-cyan-100">
                              {feature}
                            </Badge>
                          ))
                        : <p className="text-xs text-white/65">No features selected</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-amber-100">User Roles</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSubmission.form.userRoles.length
                        ? selectedSubmission.form.userRoles.map((role) => (
                            <Badge key={`ledger-role-${role}`} variant="outline" className="border-emerald-300/35 bg-emerald-500/10 text-emerald-100">
                              {role}
                            </Badge>
                          ))
                        : <p className="text-xs text-white/65">No user roles selected</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-amber-100">Modules / Pages</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSubmission.form.modules.length
                        ? selectedSubmission.form.modules.map((moduleName) => (
                            <Badge key={`ledger-module-${moduleName}`} variant="outline" className="border-sky-300/35 bg-sky-500/10 text-sky-100">
                              {moduleName}
                            </Badge>
                          ))
                        : <p className="text-xs text-white/65">No modules selected</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-amber-100">AI Suggestion Notes</p>
                  <div className="mt-2 space-y-1 text-sm text-white/85">
                    {selectedSubmission.form.suggestionNotes.length
                      ? selectedSubmission.form.suggestionNotes.map((note, index) => (
                          <p key={`note-${index}`}>- {note}</p>
                        ))
                      : <p className="text-white/65">No suggestion notes were saved from intake.</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-7">
                <h2 className="text-xl font-semibold text-white">Project Understanding</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="flex items-center gap-2 text-sm font-medium text-blue-200"><Target className="h-4 w-4" /> Goal</p><p className="mt-2 text-sm text-white/85">{selectedSubmission.form.ideaDescription || "Build project based on submitted scope"}</p></div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="flex items-center gap-2 text-sm font-medium text-blue-200"><Users className="h-4 w-4" /> Users</p><p className="mt-2 text-sm text-white/85">{inferUsers(selectedSubmission)}</p></div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="flex items-center gap-2 text-sm font-medium text-blue-200"><Layers className="h-4 w-4" /> Business Type</p><p className="mt-2 text-sm text-white/85">{selectedSubmission.form.industry || "Not provided"}</p></div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="flex items-center gap-2 text-sm font-medium text-blue-200"><Zap className="h-4 w-4" /> Priority</p><p className="mt-2 text-sm text-white/85">{inferPriorityNarrative(selectedSubmission)}</p></div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-7">
                <h2 className="text-xl font-semibold text-white">Requirement Breakdown</h2>
                <div className="mt-5 space-y-4">
                  {requirementBreakdown.length ? (
                    requirementBreakdown.map((group) => (
                      <div key={group.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-blue-200">{group.title}</p>
                        <div className="mt-2 space-y-1">
                          {group.items.map((item) => (
                            <p key={`${group.title}-${item}`} className="text-sm text-white/85">- {item}</p>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">No submitted requirement items.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-7">
                <h2 className="text-xl font-semibold text-white">Execution Pipeline</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {pipeline.map((stage) => (
                    <div key={stage.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{stage.label}</p>
                        <p className="text-xs text-white/70">
                          {stage.status === "done" ? "Done" : stage.status === "in-progress" ? "In Progress" : "Locked"}
                        </p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-blue-400"
                          style={{ width: `${stage.progress}%`, opacity: stage.status === "locked" ? 0.45 : 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/70">Design → Frontend → Backend → Testing</p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-7">
                <h2 className="text-xl font-semibold text-white">Files + Assets</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedSubmission.form.uploadedFiles.length ? (
                    selectedSubmission.form.uploadedFiles.map((file) => (
                      <div key={`${file.name}-${file.size}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                              {isImageFile(file) ? <ImageIcon className="h-4 w-4 text-blue-200" /> : <FileText className="h-4 w-4 text-blue-200" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{file.name}</p>
                              <p className="text-xs text-white/65">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-blue-300/30 bg-blue-500/10 text-[10px] text-blue-100">{getAssetTag(file)}</Badge>
                        </div>
                        {isImageFile(file) && file.previewUrl ? (
                          <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                            <img src={file.previewUrl} alt={file.name} className="h-32 w-full object-cover" />
                          </div>
                          ) : null}
                          {/* PDF preview + controls */}
                          {file.type === "application/pdf" && file.previewUrl ? (
                            <div className="mt-3 rounded-lg border border-white/10">
                              <object data={file.previewUrl} type="application/pdf" className="h-48 w-full">
                                <p className="p-3 text-sm text-white/70">PDF preview not available in this browser.</p>
                              </object>
                            </div>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex gap-2">
                              {file.previewUrl ? (
                                <a
                                  href={file.previewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                                >
                                  Preview
                                </a>
                              ) : null}

                              {file.previewUrl ? (
                                <a
                                  href={file.previewUrl}
                                  download={file.name}
                                  className="rounded-md border border-white/10 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-300/20"
                                >
                                  Download
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40"
                                >
                                  Download
                                </button>
                              )}
                            </div>
                            <div />
                          </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">No assets uploaded.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-7">
                <h2 className="text-xl font-semibold text-white">Completeness Engine</h2>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-white/80">Completion</p>
                    <p className="font-semibold text-white">{completeness.percent}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${completeness.percent}%` }} />
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-white/80">
                    {completeness.missing.length ? completeness.missing.map((item) => <p key={`miss-${item}`}>- {item}</p>) : <p>- No blockers</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-blue-400/30 bg-[#0a1429] p-7">
                <h2 className="text-xl font-semibold text-white">Decision Panel</h2>
                <p className="mt-2 text-sm text-blue-100/85">
                  {studioLocked
                    ? "Requirement is frozen. Use the final version to generate tasks or convert directly to project delivery."
                    : "Recommended Action: Generate tasks and start frontend."}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Ready to lock</p>
                    <p className="mt-1 text-sm font-semibold text-white">{readyToLock ? "Yes" : "Review first"}</p>
                    <p className="text-xs text-white/60">Completion {completeness.percent}% · Lock score {lockScore}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Missing</p>
                    <p className="mt-1 text-sm font-semibold text-white">{lockMissing.length ? lockMissing[0] : "No blockers"}</p>
                    <p className="text-xs text-white/60">{lockMissing.length > 1 ? `+${lockMissing.length - 1} more` : "Lock validation passed"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Version</p>
                    <p className="mt-1 text-sm font-semibold text-white">Final v{finalVersion}</p>
                    <p className="text-xs text-white/60">No overwrite after lock</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Security</p>
                    <p className="mt-1 text-sm font-semibold text-white">{studioLocked ? "Secured" : "Not locked"}</p>
                    <p className="text-xs text-white/60">{studioLocked ? `Failed unlock attempts: ${lockSnapshot?.unlockFailedAttempts ?? 0}` : "Password lock available"}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={handleGenerateTasks} disabled={!hasLinkedLead} className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
                    <SquareStack className="mr-2 h-4 w-4" /> Generate Tasks
                  </Button>
                  {!studioLocked ? (
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleOpenEditStudio}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  ) : (
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleOpenEditStudio}>
                      <Pencil className="mr-2 h-4 w-4" /> View Only
                    </Button>
                  )}
                  {!studioLocked ? (
                    <Button
                      variant="outline"
                      className="border-white/25 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
                      onClick={handleLock}
                      disabled={!hasLinkedLead}
                    >
                      <Lock className="mr-2 h-4 w-4" /> Lock
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="border-white/25 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
                    onClick={handleConvertToProject}
                    disabled={!hasLinkedLead}
                  >
                    <Rocket className="mr-2 h-4 w-4" /> Convert to Project
                  </Button>
                  {!studioLocked ? (
                    <Button
                      variant="outline"
                      className="border-white/25 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
                      onClick={handleRegenerate}
                      disabled={!hasLinkedLead}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Regenerate AI
                    </Button>
                  ) : null}
                  {studioLocked && isAdmin ? (
                    <Button variant="outline" className="border-amber-300/40 bg-amber-500/10 text-amber-50 hover:bg-amber-500/20" onClick={handleUnlock}>
                      <Lock className="mr-2 h-4 w-4" /> Unlock
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="border-white/25 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
                    onClick={handleResendLink}
                    disabled={!hasLinkedLead}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" /> Resend Link
                  </Button>
                </div>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/65">
                  <p>Lifecycle: Pending → Submitted → Verified → Locked</p>
                  <p className="mt-1">
                    Access: {requirementBundle?.clientLink?.id || requirementBundle?.intake?.id || "Not available"} · Intake link: {selectedLead ? getClientIntakeLinkForLead(selectedLead).replace(/^https?:\/\//, "") : "Not available"}
                  </p>
                  <p className="mt-1 flex items-center gap-2"><Bot className="h-3.5 w-3.5" /> Last AI refresh: {formatRelativeTime(lastUpdated)}</p>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRefining} onOpenChange={setIsRefining}>
        <DialogContent className="max-w-7xl bg-[#0a1224] text-white border-blue-400/30">
          <DialogHeader>
            <DialogTitle>Requirement Refinement Studio</DialogTitle>
            <DialogDescription>
              {studioLocked ? "Viewing locked requirement. Unlock to make changes." : "Refine and lock the client's project requirements."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[78vh] grid-cols-1 gap-6 overflow-y-auto p-1 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-blue-200">Requirement Coverage</h3>
                    <p className="text-xs text-white/60">Current draft completeness: {draftCompleteness}%</p>
                  </div>
                  <Badge variant="outline" className="border-cyan-300/30 bg-cyan-500/10 text-cyan-100">
                    {draftIssues.length ? `${draftIssues.length} gaps` : "Complete"}
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400" style={{ width: `${draftCompleteness}%` }} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Missing items</p>
                    <p className="mt-1 text-lg font-semibold text-white">{draftIssues.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Selected files</p>
                    <p className="mt-1 text-lg font-semibold text-white">{refinementForm.uploadedFiles.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">AI suggestions</p>
                    <p className="mt-1 text-lg font-semibold text-white">{draftSuggestions.length}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-4 font-semibold text-blue-200">Business & Contact</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={refinementForm.businessName} onChange={(e) => setRefinementForm({ ...refinementForm, businessName: e.target.value })} placeholder="Business name" className="bg-white/5" disabled={studioLocked} />
                  <Input value={refinementForm.industry} onChange={(e) => setRefinementForm({ ...refinementForm, industry: e.target.value })} placeholder="Industry" className="bg-white/5" disabled={studioLocked} />
                  <Input value={refinementForm.contactName} onChange={(e) => setRefinementForm({ ...refinementForm, contactName: e.target.value })} placeholder="Contact person" className="bg-white/5" disabled={studioLocked} />
                  <select value={refinementForm.companySize} onChange={(e) => setRefinementForm({ ...refinementForm, companySize: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none ring-0" disabled={studioLocked}>
                    <option value="" className="bg-[#0a1224]">Company size</option>
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#0a1224]">{option}</option>
                    ))}
                  </select>
                  <Input value={refinementForm.email} onChange={(e) => setRefinementForm({ ...refinementForm, email: e.target.value })} placeholder="Email" className="bg-white/5" disabled={studioLocked} />
                  <Input value={refinementForm.phone} onChange={(e) => setRefinementForm({ ...refinementForm, phone: e.target.value })} placeholder="Phone" className="bg-white/5" disabled={studioLocked} />
                  <Input value={refinementForm.targetAudience} onChange={(e) => setRefinementForm({ ...refinementForm, targetAudience: e.target.value })} placeholder="Target audience" className="bg-white/5 md:col-span-2" disabled={studioLocked} />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-4 font-semibold text-blue-200">Scope & Delivery</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={refinementForm.projectType} onChange={(e) => setRefinementForm({ ...refinementForm, projectType: e.target.value as ClientIntakeForm["projectType"] })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none ring-0" disabled={studioLocked}>
                    {PROJECT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#0a1224]">{option}</option>
                    ))}
                  </select>
                  <select value={refinementForm.priority} onChange={(e) => setRefinementForm({ ...refinementForm, priority: e.target.value as ClientIntakeForm["priority"] })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none ring-0" disabled={studioLocked}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#0a1224]">{option}</option>
                    ))}
                  </select>
                  <select value={refinementForm.selectedPackage} onChange={(e) => setRefinementForm({ ...refinementForm, selectedPackage: e.target.value as ClientIntakeForm["selectedPackage"] })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none ring-0" disabled={studioLocked}>
                    {PACKAGE_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#0a1224]">{option}</option>
                    ))}
                  </select>
                  <Input type="date" value={refinementForm.deadline} onChange={(e) => setRefinementForm({ ...refinementForm, deadline: e.target.value })} className="bg-white/5" disabled={studioLocked} />
                  <Input type="number" value={refinementForm.budget || ""} onChange={(e) => setRefinementForm({ ...refinementForm, budget: Number(e.target.value) || 0 })} placeholder="Budget" className="bg-white/5" disabled={studioLocked} />
                  <Input type="number" value={refinementForm.estimatedPrice || ""} onChange={(e) => setRefinementForm({ ...refinementForm, estimatedPrice: Number(e.target.value) || 0 })} placeholder="Estimated price" className="bg-white/5" disabled={studioLocked} />
                  <Input value={refinementForm.meetingSlot} onChange={(e) => setRefinementForm({ ...refinementForm, meetingSlot: e.target.value })} placeholder="Meeting slot" className="bg-white/5 md:col-span-2" disabled={studioLocked} />
                  <Input value={refinementForm.goal} onChange={(e) => setRefinementForm({ ...refinementForm, goal: e.target.value })} placeholder="Primary business goal" className="bg-white/5 md:col-span-2" disabled={studioLocked} />
                </div>
                <div className="relative mt-3">
                  <Textarea value={refinementForm.ideaDescription} onChange={(e) => setRefinementForm({ ...refinementForm, ideaDescription: e.target.value })} placeholder="Detailed project description" className="h-44 bg-white/5" disabled={studioLocked} />
                  {isRefiningAi ? (
                    <div className="absolute inset-0 rounded-md border border-cyan-300/20 bg-[#0a1224]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-200" />
                      <div>
                        <p className="text-sm font-semibold text-cyan-100">Analyzing lead requirements</p>
                        <p className="text-xs text-white/60">Waiting for the AI response before updating the draft.</p>
                      </div>
                    </div>
                  ) : null}
                  {!studioLocked ? (
                    <Button size="sm" variant="outline" className="absolute bottom-2 right-2 border-blue-300/30 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20" onClick={handleRefineWithAI} disabled={isRefiningAi}>
                      <Sparkles className={`mr-2 h-3.5 w-3.5 ${isRefiningAi ? "animate-pulse" : ""}`} /> {isRefiningAi ? "Refining..." : "Refine with AI"}
                    </Button>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-blue-200">Notes, Terms, and Files</h3>
                  <span className="text-xs text-white/55">Use this section for launch constraints, approvals, and reference assets</span>
                </div>
                <Textarea
                  value={refinementForm.suggestionNotes.join("\n")}
                  onChange={(e) => setRefinementForm({ ...refinementForm, suggestionNotes: e.target.value.split(/\r?\n/).map((note) => note.trim()).filter(Boolean) })}
                  placeholder="Add launch constraints, approval steps, non-functional requirements, or special notes. One note per line."
                  className="h-28 bg-white/5"
                  disabled={studioLocked}
                />
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <Checkbox id="termsAccepted" checked={refinementForm.termsAccepted} onCheckedChange={(checked) => setRefinementForm({ ...refinementForm, termsAccepted: Boolean(checked) })} disabled={studioLocked} />
                  <label htmlFor="termsAccepted" className="text-sm text-white/80">Terms accepted for the requirement package</label>
                </div>
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-white">Uploaded files</p>
                  {refinementForm.uploadedFiles.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {refinementForm.uploadedFiles.map((file) => (
                        <div key={`${file.name}-${file.lastModified ?? file.size}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{file.name}</p>
                              <p className="text-xs text-white/55">{getAssetTag(file)} · {formatFileSize(file.size)}</p>
                            </div>
                            <Badge variant="outline" className="border-white/15 bg-black/20 text-[10px] uppercase tracking-wide text-white/60">{file.isImage ? "Image" : "File"}</Badge>
                          </div>
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} className="mt-3 h-28 w-full rounded-lg object-cover" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/55">No supporting files uploaded yet.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 font-semibold text-blue-200">Feature Matrix</h3>
                <div className="space-y-3">
                  {Object.entries(FEATURE_LIBRARY).map(([category, features]) => (
                    <div key={category} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-white/60">{category}</p>
                      <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                        {features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <Checkbox
                              id={`feature-${feature}`}
                              checked={refinementForm.features.includes(feature)}
                              onCheckedChange={(checked) => {
                                const newFeatures = checked ? [...refinementForm.features, feature] : refinementForm.features.filter((f) => f !== feature);
                                setRefinementForm({ ...refinementForm, features: newFeatures });
                              }}
                              disabled={studioLocked}
                            />
                            <label htmlFor={`feature-${feature}`} className="text-xs text-white/80">{feature}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 font-semibold text-blue-200">User Roles</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_PRESETS.map((role) => (
                    <div key={role} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={refinementForm.userRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          const newRoles = checked ? [...refinementForm.userRoles, role] : refinementForm.userRoles.filter((r) => r !== role);
                          setRefinementForm({ ...refinementForm, userRoles: newRoles });
                        }}
                        disabled={studioLocked}
                      />
                      <label htmlFor={`role-${role}`} className="text-xs text-white/80">{role}</label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 font-semibold text-blue-200">Modules / Pages</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MODULE_PRESETS.map((moduleName) => (
                    <div key={moduleName} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <Checkbox
                        id={`module-${moduleName}`}
                        checked={refinementForm.modules.includes(moduleName)}
                        onCheckedChange={(checked) => {
                          const newModules = checked ? [...refinementForm.modules, moduleName] : refinementForm.modules.filter((m) => m !== moduleName);
                          setRefinementForm({ ...refinementForm, modules: newModules });
                        }}
                        disabled={studioLocked}
                      />
                      <label htmlFor={`module-${moduleName}`} className="text-xs text-white/80">{moduleName}</label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="mb-3 font-semibold text-blue-200">AI Coverage Preview</h3>
                {isRefiningAi ? (
                  <div className="space-y-3 text-sm text-white/75">
                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-200" />
                        <p className="font-medium text-cyan-100">Generating lead requirement analysis</p>
                      </div>
                      <p className="mt-2 text-xs text-white/60">The current draft stays in place until the AI response is ready.</p>
                    </div>
                  </div>
                ) : (
                <div className="space-y-3 text-sm text-white/75">
                  <p>{aiSummary}</p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Missing coverage</p>
                    {draftIssues.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-white/70">
                        {draftIssues.slice(0, 6).map((issue) => (
                          <li key={issue}>• {issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-emerald-200">All primary requirement sections are filled in.</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Suggested next steps</p>
                    <ul className="mt-2 space-y-1 text-xs text-white/70">
                      {draftSuggestions.length ? draftSuggestions.slice(0, 5).map((suggestion) => <li key={suggestion}>• {suggestion}</li>) : <li>• Requirement looks ready to lock.</li>}
                    </ul>
                  </div>
                </div>
                )}
              </section>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefining(false)}>Cancel</Button>
            {!studioLocked ? <Button onClick={handleSaveRefinement} className="bg-blue-600 text-white hover:bg-blue-500">Save Requirement</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLocking} onOpenChange={setIsLocking}>
        <DialogContent className="bg-[#0a1224] text-white border-blue-400/30">
          <DialogHeader>
            <DialogTitle>Lock Requirement</DialogTitle>
            <DialogDescription>
              Enter a password to lock this requirement. This action is reversible only by an admin.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <p className="font-medium text-white">Lock readiness: {readyToLock ? "Ready" : "Needs review"}</p>
            <p className="mt-1 text-xs text-white/60">Score {lockScore}% · Completeness {completeness.percent}%</p>
            {!readyToLock ? (
              <ul className="mt-2 space-y-1 text-xs text-amber-100/90">
                {lockMissing.slice(0, 4).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter lock password"
              className="bg-white/5"
            />
            <p className="text-xs text-white/60">This password will be required to unlock and edit later.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocking(false)}>Cancel</Button>
            <Button onClick={handleConfirmLock} className="bg-blue-600 text-white hover:bg-blue-500" disabled={!readyToLock || !password}>
              Confirm Lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnlocking} onOpenChange={setIsUnlocking}>
        <DialogContent className="bg-[#0a1224] text-white border-blue-400/30">
          <DialogHeader>
            <DialogTitle>Unlock Requirement</DialogTitle>
            <DialogDescription>
              Enter the password to unlock and allow editing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter lock password"
              className="bg-white/5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnlocking(false)}>Cancel</Button>
            <Button onClick={handleConfirmUnlock} className="bg-amber-500 text-white hover:bg-amber-400">Confirm Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
