import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  Layers,
  Lock,
  Pencil,
  RefreshCw,
  Rocket,
  Search,
  SquareStack,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from yout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createProjectFromLead } from "@/lib/project-store";
import { getClientIntakeSubmissions, type ClientIntakeSubmission } from "@/lib/client-intake-store";
import { getLeads, type LeadRecord } from "@/lib/lead-store";
import {
  fetchBackendClientIntakeSubmissions,
  fetchLeadRequirementBundle,
  lockLeadRequirements,
  regenerateLeadRequirements,
  resendClientLink,
  type RequirementBundle,
} from "@/lib/client-intake-api";
import { createOrGetClientAccessByLead, getClientIntakeLinkForLead } from "@/lib/collaboration-store";
import { toast } from "sonner";

type RequirementLifecycleStatus = "pending" | "submitted" | "verified" | "locked";

type SubmittedLeadEntry = {
  lead: LeadRecord;
  submission: ClientIntakeSubmission;
};

type PipelineStage = {
  key: string;
  label: string;
  status: "done" | "in-progress" | "locked";
  progress: number;
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
  const [intakeSubmissions, setIntakeSubmissions] = useState<ClientIntakeSubmission[]>(getClientIntakeSubmissions());
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [requirementBundle, setRequirementBundle] = useState<RequirementBundle | null>(null);

  const submittedEntries = useMemo(() => {
    const leadMap = new Map<number, LeadRecord>(leads.map((lead) => [lead.id, lead]));
    const byLead = new Map<number, ClientIntakeSubmission>();

    intakeSubmissions
      .filter((submission) => typeof submission.leadId === "number")
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .forEach((submission) => {
        const leadId = Number(submission.leadId);
        if (!byLead.has(leadId)) {
          byLead.set(leadId, submission);
        }
      });

    return Array.from(byLead.entries())
      .map(([leadId, submission]) => {
        const lead = leadMap.get(leadId) ?? toFallbackLead(submission);
        return { lead, submission } satisfies SubmittedLeadEntry;
      })
      .sort((a, b) => b.submission.submittedAt - a.submission.submittedAt);
  }, [intakeSubmissions, leads]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return submittedEntries;

    return submittedEntries.filter(({ lead, submission }) => {
      return (
        lead.name.toLowerCase().includes(term) ||
        lead.company.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        submission.form.email.toLowerCase().includes(term) ||
        submission.form.businessName.toLowerCase().includes(term)
      );
    });
  }, [search, submittedEntries]);

  const selectedEntry = useMemo(
    () => filteredEntries.find((entry) => entry.lead.id === selectedLeadId) ?? null,
    [filteredEntries, selectedLeadId],
  );

  const selectedSubmission = selectedEntry?.submission ?? null;
  const selectedLead = selectedEntry?.lead ?? null;
  const lifecycleStatus = getLifecycleStatus(requirementBundle, Boolean(selectedSubmission));

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
  const accessRecord = useMemo(() => (selectedLead ? createOrGetClientAccessByLead(selectedLead) : null), [selectedLead]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLeadId = Number(params.get("leadId"));

    if (Number.isFinite(queryLeadId) && submittedEntries.some((entry) => entry.lead.id === queryLeadId)) {
      setSelectedLeadId(queryLeadId);
      return;
    }

    if (!submittedEntries.length) {
      setSelectedLeadId(null);
      return;
    }

    setSelectedLeadId((current) => {
      if (current && submittedEntries.some((entry) => entry.lead.id === current)) {
        return current;
      }
      return submittedEntries[0].lead.id;
    });
  }, [submittedEntries]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const backend = await fetchBackendClientIntakeSubmissions();
      if (cancelled || !backend.length) return;

      setIntakeSubmissions((current) => {
        const merged = [...backend, ...current];
        const uniqueByLead = new Map<number, ClientIntakeSubmission>();

        merged
          .filter((item) => typeof item.leadId === "number")
          .sort((a, b) => b.submittedAt - a.submittedAt)
          .forEach((item) => {
            const key = Number(item.leadId);
            if (!uniqueByLead.has(key)) {
              uniqueByLead.set(key, item);
            }
          });

        return Array.from(uniqueByLead.values());
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

  const handleSelectLead = (leadId: number) => {
    setSelectedLeadId(leadId);
    const url = new URL(window.location.href);
    url.searchParams.set("leadId", String(leadId));
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
    await lockLeadRequirements(selectedLead.id);
    const bundle = await fetchLeadRequirementBundle(selectedLead.id);
    setRequirementBundle(bundle);
    toast.success("Requirement locked");
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
      <div className="mx-auto max-w-6xl space-y-6 pb-14">
        {!submittedEntries.length ? (
          <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-white/50" />
            <h1 className="text-2xl font-semibold text-white">No client submissions yet</h1>
            <p className="mt-2 text-sm text-white/70">Requirement Command Center only shows submitted client records.</p>
            <Button className="mt-6 bg-blue-600 text-white hover:bg-blue-500" onClick={() => navigate("/leads")}>Go to Leads</Button>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-200/80">Requirement Command Center</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Submitted Leads</h2>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company or email"
                    className="border-white/20 bg-white/5 pl-9 text-white placeholder:text-white/45"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {filteredEntries.map(({ lead, submission }) => {
                  const active = selectedLeadId === lead.id;
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => handleSelectLead(lead.id)}
                      className={`min-w-[240px] rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-blue-400/50 bg-blue-500/15"
                          : "border-white/10 bg-white/5 hover:border-blue-400/30 hover:bg-blue-500/10"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{submission.form.businessName || lead.company}</p>
                      <p className="text-xs text-white/65">{submission.form.email || lead.email}</p>
                      <p className="mt-1 text-xs text-white/50">Updated {formatRelativeTime(submission.submittedAt)}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {!selectedLead || !selectedSubmission ? (
              <section className="rounded-2xl border border-white/10 bg-[#0a1224] p-10 text-center text-white/70">No client submissions yet</section>
            ) : (
              <>
                <section className="sticky top-3 z-30 rounded-2xl border border-blue-400/30 bg-[#0a1429]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h1 className="text-3xl font-semibold text-white">
                          {selectedSubmission.form.businessName || selectedLead.company} • {selectedSubmission.form.projectType}
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
                      Contact: {selectedSubmission.form.email || selectedLead.email || "Not available"} · {selectedSubmission.form.phone || selectedLead.phone || "Not available"}
                    </p>
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
                  <p className="mt-2 text-sm text-blue-100/85">Recommended Action: Generate tasks and start frontend.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button onClick={handleGenerateTasks} className="bg-blue-600 text-white hover:bg-blue-500">
                      <SquareStack className="mr-2 h-4 w-4" /> Generate Tasks
                    </Button>
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate(`/leads/${selectedLead.id}`)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleLock}>
                      <Lock className="mr-2 h-4 w-4" /> Lock
                    </Button>
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleConvertToProject}>
                      <Rocket className="mr-2 h-4 w-4" /> Convert to Project
                    </Button>
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleRegenerate}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Regenerate AI
                    </Button>
                    <Button variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={handleResendLink}>
                      <ArrowRight className="mr-2 h-4 w-4" /> Resend Link
                    </Button>
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/65">
                    <p>Lifecycle: Pending → Submitted → Verified → Locked</p>
                    <p className="mt-1">Access: {accessRecord?.id || "Not available"} · Intake link: {getClientIntakeLinkForLead(selectedLead).replace(/^https?:\/\//, "")}</p>
                    <p className="mt-1 flex items-center gap-2"><Bot className="h-3.5 w-3.5" /> Last AI refresh: {formatRelativeTime(lastUpdated)}</p>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
