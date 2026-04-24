import { createProjectFromLead, getProjectById, startProjectAutomation } from "@/lib/project-store";
import { getLeads, updateLead, type LeadRecord } from "@/lib/lead-store";

export type ProposalStatus = "pending" | "approved" | "changes-requested";

export type ClientAccessRecord = {
  id: string;
  leadId: number;
  projectId?: string;
  clientName: string;
  email: string;
  createdAt: number;
  lastActivityAt: number;
};

export type ProposalRecord = {
  leadId: number;
  projectId?: string;
  status: ProposalStatus;
  notes: string;
  comments: Array<{
    author: string;
    role: "admin" | "client";
    message: string;
    createdAt: number;
  }>;
  updatedAt: number;
};

export type WorkUploadRecord = {
  id: string;
  projectId: string;
  taskId: string;
  uploadedBy: string;
  fileUrl: string;
  type?: "design" | "code" | "file";
  notes?: string;
  reviewStatus?: "pending" | "approved";
  versionLabel?: string;
  createdAt: number;
};

export type ActivityLogRecord = {
  id: string;
  projectId: string;
  actor: string;
  action: string;
  createdAt: number;
};

export type ProjectChatMessage = {
  id: string;
  projectId: string;
  authorRole: "admin" | "team" | "client";
  author: string;
  message: string;
  createdAt: number;
};

export type FollowupRecord = {
  leadId: number;
  lastClientReplyAt: number;
  lastReminderAt?: number;
  nextReminderAt: number;
};

const ACCESS_KEY = "ai-project-os.client-access";
const PROPOSAL_KEY = "ai-project-os.proposals";
const CHAT_KEY = "ai-project-os.project-chat";
const FOLLOWUP_KEY = "ai-project-os.followups";
const WORK_UPLOAD_KEY = "ai-project-os.work-uploads";
const ACTIVITY_LOG_KEY = "ai-project-os.activity-logs";

