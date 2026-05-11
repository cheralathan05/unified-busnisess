import { createRequirementsFromClientIntake } from "@/lib/requirements-store";
import { getClientAccessById } from "@/lib/collaboration-store";
import { getLeadById, updateLead, type LeadRecord, type LeadRequirements } from "@/lib/lead-store";
import { syncClientIntakeSubmissionToBackend } from "@/lib/client-intake-api";

export type IntakePriority = "low" | "medium" | "urgent";
export type IntakePackage = "basic" | "growth" | "premium";
export type BudgetChip = "under50k" | "50kto2l" | "2lto5l" | "5lplus";
export type ProjectUrgency = "flexible" | "normal" | "fast-track" | "emergency";
export type BudgetFlexibility = "fixed" | "flexible" | "recommendation";

export type ClientIntakeFile = {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  isImage?: boolean;
  previewUrl?: string;
};

export type CostBreakdownItem = {
  category: string;
  amount: number;
};

export type TeamMember = {
  role: string;
  count: number;
};

export type PaymentSchedule = {
  advance: number;
  midway: number;
  final: number;
};

export type AuthType = "Email Login" | "Google Login" | "OTP Login" | "Social Login" | "Multi-role Access";
export type PaymentGateway = "Razorpay" | "Stripe" | "PayPal" | "Subscription" | "One-time Payment";
export type PaymentType = "One-time" | "Subscription" | "Marketplace Payments";

export type ClientIntakeForm = {
  businessName: string;
  industry: string;
  businessWebsite: string;
  country: string;
  timezone: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  preferredContactMethod: "Email" | "WhatsApp" | "Phone" | "Google Meet";
  companySize: string;
  businessStage: "Startup" | "Growing Business" | "Enterprise" | "Agency" | "Personal Brand";
  launchUrgency: "ASAP" | "1 Month" | "3 Months" | "Flexible";
  projectType: "Website" | "Mobile App" | "Web App" | "SaaS Platform" | "Admin Panel" | "AI" | "Marketplace" | "CRM" | "ERP" | "Other";
  goal: string;
  features: string[];
  userRoles: string[];
  modules: string[];
  ideaDescription: string;
  targetAudience: string;
  workflow?: string;
  budget: number;
  budgetChip?: BudgetChip;
  budgetFlexibility?: BudgetFlexibility;
  deadline: string;
  projectUrgency?: ProjectUrgency;
  priority: IntakePriority;
  selectedPackage: IntakePackage;
  uploadedFiles: ClientIntakeFile[];
  meetingSlot: string;
  termsAccepted: boolean;
  estimatedPrice: number;
  estimatedDeliveryWeeks?: number;
  costBreakdown?: CostBreakdownItem[];
  recommendedTeam?: TeamMember[];
  paymentPlan?: PaymentSchedule;
  suggestionNotes: string[];
  authenticationTypes?: AuthType[];
  paymentGateway?: PaymentGateway | "";
  paymentType?: PaymentType | "";
  adminPermissions?: string[];
  adminFeatures?: string[];
  thirdPartyIntegrations?: string[];
  referenceWebsites?: string[];
  aiFeaturesNeeded?: string[];
};

export type ClientIntakeSubmission = {
  id: string;
  accessId: string;
  leadId?: number;
  leadName: string;
  submittedAt: number;
  aiSummary: string;
  form: ClientIntakeForm;
};

type UpdateClientIntakeSubmissionInput = {
  submissionId: string;
  form: ClientIntakeForm;
  aiSummary: string;
  asNewVersion?: boolean;
};

const DRAFT_KEY = "ai-project-os.client-intake-drafts";
const SUBMISSION_KEY = "ai-project-os.client-intake-submissions";

