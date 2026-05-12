import { getAuthSession } from "@/lib/auth-store";
import type { ClientIntakeForm, ClientIntakeSubmission } from "@/lib/client-intake-store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

class ClientIntakeApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ClientIntakeApiError";
    this.status = status;
    this.details = details;
  }
}

type BackendIntakeSubmission = {
  id: string;
  leadId?: string | number;
  aiSummary?: string;
  createdAt?: string | number;
  formData?: Partial<ClientIntakeForm> & {
    businessName?: string;
    contactName?: string;
    contactRole?: string;
    email?: string;
    goal?: string;
    userRoles?: string[];
    modules?: string[];
    targetAudience?: string;
    preferredContactMethod?: ClientIntakeForm["preferredContactMethod"];
    businessStage?: ClientIntakeForm["businessStage"];
    launchUrgency?: ClientIntakeForm["launchUrgency"];
    priority?: ClientIntakeForm["priority"];
    selectedPackage?: ClientIntakeForm["selectedPackage"];
    suggestionNotes?: string[];
  };
  lead?: {
    id?: string | number;
    name?: string;
    company?: string;
  };
};

export type ClientLinkPayload = {
  leadId: string;
  name?: string;
  company?: string;
  email?: string;
};

export type ClientLinkResponse = {
  leadId: string;
  token: string;
  link: string;
  status: "pending" | "completed" | "expired";
  expiresAt: string;
};

export type ClientLinkRecord = {
  id: string;
  leadId: string;
  token: string;
  status: "pending" | "completed" | "expired";
  expiresAt: string;
  email?: string;
};

export type RequirementBundle = {
  lead: {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    stage: string;
    score: number;
    budget: number;
  };
  intake: {
    id: string;
    leadId: string;
    businessName: string;
    industry: string;
    contactName: string;
    email: string;
    phone: string;
    projectType: string;
    features: string[];
    description: string;
    budget: number;
    timeline: string;
    package: string;
    files: Array<{ name: string; size?: number; type?: string; previewUrl?: string; isImage?: boolean }>;
    meetingSlot: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  files: Array<{ name: string; size?: number; type?: string; previewUrl?: string; isImage?: boolean }>;
  requirements: {
    id: string;
    leadId: string;
    summary: string;
    features: string[];
    modules: string[];
    analysis: Record<string, unknown>;
    status: string;
    locked: boolean;
    version: number;
    updatedAt: string;
    items: Array<{ label: string; bucket: string; text: string }>;
    lock: {
      locked: boolean;
      lockedAt: string | null;
      lockedBy: string | null;
      lockedByRole: string | null;
      lockedVersion: number;
      lockPasswordSet: boolean;
      lockScore: number;
      lockMissing: string[];
      readyToLock: boolean;
      completionPercent: number;
      unlockFailedAttempts: number;
      unlockBlockedUntil: string | null;
      meetingPresent: boolean;
    };
  } | null;
  meeting: {
    id: string;
    title: string;
    dateTime: string;
    status: string;
    attendees: string[];
  } | null;
  clientLink: {
    id: string;
    status: string;
    expiresAt: string;
    updatedAt: string;
  } | null;
  formCompletion: {
    checks: {
      clientInfo: boolean;
      requirements: boolean;
      budget: boolean;
      files: boolean;
      meeting: boolean;
    };
    percent: number;
  };
};

const getAuthorizationHeader = () => {
  const session = getAuthSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
};

const unwrapResponse = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(authenticated ? getAuthorizationHeader() : {}),
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new ClientIntakeApiError(payload?.error ?? payload?.message ?? "Request failed.", response.status, payload?.data ?? payload);
    }

    return unwrapResponse<T>(payload);
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new ClientIntakeApiError("Request timed out. Please try again.", 408);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const toSubmission = (item: BackendIntakeSubmission): ClientIntakeSubmission => {
  const formData = item.formData ?? {};
  return {
    id: item.id,
    accessId: String(item.id),
    leadId: item.leadId !== undefined ? Number(item.leadId) : undefined,
    leadName: item.lead?.name ?? formData.contactName ?? formData.businessName ?? "Unknown lead",
    submittedAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
    aiSummary: item.aiSummary ?? "",
    form: {
      businessName: formData.businessName ?? item.lead?.company ?? "",
      industry: formData.industry ?? "",
      businessWebsite: formData.businessWebsite ?? "",
      country: formData.country ?? "India",
      timezone: formData.timezone ?? "Asia/Kolkata",
      contactName: formData.contactName ?? item.lead?.name ?? "",
      contactRole: formData.contactRole ?? "",
      email: formData.email ?? "",
      phone: formData.phone ?? "",
      preferredContactMethod: (formData.preferredContactMethod as ClientIntakeForm["preferredContactMethod"]) ?? "Email",
      companySize: formData.companySize ?? "",
      businessStage: (formData.businessStage as ClientIntakeForm["businessStage"]) ?? "Startup",
      launchUrgency: (formData.launchUrgency as ClientIntakeForm["launchUrgency"]) ?? "Flexible",
      projectType: (formData.projectType as ClientIntakeForm["projectType"]) ?? "Website",
      goal: formData.goal ?? "",
      features: formData.features ?? [],
      userRoles: formData.userRoles ?? [],
      modules: formData.modules ?? [],
      ideaDescription: formData.ideaDescription ?? "",
      targetAudience: formData.targetAudience ?? "",
      budget: formData.budget ?? 0,
      deadline: formData.deadline ?? "",
      priority: (formData.priority as ClientIntakeForm["priority"]) ?? "medium",
      selectedPackage: (formData.selectedPackage as ClientIntakeForm["selectedPackage"]) ?? "growth",
      uploadedFiles: formData.uploadedFiles ?? [],
      meetingSlot: formData.meetingSlot ?? "",
      termsAccepted: Boolean(formData.termsAccepted),
      estimatedPrice: formData.estimatedPrice ?? 0,
      suggestionNotes: formData.suggestionNotes ?? [],
    },
  };
};

