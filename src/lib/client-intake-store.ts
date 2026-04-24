import { createRequirementsFromClientIntake } from "@/lib/requirements-store";
import { getClientAccessById } from "@/lib/collaboration-store";
import { getLeadById, updateLead, type LeadRecord, type LeadRequirements } from "@/lib/lead-store";
import { syncClientIntakeSubmissionToBackend } from "@/lib/client-intake-api";

export type IntakePriority = "low" | "medium" | "urgent";
export type IntakePackage = "basic" | "growth" | "premium";

export type ClientIntakeFile = {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  isImage?: boolean;
  previewUrl?: string;
};

export type ClientIntakeForm = {
  businessName: string;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  companySize: string;
  projectType: "Website" | "App" | "AI" | "CRM" | "Other";
  features: string[];
  ideaDescription: string;
  targetAudience: string;
  budget: number;
  deadline: string;
  priority: IntakePriority;
  selectedPackage: IntakePackage;
  uploadedFiles: ClientIntakeFile[];
  meetingSlot: string;
  termsAccepted: boolean;
  estimatedPrice: number;
  suggestionNotes: string[];
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

  return {
    features: form.features,
    budgetSummary: `${formatInr(form.budget)} to ${formatInr(form.estimatedPrice)}`,
    timelineSummary,
    prioritySummary,
    frontend: form.features.filter((item) => ["Dashboard", "Landing Page", "Mobile Responsive", "Admin Panel"].includes(item)),
    backend: form.features.filter((item) => ["Login/Auth", "Payment", "API Integration", "CRM Modules"].includes(item)),
    integrations: form.features.filter((item) => ["AI Assistant", "Analytics", "Notifications", "Payment"].includes(item)),
  };
};

const buildMeetingNotes = (form: ClientIntakeForm, aiSummary: string) => {
  return [
    `Business: ${form.businessName}`,
    `Industry: ${form.industry}`,
    `Project Type: ${form.projectType}`,
    `Target Audience: ${form.targetAudience}`,
    `Priority: ${form.priority}`,
    `Budget: ${formatInr(form.budget)} base, estimated ${formatInr(form.estimatedPrice)}`,
    `Deadline: ${form.deadline || "Not provided"}`,
    `Package: ${form.selectedPackage}`,
    `Features: ${form.features.join(", ") || "None selected"}`,
    `Assets: ${buildFileSummary(form.uploadedFiles)}`,
    `Files: ${summarizeUploadedFiles(form.uploadedFiles)}`,
    `Idea: ${form.ideaDescription}`,
    `Meeting Slot: ${form.meetingSlot || "Not selected"}`,
    `AI Summary: ${aiSummary}`,
  ].join("\n");
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

  if (lead) {
    const nextLead: LeadRecord = {
      ...lead,
      name: form.contactName || lead.name,
      company: form.businessName || lead.company,
      email: form.email || lead.email,
      phone: form.phone || lead.phone,
      project: form.projectType,
      projectDescription: form.ideaDescription,
      meetingNotes: buildMeetingNotes(form, aiSummary),
      requirements: buildLeadRequirements(form),
      notes: `${lead.notes}\nClient intake submitted on ${new Date().toLocaleString()}.`,
      lastActivity: "just now",
    };
    updateLead(nextLead);
  }

  createRequirementsFromClientIntake({
    leadId: lead?.id,
    leadName: lead?.name ?? form.contactName,
    company: form.businessName,
    projectType: form.projectType,
    features: form.features,
    uploadedFiles: form.uploadedFiles,
    targetAudience: form.targetAudience,
    ideaDescription: form.ideaDescription,
    priority: form.priority,
    budget: form.budget,
    estimatedPrice: form.estimatedPrice,
    deadline: form.deadline,
    selectedPackage: form.selectedPackage,
    aiSummary,
  });

  void syncClientIntakeSubmissionToBackend(submission);

  clearClientIntakeDraft(accessId);
  return submission;
};
