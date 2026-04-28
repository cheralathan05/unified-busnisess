import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
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

const DEFAULT_INTAKE_FORM: ClientIntakeForm = {
  businessName: "",
  industry: "",
  contactName: "",
  email: "",
  phone: "",
  companySize: "",
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
  const projectType = String(form.projectType ?? DEFAULT_INTAKE_FORM.projectType).toLowerCase();
  const goal = String(form.goal ?? "").trim() || "business growth";
  const roles = Array.isArray(form.userRoles) && form.userRoles.length ? form.userRoles.slice(0, 4).join(", ") : "Admin, Customer";
  const modules = Array.isArray(form.modules) && form.modules.length ? form.modules.slice(0, 5).join(", ") : "Dashboard, Profile, Settings";
  const features = Array.isArray(form.features) && form.features.length ? form.features.slice(0, 6).join(", ") : "Login/Auth, Analytics, API Integration";

  return `Build a ${projectType} solution for ${businessName} focused on ${goal}. Primary users: ${roles}. Key pages: ${modules}. Core capabilities: ${features}. Include API contracts, milestones, and measurable launch KPIs.`;
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
    Boolean(form.goal),
    Boolean(form.projectType),
    Boolean(form.features.length),
    Boolean(form.userRoles.length),
    Boolean(form.modules.length),
    Boolean(form.ideaDescription),
    Boolean(form.targetAudience),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const buildValidationIssues = (form: ClientIntakeForm) => {
  const issues: string[] = [];

  if (!form.goal.trim()) issues.push("Missing explicit product goal");
  if (!form.userRoles.length) issues.push("No user roles defined");
  if (!form.modules.length) issues.push("No modules/pages selected");
  if (!form.ideaDescription.trim()) issues.push("Description is empty");
  if (!form.features.some((item) => /api|integration|payment/i.test(item))) issues.push("Missing API or integration details");

  return issues;
};

const buildRefinementSuggestions = (form: ClientIntakeForm, issues: string[]) => {
  const suggestions = new Set<string>();
  issues.forEach((issue) => {
    if (/roles/i.test(issue)) suggestions.add("Define Admin and Customer roles");
    if (/api|integration/i.test(issue)) suggestions.add("Add API Integration or Payment scope");
    if (/modules/i.test(issue)) suggestions.add("Add Dashboard and Profile modules");
    if (/goal/i.test(issue)) suggestions.add("Write one measurable business goal");
    if (/description/i.test(issue)) suggestions.add("Expand use-cases in description");
  });

  if (form.features.includes("Payment") && !form.features.includes("Analytics")) {
    suggestions.add("Add Analytics to track payment conversion");
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
  const roleSummary = form.userRoles.length ? form.userRoles.join(", ") : "Admin and Customer";
  const moduleSummary = form.modules.length ? form.modules.join(", ") : "Dashboard and Profile";
  const featureSummary = form.features.length ? form.features.slice(0, 6).join(", ") : "Login/Auth and Analytics";

  return `${buildScopeSeedDescription(form)}\n\nRefined Scope: Expand the ${form.projectType} build for ${form.businessName || "the client"} with stronger workflow detail, delivery sequencing, and launch metrics. Primary roles: ${roleSummary}. Key modules/pages: ${moduleSummary}. Core capabilities: ${featureSummary}. Include API contracts, milestones, and measurable launch KPIs.`.trim();
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

export default function RequirementsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadRecord[]>(getLeads());
  const [intakeSubmissions, setIntakeSubmissions] = useState<ClientIntakeSubmission[]>(
    getClientIntakeSubmissions().map((item) => normalizeIntakeSubmission(item)),
  );
  const [search, setSearch] = useState("");
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [requirementBundle, setRequirementBundle] = useState<RequirementBundle | null>(null);
  const [isEditStudioOpen, setIsEditStudioOpen] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [editDraft, setEditDraft] = useState<ClientIntakeForm | null>(null);
  const [activeFeatureCategory, setActiveFeatureCategory] = useState<FeatureCategory>("Auth");
  const [featureSearch, setFeatureSearch] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [customModule, setCustomModule] = useState("");
  const [versionTimeline, setVersionTimeline] = useState<RefinementVersion[]>([]);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [lockConfirmPassword, setLockConfirmPassword] = useState("");
  const [lockOverride, setLockOverride] = useState(false);
  const [lockDialogError, setLockDialogError] = useState<string | null>(null);
  const [lockValidation, setLockValidation] = useState<RequirementLockValidation | null>(null);
  const [isLockSubmitting, setIsLockSubmitting] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockOverride, setUnlockOverride] = useState(false);
  const [unlockDialogError, setUnlockDialogError] = useState<string | null>(null);
  const [isUnlockSubmitting, setIsUnlockSubmitting] = useState(false);
  const currentSession = useMemo(() => getAuthSession(), []);
  const isAdmin = currentSession?.role === "admin";

  const normalizedSubmissions = useMemo(
    () => intakeSubmissions.map((item) => normalizeIntakeSubmission(item)),
    [intakeSubmissions],
  );

  const submittedEntries = useMemo(() => {
    const leadMap = new Map<number, LeadRecord>(leads.map((lead) => [lead.id, lead]));
    const groupedEntries = new Map<string, SubmittedLeadEntry>();

    normalizedSubmissions
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .forEach((submission) => {
        const hasLinkedLead = typeof submission.leadId === "number";
        const entryKey = hasLinkedLead ? `lead-${Number(submission.leadId)}` : `access-${submission.accessId}`;

        if (!groupedEntries.has(entryKey)) {
          const lead = hasLinkedLead
            ? (leadMap.get(Number(submission.leadId)) ?? toFallbackLead(submission))
            : toFallbackLead(submission);

          groupedEntries.set(entryKey, {
            key: entryKey,
            lead,
            submission,
            hasLinkedLead,
          });
        }
      });

    return Array.from(groupedEntries.values())
      .sort((a, b) => b.submission.submittedAt - a.submission.submittedAt);
  }, [normalizedSubmissions, leads]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return submittedEntries;

    return submittedEntries.filter(({ lead, submission }) => {
      const leadName = String(lead.name ?? "").toLowerCase();
      const leadCompany = String(lead.company ?? "").toLowerCase();
      const leadEmail = String(lead.email ?? "").toLowerCase();
      const submissionEmail = String(submission.form.email ?? "").toLowerCase();
      const submissionBusiness = String(submission.form.businessName ?? "").toLowerCase();

      return (
        leadName.includes(term) ||
        leadCompany.includes(term) ||
        leadEmail.includes(term) ||
        submissionEmail.includes(term) ||
        submissionBusiness.includes(term)
      );
    });
  }, [search, submittedEntries]);

  const selectedEntry = useMemo(
    () => filteredEntries.find((entry) => entry.key === selectedEntryKey) ?? null,
    [filteredEntries, selectedEntryKey],
  );

  const selectedSubmission = selectedEntry?.submission ?? null;
  const selectedDisplayLead = selectedEntry?.lead ?? null;
  const selectedLead = selectedEntry?.hasLinkedLead ? selectedEntry.lead : null;
  const hasLinkedLead = Boolean(selectedLead);
  const lifecycleStatus = getLifecycleStatus(requirementBundle, Boolean(selectedSubmission));
  const studioLocked = lifecycleStatus === "locked";
  const lockSnapshot = requirementBundle?.requirements?.lock ?? null;

  const completeness = useMemo(
    () => (selectedSubmission ? computeCompleteness(selectedSubmission, requirementBundle) : { percent: 0, missing: [] }),
    [selectedSubmission, requirementBundle],
  );

  const requirementBreakdown = useMemo(
    () => (selectedSubmission ? buildRequirementBreakdown(selectedSubmission, requirementBundle) : []),
    [selectedSubmission, requirementBundle],
  );

  const pipeline = useMemo(
    () => buildPipeline(lifecycleStatus, completeness.percent),
    [lifecycleStatus, completeness.percent],
  );

  const aiSummary = requirementBundle?.requirements?.summary || selectedSubmission?.aiSummary || "No AI summary available yet.";
  const lastUpdated = requirementBundle?.requirements?.updatedAt || selectedSubmission?.submittedAt;
  const aiConfidence = Math.max(55, Math.min(98, completeness.percent + (lifecycleStatus === "verified" ? 10 : 4)));
  const lockScore = lockSnapshot?.lockScore ?? Math.max(0, Math.min(100, completeness.percent + 8 - completeness.missing.length * 4));
  const lockMissing = lockSnapshot?.lockMissing?.length ? lockSnapshot.lockMissing : completeness.missing.slice(0, 4);
  const readyToLock = lockSnapshot?.readyToLock ?? (completeness.percent >= 85 && lockMissing.length === 0);
  const finalVersion = lockSnapshot?.lockedVersion ?? requirementBundle?.requirements?.version ?? 1;
  const accessRecord = useMemo(() => (selectedLead ? createOrGetClientAccessByLead(selectedLead) : null), [selectedLead]);

  const draftForm = useMemo(() => {
    if (editDraft) return normalizeIntakeForm(editDraft);
    if (selectedSubmission?.form) return normalizeIntakeForm(selectedSubmission.form);
    return null;
  }, [editDraft, selectedSubmission]);

  const studioIssues = useMemo(() => (draftForm ? buildValidationIssues(draftForm) : []), [draftForm]);

  const studioSuggestions = useMemo(
    () => (draftForm ? buildRefinementSuggestions(draftForm, studioIssues) : []),
    [draftForm, studioIssues],
  );

  const studioCompleteness = useMemo(() => (draftForm ? computeRefinementCompleteness(draftForm) : 0), [draftForm]);

  const studioTaskPreview = useMemo(() => (draftForm ? buildTaskPreview(draftForm) : { frontend: [], backend: [] }), [draftForm]);

  const studioGoalChecks = useMemo(() => (draftForm ? buildGoalAlignment(draftForm) : []), [draftForm]);

  const studioImpact = useMemo(() => {
    if (!selectedSubmission || !draftForm) {
      return {
        baseBudget: 0,
        nextBudget: 0,
        baseTimeline: 0,
        nextTimeline: 0,
        baseComplexity: "Low",
        nextComplexity: "Low",
      };
    }

    const baseBudget = estimateRefinedBudget(selectedSubmission.form);
    const nextBudget = estimateRefinedBudget(draftForm);
    const baseTimeline = estimateTimelineDays(selectedSubmission.form);
    const nextTimeline = estimateTimelineDays(draftForm);
    const baseComplexity = toComplexityLabel(estimateComplexityScore(selectedSubmission.form));
    const nextComplexity = toComplexityLabel(estimateComplexityScore(draftForm));

    return { baseBudget, nextBudget, baseTimeline, nextTimeline, baseComplexity, nextComplexity };
  }, [draftForm, selectedSubmission]);

  const studioChanges = useMemo(() => {
    if (!selectedSubmission || !draftForm) return [];

    const formatList = (values: string[]) => (values.length ? values.join(", ") : "Not defined");
    const rows = [
      {
        key: "Goal",
        before: selectedSubmission.form.goal || "Not defined",
        after: draftForm.goal || "Not defined",
      },
      {
        key: "Project Type",
        before: selectedSubmission.form.projectType,
        after: draftForm.projectType,
      },
      {
        key: "Features",
        before: formatList(selectedSubmission.form.features),
        after: formatList(draftForm.features),
      },
      {
        key: "User Roles",
        before: formatList(selectedSubmission.form.userRoles),
        after: formatList(draftForm.userRoles),
      },
      {
        key: "Modules / Pages",
        before: formatList(selectedSubmission.form.modules),
        after: formatList(draftForm.modules),
      },
      {
        key: "Description",
        before: selectedSubmission.form.ideaDescription || "Not defined",
        after: draftForm.ideaDescription || "Not defined",
      },
    ];

    return rows.filter((row) => row.before !== row.after);
  }, [draftForm, selectedSubmission]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLeadId = Number(params.get("leadId"));

    if (Number.isFinite(queryLeadId)) {
      const matchedByLead = submittedEntries.find((entry) => entry.hasLinkedLead && entry.lead.id === queryLeadId);
      if (matchedByLead) {
        setSelectedEntryKey(matchedByLead.key);
        return;
      }
    }

    if (!submittedEntries.length) {
      setSelectedEntryKey(null);
      return;
    }

    setSelectedEntryKey((current) => {
      if (current && submittedEntries.some((entry) => entry.key === current)) {
        return current;
      }
      return submittedEntries[0].key;
    });
  }, [submittedEntries]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const backend = await fetchBackendClientIntakeSubmissions();
      if (cancelled || !backend.length) return;

      setIntakeSubmissions((current) => {
        const merged = [...backend, ...current].map((item) => normalizeIntakeSubmission(item));
        const uniqueByScope = new Map<string, ClientIntakeSubmission>();

        merged
          .sort((a, b) => b.submittedAt - a.submittedAt)
          .forEach((item) => {
            const key = typeof item.leadId === "number" ? `lead-${item.leadId}` : `access-${item.accessId}`;
            if (!uniqueByScope.has(key)) {
              uniqueByScope.set(key, item);
            }
          });

        return Array.from(uniqueByScope.values());
      });

      setLeads(getLeads());
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBundle = async () => {
      if (!selectedLead) {
        setRequirementBundle(null);
        return;
      }

      try {
        const bundle = await fetchLeadRequirementBundle(selectedLead.id);
        if (!cancelled) setRequirementBundle(bundle);
      } catch {
        if (!cancelled) setRequirementBundle(null);
      }
    };

    void loadBundle();

    return () => {
      cancelled = true;
    };
  }, [selectedLead]);

  useEffect(() => {
    if (!selectedSubmission) {
      setEditDraft(null);
      setVersionTimeline([]);
      return;
    }

    setEditDraft(cloneForm(selectedSubmission.form));

    const store = getVersionStore();
    const versionKey = selectedEntry?.hasLinkedLead && selectedLead ? String(selectedLead.id) : `access-${selectedSubmission.accessId}`;
    const existingTimeline = store[versionKey];

    if (existingTimeline?.length) {
      setVersionTimeline(existingTimeline);
      return;
    }

    const initialVersion: RefinementVersion = {
      id: selectedSubmission.id,
      label: "v1 Client",
      editedAt: selectedSubmission.submittedAt,
      summary: selectedSubmission.form.goal || selectedSubmission.form.ideaDescription || "Initial client submission",
    };

    store[versionKey] = [initialVersion];
    saveVersionStore(store);
    setVersionTimeline([initialVersion]);
  }, [selectedEntry, selectedLead, selectedSubmission]);

  const handleSelectEntry = (entry: SubmittedLeadEntry) => {
    setSelectedEntryKey(entry.key);
    const url = new URL(window.location.href);

    if (entry.hasLinkedLead) {
      url.searchParams.set("leadId", String(entry.lead.id));
    } else {
      url.searchParams.delete("leadId");
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  };

  const handleRegenerate = async () => {
    if (!selectedLead) return;
    await regenerateLeadRequirements(selectedLead.id);
    const bundle = await fetchLeadRequirementBundle(selectedLead.id);
    setRequirementBundle(bundle);
    toast.success("AI requirement summary regenerated");
  };

  const handleLock = async () => {
    if (!selectedLead) return;

    setLockDialogError(null);
    setLockValidation({
      missing: lockMissing,
      lockScore,
      readyToLock,
      completionPercent: completeness.percent,
    });
    setLockPassword("");
    setLockConfirmPassword("");
    setLockOverride(false);
    setIsLockDialogOpen(true);
  };

  const submitLock = async (override = false) => {
    if (!selectedLead) return;

    if (!/^\d{4}$/.test(lockPassword)) {
      setLockDialogError("Lock password must be a 4-digit code");
      return;
    }

    if (lockPassword !== lockConfirmPassword) {
      setLockDialogError("Passwords do not match");
      return;
    }

    setIsLockSubmitting(true);
    setLockDialogError(null);

    try {
      await lockLeadRequirements(selectedLead.id, {
        password: lockPassword,
        confirmPassword: lockConfirmPassword,
        override,
      });

      const bundle = await fetchLeadRequirementBundle(selectedLead.id);
      setRequirementBundle(bundle);
      setIsLockDialogOpen(false);
      setLockPassword("");
      setLockConfirmPassword("");
      setLockOverride(false);
      toast.success("Requirement locked and version frozen");
    } catch (error) {
      const apiError = error as { status?: number; details?: any; message?: string };
      if (apiError.status === 409 && apiError.details) {
        setLockValidation({
          missing: Array.isArray(apiError.details.missing) ? apiError.details.missing : lockMissing,
          lockScore: Number(apiError.details.lockScore ?? lockScore),
          readyToLock: Boolean(apiError.details.readyToLock),
          completionPercent: Number(apiError.details.completionPercent ?? completeness.percent),
        });
        setLockDialogError("Review the missing items or enable override to continue.");
        setLockOverride(true);
        return;
      }

      setLockDialogError(apiError.message || "Failed to lock requirement");
        console.error("Lock error:", { error, selectedLeadId: selectedLead?.id, status: apiError.status });
      
        if (apiError.status === 404) {
          console.error("Requirement not found for leadId:", selectedLead?.id);
          setLockDialogError("Requirement not found. Please refresh and try again.");
        }
      } finally {
      setIsLockSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (!selectedLead) return;

    setUnlockDialogError(null);
    setUnlockPassword("");
    setUnlockOverride(false);
    setIsUnlockDialogOpen(true);
  };

  const submitUnlock = async (override = false) => {
    if (!selectedLead) return;

    if (!override && !unlockPassword) {
      setUnlockDialogError("Password is required");
      return;
    }

    setIsUnlockSubmitting(true);
    setUnlockDialogError(null);

    try {
      await unlockLeadRequirements(selectedLead.id, override ? { override: true } : { password: unlockPassword });
      const bundle = await fetchLeadRequirementBundle(selectedLead.id);
      setRequirementBundle(bundle);
      setIsUnlockDialogOpen(false);
      setUnlockPassword("");
      setUnlockOverride(false);
      toast.success(override ? "Requirement unlocked by admin" : "Requirement unlocked");
    } catch (error) {
      const apiError = error as { status?: number; details?: any; message?: string };
      if (apiError.status === 401 && apiError.details) {
        setUnlockDialogError(
          `Incorrect password. ${Number(apiError.details.failedAttempts ?? 0)}/${Number(apiError.details.maxAttempts ?? 3)} attempts used.`,
        );
        return;
      }

      if (apiError.status === 423 && apiError.details?.blockedUntil) {
        setUnlockDialogError("Unlock is temporarily blocked after repeated failed attempts.");
        return;
      }

      setUnlockDialogError(apiError.message || "Failed to unlock requirement");
    } finally {
      setIsUnlockSubmitting(false);
    }
  };

  const handleResendLink = async () => {
    if (!selectedLead) return;
    await resendClientLink({
      leadId: String(selectedLead.id),
      name: selectedLead.name,
      company: selectedLead.company,
      email: selectedLead.email,
    });
    toast.success("Client link resent");
  };

  const updateDraftField = <K extends keyof ClientIntakeForm>(key: K, value: ClientIntakeForm[K]) => {
    setEditDraft((current) => {
      if (!current) return current;
      return { ...current, [key]: value };
    });
  };

  const toggleDraftChip = (key: "features" | "userRoles" | "modules", value: string) => {
    setEditDraft((current) => {
      if (!current) return current;
      const exists = current[key].includes(value);
      const nextValues = exists ? current[key].filter((item) => item !== value) : [...current[key], value];
      return { ...current, [key]: nextValues };
    });
  };

  const addDraftChip = (key: "userRoles" | "modules", value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    setEditDraft((current) => {
      if (!current) return current;
      if (current[key].includes(cleanValue)) return current;
      return { ...current, [key]: [...current[key], cleanValue] };
    });
  };

  const handleOpenEditStudio = () => {
    if (!selectedSubmission) return;
    setEditDraft(cloneForm(selectedSubmission.form));
    setFeatureSearch("");
    setCustomRole("");
    setCustomModule("");
    setIsEditStudioOpen(true);
  };

  const handleCancelStudio = () => {
    if (selectedSubmission) {
      setEditDraft(cloneForm(selectedSubmission.form));
    }
    setIsEditStudioOpen(false);
  };

  const handleImproveDescription = async () => {
    if (!draftForm || studioLocked) return;

    setIsImprovingDescription(true);
    const localFallback = improveDescriptionDraft(draftForm);

    try {
      const result = await refineIntakeDescriptionWithAI({
        businessName: draftForm.businessName,
        projectType: draftForm.projectType,
        goal: draftForm.goal,
        description: draftForm.ideaDescription,
        userRoles: draftForm.userRoles,
        modules: draftForm.modules,
        features: draftForm.features,
      });

      const refined = normalizeIdeaDescription({ ...draftForm, ideaDescription: String(result?.description || "") }) || localFallback;

      updateDraftField("ideaDescription", refined);
      toast.success("Scope rewritten with AI");
    } catch (error) {
      console.error("AI description refinement failed:", error);
      updateDraftField("ideaDescription", localFallback);
      toast("Live AI was unavailable, so a premium local rewrite was applied.");
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleAutoFixStudio = () => {
    if (!draftForm || studioLocked) return;

    setEditDraft((current) => {
      if (!current) return current;
      const next = cloneForm(current);

      if (!next.goal.trim()) {
        next.goal = `Increase growth through ${next.projectType.toLowerCase()} launch`;
      }
      if (!next.userRoles.length) {
        next.userRoles = ["Admin", "Customer"];
      }
      if (!next.modules.length) {
        next.modules = ["Home", "Dashboard", "Profile"];
      }
      if (!next.features.some((item) => /api|integration/i.test(item))) {
        next.features = [...next.features, "API Integration"];
      }
      if (!next.targetAudience.trim()) {
        next.targetAudience = next.userRoles.join(" + ");
      }

      return next;
    });

    toast.success("Smart auto-fix applied");
  };

  const persistVersionTimeline = (versions: RefinementVersion[]) => {
    if (!selectedSubmission) return;
    const store = getVersionStore();
    const versionKey = selectedEntry?.hasLinkedLead && selectedLead ? String(selectedLead.id) : `access-${selectedSubmission.accessId}`;
    store[versionKey] = versions;
    saveVersionStore(store);
    setVersionTimeline(versions);
  };

  const handleSaveStudio = async (asNewVersion: boolean) => {
    if (!selectedSubmission || !draftForm) return;

    const summary = buildStudioSummary(draftForm, studioCompleteness, studioIssues);
    const updated = updateClientIntakeSubmission({
      submissionId: selectedSubmission.id,
      form: draftForm,
      aiSummary: summary,
      asNewVersion,
    });

    if (!updated) {
      toast.error("Failed to save refinement changes");
      return;
    }

    const nextVersions = [
      ...versionTimeline,
      {
        id: updated.id,
        label: `v${versionTimeline.length + 1} ${asNewVersion ? "Current" : "Edited"}`,
        editedAt: updated.submittedAt,
        summary: updated.form.goal || "Scope refined",
      },
    ];

    persistVersionTimeline(nextVersions);
    setLeads(getLeads());
    setIntakeSubmissions(getClientIntakeSubmissions());

    if (selectedLead) {
      try {
        const bundle = await fetchLeadRequirementBundle(selectedLead.id);
        setRequirementBundle(bundle);
      } catch {
        setRequirementBundle(null);
      }
    }

    setIsEditStudioOpen(false);
    toast.success(asNewVersion ? "Saved as new requirement version" : "Requirement changes saved");
  };

  const handleGenerateTasks = () => {
    if (!selectedLead) return;
    const project = createProjectFromLead(selectedLead);
    toast.success("Tasks generated from requirement");
    navigate(`/project/${project.id}`);
  };

  const handleConvertToProject = () => {
    if (!selectedLead) return;
    const project = createProjectFromLead(selectedLead);
    toast.success("Requirement converted to project");
    navigate(`/project/${project.id}`);
  };

  return (
    <DashboardLayout>
      <div className="relative mx-auto max-w-7xl space-y-6 overflow-hidden pb-14">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        {!submittedEntries.length ? (
          <section className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,20,39,0.95),rgba(6,13,27,0.9))] p-12 text-center shadow-[0_25px_80px_rgba(0,0,0,0.4)]">
            <Users className="mx-auto mb-3 h-10 w-10 text-white/50" />
            <h1 className="text-2xl font-semibold text-white">No client submissions yet</h1>
            <p className="mt-2 text-sm text-white/70">Requirement Command Center only shows submitted client records.</p>
            <Button className="mt-6 bg-blue-600 text-white hover:bg-blue-500" onClick={() => navigate("/leads")}>Go to Leads</Button>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(12,25,48,0.95),rgba(8,17,35,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/85">Requirement Command Center</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Client Intake Records</h2>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company or email"
                    className="border-cyan-300/25 bg-white/5 pl-9 text-white placeholder:text-white/45"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {filteredEntries.map((entry) => {
                  const { lead, submission } = entry;
                  const active = selectedEntryKey === entry.key;
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => handleSelectEntry(entry)}
                      className={`min-w-[250px] rounded-2xl border px-4 py-3 text-left transition ${
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
                })}
              </div>
            </section>
            {!selectedSubmission ? null : (
              <>
                <section className="sticky top-3 z-30 rounded-2xl border border-blue-400/30 bg-[#0a1429]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur">
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
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/70">No assets uploaded.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-7">
                  <h2 className="text-xl font-semibold text-white">Meeting + AI Insights</h2>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-blue-200">AI Summary</p>
                      <p className="mt-2 text-sm text-white/85">{aiSummary}</p>
                      <p className="mt-4 flex items-center gap-2 text-xs text-white/65"><Clock3 className="h-3.5 w-3.5" /> Meeting: {selectedSubmission.form.meetingSlot || formatDateTime(requirementBundle?.meeting?.dateTime)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-blue-200">Missing + Suggestion</p>
                      <div className="mt-2 space-y-1 text-sm text-white/85">
                        {completeness.missing.length ? (
                          completeness.missing.slice(0, 4).map((item) => <p key={item}>- {item}</p>)
                        ) : (
                          <p>- No major missing items detected.</p>
                        )}
                      </div>
                      <p className="mt-4 text-sm text-white/80">
                        Suggestion: {completeness.missing.some((item) => /api/i.test(item))
                          ? "Start with frontend + mock API, then finalize backend contract."
                          : "Generate tasks and start frontend implementation immediately."}
                      </p>
                    </div>
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
                      Access: {accessRecord?.id || "Not available"} · Intake link: {selectedLead ? getClientIntakeLinkForLead(selectedLead).replace(/^https?:\/\//, "") : "Not available"}
                    </p>
                    <p className="mt-1 flex items-center gap-2"><Bot className="h-3.5 w-3.5" /> Last AI refresh: {formatRelativeTime(lastUpdated)}</p>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>

      {isEditStudioOpen && selectedSubmission && draftForm ? (
        <div className="fixed inset-0 z-50 bg-[#020710]/95 p-3 backdrop-blur md:p-6">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-blue-300/25 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(8,18,36,0.96)_55%)] shadow-[0_25px_90px_rgba(0,0,0,0.55)]">
            <div className="border-b border-blue-300/20 px-4 py-4 md:px-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-200/75">Requirement Refinement Studio</p>
                  <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">Improve Scope Before Delivery</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {versionTimeline.map((version) => (
                    <Badge key={version.id} variant="outline" className="border-blue-300/30 bg-blue-500/10 text-blue-100">
                      <GitBranch className="mr-1 h-3 w-3" /> {version.label}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void handleSaveStudio(false)}
                    disabled={studioLocked}
                    className="bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => void handleSaveStudio(true)}
                    disabled={studioLocked}
                    variant="outline"
                    className="border-blue-300/35 bg-blue-500/10 text-white hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save as New Version
                  </Button>
                  <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleCancelStudio}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr] lg:p-6">
              <div className="space-y-4 overflow-y-auto pr-1">
                {studioLocked ? (
                  <section className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-4 text-amber-100">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Lock className="h-4 w-4" /> Editing disabled (Requirement locked)
                    </p>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100">Core Info</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Input
                      value={draftForm.businessName}
                      onChange={(e) => updateDraftField("businessName", e.target.value)}
                      disabled={studioLocked}
                      placeholder="Business name"
                      className="border-white/20 bg-white/5 text-white"
                    />
                    <Input
                      value={draftForm.projectType}
                      onChange={(e) => updateDraftField("projectType", e.target.value as ClientIntakeForm["projectType"])}
                      disabled={studioLocked}
                      placeholder="Project type"
                      className="border-white/20 bg-white/5 text-white"
                    />
                  </div>
                  <Input
                    value={draftForm.goal}
                    onChange={(e) => updateDraftField("goal", e.target.value)}
                    disabled={studioLocked}
                    placeholder="Goal"
                    className="mt-3 border-white/20 bg-white/5 text-white"
                  />
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100">Features</h3>
                    <Input
                      value={featureSearch}
                      onChange={(e) => setFeatureSearch(e.target.value)}
                      placeholder="Search features"
                      className="h-8 w-full border-white/20 bg-white/5 text-white sm:w-52"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Object.keys(FEATURE_LIBRARY) as FeatureCategory[]).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveFeatureCategory(category)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          activeFeatureCategory === category
                            ? "border-blue-300/60 bg-blue-500/30 text-white"
                            : "border-white/20 bg-white/5 text-white/75 hover:border-blue-300/40"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {FEATURE_LIBRARY[activeFeatureCategory]
                      .filter((feature) => feature.toLowerCase().includes(featureSearch.trim().toLowerCase()))
                      .map((feature) => {
                        const active = draftForm.features.includes(feature);
                        return (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => toggleDraftChip("features", feature)}
                            disabled={studioLocked}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              active
                                ? "border-blue-300/60 bg-blue-500/30 text-white"
                                : "border-white/20 bg-white/5 text-white/75 hover:border-blue-300/35"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {feature}
                          </button>
                        );
                      })}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100">User Roles</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ROLE_PRESETS.map((role) => {
                      const active = draftForm.userRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleDraftChip("userRoles", role)}
                          disabled={studioLocked}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            active
                              ? "border-emerald-300/50 bg-emerald-500/25 text-white"
                              : "border-white/20 bg-white/5 text-white/75 hover:border-emerald-300/35"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {role}
                        </button>
                      );
                    })}
                    {draftForm.userRoles
                      .filter((role) => !ROLE_PRESETS.includes(role))
                      .map((role) => (
                        <Badge key={role} variant="outline" className="border-emerald-300/40 bg-emerald-500/20 text-emerald-100">
                          {role}
                        </Badge>
                      ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      disabled={studioLocked}
                      placeholder="Custom role"
                      className="border-white/20 bg-white/5 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                      disabled={studioLocked}
                      onClick={() => {
                        addDraftChip("userRoles", customRole);
                        setCustomRole("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100">Modules / Pages</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MODULE_PRESETS.map((moduleName) => {
                      const active = draftForm.modules.includes(moduleName);
                      return (
                        <button
                          key={moduleName}
                          type="button"
                          onClick={() => toggleDraftChip("modules", moduleName)}
                          disabled={studioLocked}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            active
                              ? "border-cyan-300/50 bg-cyan-500/25 text-white"
                              : "border-white/20 bg-white/5 text-white/75 hover:border-cyan-300/35"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {moduleName}
                        </button>
                      );
                    })}
                    {draftForm.modules
                      .filter((moduleName) => !MODULE_PRESETS.includes(moduleName))
                      .map((moduleName) => (
                        <Badge key={moduleName} variant="outline" className="border-cyan-300/40 bg-cyan-500/20 text-cyan-100">
                          {moduleName}
                        </Badge>
                      ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customModule}
                      onChange={(e) => setCustomModule(e.target.value)}
                      disabled={studioLocked}
                      placeholder="Add page"
                      className="border-white/20 bg-white/5 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                      disabled={studioLocked}
                      onClick={() => {
                        addDraftChip("modules", customModule);
                        setCustomModule("");
                      }}
                    >
                      Add Page
                    </Button>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-100">Description</h3>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-300/35 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20"
                      onClick={handleImproveDescription}
                      disabled={studioLocked || isImprovingDescription}
                    >
                      <Sparkles className="mr-2 h-4 w-4" /> {isImprovingDescription ? "Improving..." : "Improve description"}
                    </Button>
                  </div>
                  <Textarea
                    value={draftForm.ideaDescription}
                    onChange={(e) => updateDraftField("ideaDescription", e.target.value)}
                    disabled={studioLocked}
                    placeholder="Describe project scope"
                    className="mt-3 min-h-[150px] border-white/20 bg-white/5 text-white"
                  />
                </section>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1">
                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-blue-100">Impact Analysis</p>
                  <div className="mt-3 space-y-2 text-sm text-white/85">
                    <p>Budget: {formatCurrency(studioImpact.baseBudget)} → {formatCurrency(studioImpact.nextBudget)}</p>
                    <p>Timeline: {studioImpact.baseTimeline} → {studioImpact.nextTimeline} days</p>
                    <p>Complexity: {studioImpact.baseComplexity} → {studioImpact.nextComplexity}</p>
                  </div>
                </section>

                <section className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                    <AlertTriangle className="h-4 w-4" /> Validation
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-amber-50/95">
                    {studioIssues.length ? studioIssues.map((issue) => <p key={issue}>- {issue}</p>) : <p>- No critical validation issues.</p>}
                  </div>
                </section>

                <section className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-5">
                  <p className="text-sm font-semibold text-emerald-100">Smart Suggestions</p>
                  <div className="mt-3 space-y-1 text-sm text-emerald-50/95">
                    {studioSuggestions.length ? studioSuggestions.map((item) => <p key={item}>✔ {item}</p>) : <p>✔ Scope already looks healthy.</p>}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 border-emerald-300/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                    onClick={handleAutoFixStudio}
                    disabled={studioLocked}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Fix issues automatically
                  </Button>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-blue-100">Completeness Score</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${studioCompleteness}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-white/85">Completion: {studioCompleteness}%</p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-blue-100">Change Highlighting</p>
                  <div className="mt-3 space-y-2 text-sm text-white/85">
                    {studioChanges.length ? (
                      studioChanges.map((change) => (
                        <p key={change.key}>
                          <span className="text-blue-100">{change.key}:</span> {change.before} → {change.after}
                        </p>
                      ))
                    ) : (
                      <p>No changes yet.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-blue-100">Live Task Preview</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/60">Frontend</p>
                      <div className="mt-1 space-y-1 text-sm text-white/85">
                        {studioTaskPreview.frontend.length ? studioTaskPreview.frontend.map((item) => <p key={item}>+ {item}</p>) : <p>+ Baseline UI tasks</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/60">Backend</p>
                      <div className="mt-1 space-y-1 text-sm text-white/85">
                        {studioTaskPreview.backend.length ? studioTaskPreview.backend.map((item) => <p key={item}>+ {item}</p>) : <p>+ Baseline API tasks</p>}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-blue-100">Goal Alignment Check</p>
                  <div className="mt-3 space-y-1 text-sm text-white/85">
                    {studioGoalChecks.map((item) => (
                      <p key={item.label} className="flex items-start gap-2">
                        {item.ok ? <Check className="mt-0.5 h-4 w-4 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />}
                        <span>{item.label}</span>
                      </p>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <DialogContent className="max-w-2xl border border-blue-300/20 bg-[#0a1224] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Lock className="h-4 w-4" /> Lock this requirement?
            </DialogTitle>
            <DialogDescription className="text-white/70">
              This freezes the current requirement as the final execution version. Editing will be disabled after lock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/50">Completion</p>
                <p className="mt-1 font-semibold text-white">{lockValidation?.completionPercent ?? completeness.percent}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/50">Lock score</p>
                <p className="mt-1 font-semibold text-white">{lockValidation?.lockScore ?? lockScore}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-4 text-amber-50">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" /> Missing checks
              </p>
              <div className="mt-2 space-y-1 text-sm text-amber-50/90">
                {(lockValidation?.missing.length ? lockValidation.missing : lockMissing).length ? (
                  (lockValidation?.missing.length ? lockValidation.missing : lockMissing).map((item) => <p key={item}>- {item}</p>)
                ) : (
                  <p>- No blockers detected</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-white/70">Password</p>
                <Input
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  placeholder="4-digit code"
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-white/70">Confirm password</p>
                <Input
                  value={lockConfirmPassword}
                  onChange={(e) => setLockConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  placeholder="Confirm code"
                  className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <Checkbox checked={lockOverride} onCheckedChange={(checked) => setLockOverride(Boolean(checked))} />
              <span>
                Override warnings and lock anyway
                <span className="block text-xs text-white/55">Use this when the validation panel shows non-blocking gaps.</span>
              </span>
            </label>

            {lockDialogError ? <p className="text-sm text-rose-300">{lockDialogError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setIsLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-500"
              onClick={() => void submitLock(lockOverride)}
              disabled={isLockSubmitting}
            >
              {isLockSubmitting ? "Locking..." : "Lock Requirement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <DialogContent className="max-w-2xl border border-amber-300/20 bg-[#0a1224] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Lock className="h-4 w-4" /> Unlock requirement?
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Unlocking re-opens editing and may affect project and task generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p>Failed attempts: {lockSnapshot?.unlockFailedAttempts ?? 0}/3</p>
              <p className="mt-1">Blocked until: {lockSnapshot?.unlockBlockedUntil ? formatDateTime(lockSnapshot.unlockBlockedUntil) : "Not blocked"}</p>
            </div>

            {isAdmin ? (
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                <Checkbox checked={unlockOverride} onCheckedChange={(checked) => setUnlockOverride(Boolean(checked))} />
                <span>
                  Admin override without password
                  <span className="block text-xs text-white/55">Use only when you need to restore editing quickly.</span>
                </span>
              </label>
            ) : null}

            <div>
              <p className="mb-2 text-sm text-white/70">Password</p>
              <Input
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                disabled={unlockOverride}
                type="password"
                placeholder="Enter lock password"
                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {unlockDialogError ? <p className="text-sm text-rose-300">{unlockDialogError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setIsUnlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 text-white hover:bg-amber-400"
              onClick={() => void submitUnlock(unlockOverride)}
              disabled={isUnlockSubmitting}
            >
              {isUnlockSubmitting ? "Unlocking..." : unlockOverride ? "Unlock as Admin" : "Unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