const safeRead = <T>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = <T>(key: string, value: T[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getClientAccessRecords = () => safeRead<ClientAccessRecord>(ACCESS_KEY);
const getProposalRecords = () => safeRead<ProposalRecord>(PROPOSAL_KEY);
const getChatRecords = () => safeRead<ProjectChatMessage>(CHAT_KEY);
const getFollowupRecords = () => safeRead<FollowupRecord>(FOLLOWUP_KEY);
const getWorkUploadRecords = () => safeRead<WorkUploadRecord>(WORK_UPLOAD_KEY);
const getActivityLogRecords = () => safeRead<ActivityLogRecord>(ACTIVITY_LOG_KEY);

const ensureFollowup = (leadId: number) => {
  const followups = getFollowupRecords();
  const current = followups.find((item) => item.leadId === leadId);
  if (current) return current;

  const now = Date.now();
  const next: FollowupRecord = {
    leadId,
    lastClientReplyAt: now,
    nextReminderAt: now + 48 * 60 * 60 * 1000,
  };
  safeWrite(FOLLOWUP_KEY, [next, ...followups]);
  return next;
};

export const createOrGetClientAccessByLead = (lead: LeadRecord) => {
  // Keep lead store in sync so intake submission can always resolve this lead by ID.
  updateLead(lead);

  const accessRecords = getClientAccessRecords();
  const existing = accessRecords.find((item) => item.leadId === lead.id);
  if (existing) return existing;

  const created: ClientAccessRecord = {
    id: `client-${lead.id}-${Date.now()}`,
    leadId: lead.id,
    projectId: `${lead.id}`,
    clientName: lead.name,
    email: lead.email,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  safeWrite(ACCESS_KEY, [created, ...accessRecords]);
  ensureFollowup(lead.id);
  return created;
};

export const createOrGetClientAccessByProjectId = (projectId: string) => {
  const leads = getLeads();
  const lead = leads.find((item) => `${item.id}` === projectId);
  if (!lead) return undefined;
  return createOrGetClientAccessByLead(lead);
};

export const getClientAccessById = (id?: string) => {
  if (!id) return undefined;
  return getClientAccessRecords().find((item) => item.id === id);
};

export const getAllClientAccess = () => getClientAccessRecords().sort((a, b) => b.lastActivityAt - a.lastActivityAt);

export const getClientPortalLinkForLead = (lead: LeadRecord) => {
  const access = createOrGetClientAccessByLead(lead);
  if (typeof window === "undefined") return `/client/portal/${access.id}`;
  return `${window.location.origin}/client/portal/${access.id}`;
};

export const getClientIntakeLinkForLead = (lead: LeadRecord) => {
  const access = createOrGetClientAccessByLead(lead);
  if (typeof window === "undefined") return `/client/intake/${access.id}`;
  return `${window.location.origin}/client/intake/${access.id}`;
};

export const getClientPortalLinkForProject = (projectId: string) => {
  const access = createOrGetClientAccessByProjectId(projectId);
  if (!access) return "";
  if (typeof window === "undefined") return `/client/portal/${access.id}`;
  return `${window.location.origin}/client/portal/${access.id}`;
};

export const getClientIntakeLinkForProject = (projectId: string) => {
  const access = createOrGetClientAccessByProjectId(projectId);
  if (!access) return "";
  if (typeof window === "undefined") return `/client/intake/${access.id}`;
  return `${window.location.origin}/client/intake/${access.id}`;
};

export const getProposalLinkForLeadId = (leadId: number) => {
  if (typeof window === "undefined") return `/proposal/${leadId}`;
  return `${window.location.origin}/proposal/${leadId}`;
};

export const touchClientActivity = (accessId: string) => {
  const accessRecords = getClientAccessRecords();
  const next = accessRecords.map((item) => (item.id === accessId ? { ...item, lastActivityAt: Date.now() } : item));
  safeWrite(ACCESS_KEY, next);
};

export const getProposalByLeadId = (leadId: number) => {
  return getProposalRecords().find((item) => item.leadId === leadId);
};

export const createOrUpdateProposal = (leadId: number, notes: string) => {
  const proposals = getProposalRecords();
  const existing = proposals.find((item) => item.leadId === leadId);
  const updated: ProposalRecord = {
    leadId,
    projectId: existing?.projectId,
    status: existing?.status ?? "pending",
    notes,
    comments: existing?.comments ?? [],
    updatedAt: Date.now(),
  };

  safeWrite(PROPOSAL_KEY, [updated, ...proposals.filter((item) => item.leadId !== leadId)]);
  return updated;
};

export const requestProposalChanges = (leadId: number) => {
  const proposals = getProposalRecords();
  const existing = proposals.find((item) => item.leadId === leadId);
  const updated: ProposalRecord = {
    leadId,
    projectId: existing?.projectId,
    status: "changes-requested",
    notes: existing?.notes ?? "Client requested changes",
    comments: existing?.comments ?? [],
    updatedAt: Date.now(),
  };

  safeWrite(PROPOSAL_KEY, [updated, ...proposals.filter((item) => item.leadId !== leadId)]);
  return updated;
};

export const approveProposalAndCreateProject = (leadId: number) => {
  const lead = getLeads().find((item) => item.id === leadId);
  if (!lead) return undefined;

  const project = getProjectById(`${leadId}`) ?? createProjectFromLead(lead);
  startProjectAutomation(project.id);

  const proposals = getProposalRecords();
  const existing = proposals.find((item) => item.leadId === leadId);
  const updated: ProposalRecord = {
    leadId,
    projectId: project.id,
    status: "approved",
    notes: existing?.notes ?? "Client approved proposal",
    comments: existing?.comments ?? [],
    updatedAt: Date.now(),
  };
  safeWrite(PROPOSAL_KEY, [updated, ...proposals.filter((item) => item.leadId !== leadId)]);

  const access = createOrGetClientAccessByLead(lead);
  const accessRecords = getClientAccessRecords();
  safeWrite(
    ACCESS_KEY,
    [{ ...access, projectId: project.id, lastActivityAt: Date.now() }, ...accessRecords.filter((item) => item.id !== access.id)],
  );

  return project;
};

export const addProposalComment = (leadId: number, role: "admin" | "client", author: string, message: string) => {
  const proposals = getProposalRecords();
  const existing = proposals.find((item) => item.leadId === leadId);
  const updated: ProposalRecord = {
    leadId,
    projectId: existing?.projectId,
    status: existing?.status ?? "pending",
    notes: existing?.notes ?? "Proposal discussion",
    comments: [
      ...(existing?.comments ?? []),
      {
        author,
        role,
        message,
        createdAt: Date.now(),
      },
    ],
    updatedAt: Date.now(),
  };
  safeWrite(PROPOSAL_KEY, [updated, ...proposals.filter((item) => item.leadId !== leadId)]);
  return updated;
};

export const getProjectChat = (projectId: string) => {
  return getChatRecords().filter((item) => item.projectId === projectId).sort((a, b) => a.createdAt - b.createdAt);
};

export const postProjectChat = (projectId: string, authorRole: ProjectChatMessage["authorRole"], author: string, message: string) => {
  const chat = getChatRecords();
  const next: ProjectChatMessage = {
    id: `chat-${projectId}-${Date.now()}`,
    projectId,
    authorRole,
    author,
    message,
    createdAt: Date.now(),
  };

  safeWrite(CHAT_KEY, [...chat, next]);
  return next;
};

export const addWorkUpload = (
  projectId: string,
  taskId: string,
  uploadedBy: string,
  fileUrl: string,
  versionLabel?: string,
  notes?: string,
  type: WorkUploadRecord["type"] = "file",
) => {
  const uploads = getWorkUploadRecords();
  const record: WorkUploadRecord = {
    id: `work-${projectId}-${taskId}-${Date.now()}`,
    projectId,
    taskId,
    uploadedBy,
    fileUrl,
    type,
    notes,
    reviewStatus: "pending",
    versionLabel,
    createdAt: Date.now(),
  };
  safeWrite(WORK_UPLOAD_KEY, [record, ...uploads]);
  return record;
};

export const updateWorkUploadStatus = (uploadId: string, reviewStatus: "pending" | "approved") => {
  const uploads = getWorkUploadRecords();
  const next = uploads.map((item) => (item.id === uploadId ? { ...item, reviewStatus } : item));
  safeWrite(WORK_UPLOAD_KEY, next);
  return next.find((item) => item.id === uploadId);
};

export const getProjectWorkUploads = (projectId: string) => {
  return getWorkUploadRecords().filter((item) => item.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);
};

export const addActivityLog = (projectId: string, actor: string, action: string) => {
  const logs = getActivityLogRecords();
  const next: ActivityLogRecord = {
    id: `log-${projectId}-${Date.now()}`,
    projectId,
    actor,
    action,
    createdAt: Date.now(),
  };
  safeWrite(ACTIVITY_LOG_KEY, [next, ...logs]);
  return next;
};

export const getProjectActivityLogs = (projectId: string) => {
  return getActivityLogRecords().filter((item) => item.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);
};

export const touchClientReplyForLead = (leadId: number) => {
  const followups = getFollowupRecords();
  const now = Date.now();
  const updated = {
    leadId,
    lastClientReplyAt: now,
    lastReminderAt: undefined,
    nextReminderAt: now + 48 * 60 * 60 * 1000,
  } as FollowupRecord;

  safeWrite(FOLLOWUP_KEY, [updated, ...followups.filter((item) => item.leadId !== leadId)]);
};

export const runAutoFollowupReminders = () => {
  const followups = getFollowupRecords();
  const now = Date.now();
  const due: FollowupRecord[] = [];

  const next = followups.map((item) => {
    if (item.nextReminderAt <= now) {
      due.push(item);
      return {
        ...item,
        lastReminderAt: now,
        nextReminderAt: now + 24 * 60 * 60 * 1000,
      };
    }
    return item;
  });

  safeWrite(FOLLOWUP_KEY, next);
  return due;
};