export const syncClientIntakeSubmissionToBackend = async (submission: ClientIntakeSubmission) => {
  if (!getAuthSession()?.token) return null;

  try {
    return await request<{ leadId?: string; requirementId?: string; submissionId?: string }>(
      "/client-intake/submit",
      {
        method: "POST",
        body: JSON.stringify(submission.form),
      },
      true,
    );
  } catch (error) {
    console.warn("Client intake backend sync failed:", error);
    return null;
  }
};

export const submitIntakeToBackend = async (payload: ClientIntakeForm & { token?: string; leadId?: string | number }) => {
  return request<{ leadId: string; intakeId: string; requirementId: string }>(
    "/intake/submit",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    false,
  );
};

export const refineIntakeDescriptionWithAI = async (payload: {
  businessName?: string;
  industry?: string;
  contactName?: string;
  projectType?: string;
  goal?: string;
  description: string;
  targetAudience?: string;
  userRoles?: string[];
  modules?: string[];
  features?: string[];
  budget?: number;
  deadline?: string;
  priority?: string;
  selectedPackage?: string;
}) => {
  try {
    return await request<{ description: string; provider?: string; model?: string }>(
      "/intake/ai/refine-description",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      false,
    );
  } catch {
    // Keep UX stable when AI service is down by returning a safe local fallback.
    return {
      description: String(payload.description || "").trim(),
      provider: "fallback",
      model: "local-fallback",
    };
  }
};

export const sendClientLink = async (payload: ClientLinkPayload) => {
  return request<ClientLinkResponse>(
    "/client-link/send",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
};

export const resendClientLink = async (payload: ClientLinkPayload) => {
  return request<ClientLinkResponse>(
    "/client-link/resend",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
};

export const getClientLinkByToken = async (token: string) => {
  return request<ClientLinkRecord>(`/client-link/${encodeURIComponent(token)}`, { method: "GET" }, false);
};

export const fetchLeadRequirementBundle = async (leadId: string | number) => {
  return request<RequirementBundle>(`/requirements/${encodeURIComponent(String(leadId))}`, { method: "GET" }, true);
};

export const regenerateLeadRequirements = async (leadId: string | number) => {
  return request<{ leadId: string; regenerated: boolean }>(
    `/requirements/${encodeURIComponent(String(leadId))}/regenerate`,
    {
      method: "POST",
    },
    true,
  );
};

export const lockLeadRequirements = async (
  leadId: string | number,
  payload: { password: string; confirmPassword: string; override?: boolean; intake?: Partial<ClientIntakeForm> },
) => {
  return request<{ leadId: string; locked: boolean; lockScore?: number; missing?: string[]; lockedAt?: string; lockedVersion?: number }>(
    `/requirements/${encodeURIComponent(String(leadId))}/lock`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
};

export const unlockLeadRequirements = async (leadId: string | number, payload: { password?: string; override?: boolean }) => {
  return request<{ leadId: string; locked: boolean; unlockedAt?: string }>(
    `/requirements/${encodeURIComponent(String(leadId))}/unlock`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
};

export const fetchBackendClientIntakeSubmissions = async (): Promise<ClientIntakeSubmission[]> => {
  if (!getAuthSession()?.token) return [];

  try {
    const submissions = await request<BackendIntakeSubmission[]>("/client-intake/submissions", { method: "GET" }, true);
    return Array.isArray(submissions) ? submissions.map(toSubmission) : [];
  } catch (error) {
    console.warn("Unable to load backend intake submissions:", error);
    return [];
  }
};

export { ClientIntakeApiError };