const safeRead = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const formatInr = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const buildFileSummary = (files: ClientIntakeFile[]) => {
  if (!files.length) return "No files uploaded";

  const images = files.filter((file) => file.isImage || file.type.startsWith("image/")).length;
  const documents = files.length - images;
  const summaryParts = [
    `${files.length} file${files.length === 1 ? "" : "s"}`,
    `${images} image${images === 1 ? "" : "s"}`,
    documents > 0 ? `${documents} document${documents === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return summaryParts.join(", ");
};

const summarizeUploadedFiles = (files: ClientIntakeFile[]) => {
  if (!files.length) return "No design references or supporting files uploaded.";

  return files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(", ");
};

const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
};

export const normalizeClientIntakeFiles = async (incoming: FileList | File[]) => {
  const files = Array.from(incoming);

  return Promise.all(
    files.map(async (file) => {
      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? await readFileAsDataUrl(file) : undefined;

      return {
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        lastModified: file.lastModified,
        isImage,
        previewUrl,
      } satisfies ClientIntakeFile;
    }),
  );
};

const buildLeadRequirements = (form: ClientIntakeForm): LeadRequirements => {
  const timelineSummary = form.deadline ? `Deadline ${new Date(form.deadline).toLocaleDateString()}` : "Timeline to be finalized";
  const prioritySummary = form.priority === "urgent" ? "Urgent" : form.priority === "medium" ? "Medium" : "Low";
  const frontend = [
    ...form.modules.filter((item) => ["Home", "Dashboard", "Profile", "Checkout", "Landing Page", "Settings"].includes(item)),
    ...form.features.filter((item) => ["Dashboard", "Landing Page", "Mobile Responsive", "Admin Panel"].includes(item)),
  ];
  const backend = [
    ...form.features.filter((item) => ["Login/Auth", "Payment", "API Integration", "CRM Modules"].includes(item)),
    ...form.userRoles.filter((item) => ["Admin", "Staff", "Vendor"].includes(item)).map((role) => `${role} access control`),
  ];
  const integrations = form.features.filter((item) => ["AI Assistant", "Analytics", "Notifications", "Payment", "API Integration"].includes(item));
  const workflowLine = form.workflow?.trim() ? [`Workflow: ${form.workflow.trim()}`] : [];
  const thirdParty = Array.isArray(form.thirdPartyIntegrations) && form.thirdPartyIntegrations.length
    ? form.thirdPartyIntegrations.map((item) => `Integration: ${item}`)
    : [];

  return {
    features: [...form.features, ...form.modules, ...form.userRoles, ...workflowLine, ...thirdParty],
    budgetSummary: `${formatInr(form.budget)} to ${formatInr(form.estimatedPrice)}`,
    timelineSummary,
    prioritySummary,
    frontend,
    backend,
    integrations,
  };
};

const buildMeetingNotes = (form: ClientIntakeForm, aiSummary: string) => {
  return [
    `Prepared for: ${form.contactName}${form.contactRole ? `, ${form.contactRole}` : ""}`,
    `Business: ${form.businessName}`,
    `Industry: ${form.industry}`,
    `Website: ${form.businessWebsite || "Not provided"}`,
    `Country: ${form.country || "Not provided"}`,
    `Timezone: ${form.timezone || "Not provided"}`,
    `Project Type: ${form.projectType}`,
    `Target Audience: ${form.targetAudience}`,
    `Workflow: ${form.workflow?.trim() || "Not provided"}`,
    `Priority: ${form.priority}`,
    `Business Stage: ${form.businessStage || "Not provided"}`,
    `Launch Urgency: ${form.launchUrgency || "Not provided"}`,
    `Preferred Contact Method: ${form.preferredContactMethod || "Not provided"}`,
    `Goal: ${form.goal || "Not specified"}`,
    `User Roles: ${form.userRoles.join(", ") || "Not specified"}`,
    `Modules / Pages: ${form.modules.join(", ") || "Not specified"}`,
    `Budget: ${formatInr(form.budget)} base, estimated ${formatInr(form.estimatedPrice)}`,
    `Deadline: ${form.deadline || "Not provided"}`,
    `Package: ${form.selectedPackage}`,
    `Features: ${form.features.join(", ") || "None selected"}`,
    `Assets: ${buildFileSummary(form.uploadedFiles)}`,
    `Files: ${summarizeUploadedFiles(form.uploadedFiles)}`,
    `Idea: ${form.ideaDescription}`,
    `Meeting Slot: ${form.meetingSlot || "Not selected"}`,
    `Authentication: ${Array.isArray(form.authenticationTypes) ? form.authenticationTypes.join(", ") : form.authenticationTypes || "Not provided"}`,
    `Payment Gateway: ${form.paymentGateway || "Not provided"}`,
    `Payment Type: ${form.paymentType || "Not provided"}`,
    `Admin Permissions: ${Array.isArray(form.adminPermissions) ? form.adminPermissions.join(", ") : "None"}`,
    `Admin Features: ${Array.isArray(form.adminFeatures) ? form.adminFeatures.join(", ") : "None"}`,
    `Integrations: ${Array.isArray(form.thirdPartyIntegrations) ? form.thirdPartyIntegrations.join(", ") : "None"}`,
    `References: ${Array.isArray(form.referenceWebsites) ? form.referenceWebsites.join(", ") : "None"}`,
    `AI Features: ${Array.isArray(form.aiFeaturesNeeded) ? form.aiFeaturesNeeded.join(", ") : "None"}`,
    `AI Summary: ${aiSummary}`,
  ].join("\n");
};

const syncSubmissionToLeadAndRequirements = (submission: ClientIntakeSubmission) => {
  if (submission.leadId === undefined) {
    return;
  }

  const lead = getLeadById(submission.leadId);
  if (lead) {
    const nextLead: LeadRecord = {
      ...lead,
      name: submission.form.contactName || lead.name,
      company: submission.form.businessName || lead.company,
      email: submission.form.email || lead.email,
      phone: submission.form.phone || lead.phone,
      project: submission.form.projectType,
      projectDescription: submission.form.ideaDescription,
      meetingNotes: buildMeetingNotes(submission.form, submission.aiSummary),
      requirements: buildLeadRequirements(submission.form),
      notes: `${lead.notes}\nRequirement refined on ${new Date().toLocaleString()}.`,
      lastActivity: "just now",
    };
    updateLead(nextLead);
  }

  createRequirementsFromClientIntake({
    leadId: submission.leadId,
    leadName: submission.leadName || submission.form.contactName,
    company: submission.form.businessName,
    projectType: submission.form.projectType,
    goal: submission.form.goal,
    features: submission.form.features,
    userRoles: submission.form.userRoles,
    modules: submission.form.modules,
    uploadedFiles: submission.form.uploadedFiles,
    targetAudience: submission.form.targetAudience,
    ideaDescription: submission.form.ideaDescription,
    priority: submission.form.priority,
    budget: submission.form.budget,
    estimatedPrice: submission.form.estimatedPrice,
    deadline: submission.form.deadline,
    selectedPackage: submission.form.selectedPackage,
    aiSummary: submission.aiSummary,
  });
};

export const getClientIntakeDraft = (accessId: string) => {
  const drafts = safeRead<Record<string, ClientIntakeForm>>(DRAFT_KEY, {});
  return drafts[accessId];
};

export const saveClientIntakeDraft = (accessId: string, form: ClientIntakeForm) => {
  const drafts = safeRead<Record<string, ClientIntakeForm>>(DRAFT_KEY, {});
  drafts[accessId] = form;
  safeWrite(DRAFT_KEY, drafts);
};

export const clearClientIntakeDraft = (accessId: string) => {
  const drafts = safeRead<Record<string, ClientIntakeForm>>(DRAFT_KEY, {});
  if (!drafts[accessId]) return;
  delete drafts[accessId];
  safeWrite(DRAFT_KEY, drafts);
};

export const getClientIntakeSubmissions = () => {
  return safeRead<ClientIntakeSubmission[]>(SUBMISSION_KEY, []).sort((a, b) => b.submittedAt - a.submittedAt);
};

export const submitClientIntake = (accessId: string, form: ClientIntakeForm, aiSummary: string) => {
  const access = getClientAccessById(accessId);
  const lead = access ? getLeadById(access.leadId) : undefined;

  const submission: ClientIntakeSubmission = {
    id: `intake-${Date.now()}`,
    accessId,
    leadId: lead?.id,
    leadName: lead?.name ?? form.contactName,
    submittedAt: Date.now(),
    aiSummary,
    form,
  };

  const existing = getClientIntakeSubmissions();
  safeWrite(
    SUBMISSION_KEY,
    [
      submission,
      ...existing.filter((item) => {
        if (submission.leadId !== undefined && item.leadId !== undefined) {
          return item.leadId !== submission.leadId;
        }
        return item.accessId !== accessId;
      }),
    ],
  );

  syncSubmissionToLeadAndRequirements(submission);

  void syncClientIntakeSubmissionToBackend(submission);

  clearClientIntakeDraft(accessId);
  return submission;
};

export const updateClientIntakeSubmission = ({
  submissionId,
  form,
  aiSummary,
  asNewVersion = false,
}: UpdateClientIntakeSubmissionInput) => {
  const existing = getClientIntakeSubmissions();
  const current = existing.find((item) => item.id === submissionId);

  if (!current) return null;

  const now = Date.now();
  const updated: ClientIntakeSubmission = {
    ...current,
    id: asNewVersion ? `intake-${now}` : current.id,
    submittedAt: now,
    aiSummary,
    form,
  };

  safeWrite(
    SUBMISSION_KEY,
    [updated, ...existing.filter((item) => item.id !== current.id)],
  );

  syncSubmissionToLeadAndRequirements(updated);
  void syncClientIntakeSubmissionToBackend(updated);

  return updated;
};
