import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Clock,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { AIInsightBox } from "@/components/AIInsightBox";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadActionBar } from "@/components/LeadActionBar";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getAuthSession } from "@/lib/auth-store";
import { getClientIntakeLinkForLead, getProposalLinkForLeadId, runAutoFollowupReminders } from "@/lib/collaboration-store";
import type { LeadRecord } from "@/lib/lead-store";

type LeadStatus = "hot" | "warm" | "cold";
type SortOption = "latest" | "budget-high" | "score-high" | "alphabetical";

type Lead = {
  id: string;
  dealId: string;
  name: string;
  company: string;
  stage: string;
  project: string;
  status: LeadStatus;
  budgetLabel: string;
  budgetValue: number;
  score: number;
  source: string;
  owner: string;
  phone: string;
  email: string;
  insight: string;
  nextAction: string;
  lastActivity: string;
  notes: string;
  createdAt: number;
};

type BackendLead = {
  id: string;
  name: string;
  company: string;
  value: number;
  score: number;
  stage: string;
  email?: string | null;
  phone?: string | null;
  summary?: string | null;
  nextAction?: string | null;
  createdAt?: string;
};

type AnalyzeLeadResult = {
  leadId: string;
  success: boolean;
  message?: string;
  lead?: {
    id: string;
    name: string;
    company: string;
    stage: string;
    value: number;
    score: number;
    summary: string | null;
    nextAction: string | null;
    confidence: number | null;
    priority: string;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const mapStageToStatus = (stage?: string): LeadStatus => {
  const normalized = String(stage || "").toLowerCase();
  if (["won", "proposal", "qualified", "hot"].includes(normalized)) return "hot";
  if (["warm", "contacted", "negotiation"].includes(normalized)) return "warm";
  return "cold";
};

const toBudgetLabel = (value: number) => `₹${Math.max(0, Number(value || 0)).toLocaleString("en-IN")}`;

const leadIdForLink = (id: string) => {
  const asNum = Number(id);
  if (Number.isFinite(asNum) && asNum > 0) return asNum;
  let hash = 7;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
};

const authHeaders = () => {
  const token = getAuthSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapBackendLead = (lead: BackendLead, index: number): Lead => ({
  id: lead.id,
  dealId: `DEAL-${1042 + index}`,
  name: lead.name,
  company: lead.company,
  stage: lead.stage || "Discovery",
  project: "Client Project",
  status: mapStageToStatus(lead.stage),
  budgetLabel: toBudgetLabel(lead.value),
  budgetValue: Number(lead.value || 0),
  score: Number(lead.score || 0),
  source: "Backend",
  owner: "Assigned",
  phone: lead.phone || "N/A",
  email: lead.email || "N/A",
  insight: lead.summary || "Lead synced from backend",
  nextAction: lead.nextAction || "Follow up with client",
  lastActivity: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Recently",
  notes: lead.summary || "",
  createdAt: lead.createdAt ? new Date(lead.createdAt).getTime() : Date.now(),
});

const asCollaborationLead = (lead: Lead): LeadRecord => ({
  id: leadIdForLink(lead.id),
  dealId: lead.dealId,
  name: lead.name,
  company: lead.company,
  project: lead.project,
  status: lead.status,
  budgetLabel: lead.budgetLabel,
  budgetValue: lead.budgetValue,
  score: lead.score,
  source: lead.source,
  owner: lead.owner,
  phone: lead.phone,
  email: lead.email,
  insight: lead.insight,
  nextAction: lead.nextAction,
  lastActivity: lead.lastActivity,
  notes: lead.notes,
  createdAt: lead.createdAt,
});

const projectTypeOptions = [
  { value: "ecommerce", label: "E-commerce Website" },
  { value: "website", label: "Business Website" },
  { value: "mobile-app", label: "Mobile App" },
  { value: "web-app", label: "Web Application" },
  { value: "lms", label: "LMS / Education Platform" },
  { value: "saas", label: "SaaS Product" },
  { value: "other", label: "Other" },
];

const budgetOptions = [
  { value: "under-50k", label: "Under ₹50,000", amount: 50000 },
  { value: "50k-1l", label: "₹50,000 - ₹1,00,000", amount: 100000 },
  { value: "1l-3l", label: "₹1,00,000 - ₹3,00,000", amount: 300000 },
  { value: "3l-5l", label: "₹3,00,000 - ₹5,00,000", amount: 500000 },
  { value: "above-5l", label: "Above ₹5,00,000", amount: 750000 },
];

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

const ownerOptions = ["Meera", "Aarav", "Nikhil", "Priya", "Unassigned"];
const sourceOptions = ["Website", "Referral", "WhatsApp", "Campaign", "Cold Call"];
const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "latest", label: "Newest first" },
  { value: "budget-high", label: "Highest budget" },
  { value: "score-high", label: "Highest score" },
  { value: "alphabetical", label: "Alphabetical" },
];

const copyLeadFormLink = () => {
  const url = `${window.location.origin}/lead-form`;
  navigator.clipboard.writeText(url);
  toast.success("Lead form link copied!");
};

type AddLeadForm = {
  name: string;
  company: string;
  phone: string;
  email: string;
  projectType: string;
  budgetRange: string;
  status: LeadStatus;
  source: string;
  owner: string;
  projectDescription: string;
};

const createCompanyFromEmail = (email: string, fallbackName: string) => {
  const domain = email.split("@")[1]?.split(".")[0]?.trim();
  if (!domain) {
    return `${fallbackName.split(" ")[0]} Ventures`;
  }
  return `${domain.charAt(0).toUpperCase()}${domain.slice(1)} Solutions`;
};

const getLeadScore = (status: LeadStatus, budgetValue: number) => {
  const base = { hot: 90, warm: 75, cold: 58 }[status];
  const budgetBonus = budgetValue >= 500000 ? 6 : budgetValue >= 200000 ? 4 : 2;
  return Math.min(98, base + budgetBonus);
};

const getLeadInsight = (status: LeadStatus) => {
  if (status === "hot") {
    return "High-intent lead. Follow up within the hour to keep momentum.";
  }
  if (status === "warm") {
    return "Qualified lead. Share a targeted proposal and keep the thread active.";
  }
  return "Nurture lead. Send a helpful follow-up and keep the relationship warm.";
};

const getNextAction = (status: LeadStatus) => {
  if (status === "hot") {
    return "Call today and send proposal after the meeting";
  }
  if (status === "warm") {
    return "Follow up with case studies and timeline options";
  }
  return "Add to nurture sequence and revisit next week";
};

const getLeadInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<{
    total: number;
    successCount: number;
    failureCount: number;
    provider?: string;
    model?: string;
    durationMs?: number;
    insights?: {
      avgScore: number;
      stageDistribution: { hot: number; warm: number; cold: number };
      topLeads: Array<{
        id: string;
        name: string;
        company: string;
        stage: string;
        value: number;
        score: number;
        summary: string | null;
        nextAction: string | null;
        confidence: number | null;
        priority: string;
      }>;
    };
    results?: AnalyzeLeadResult[];
    finishedAt: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [addLeadForm, setAddLeadForm] = useState<AddLeadForm>({
    name: "",
    company: "",
    phone: "",
    email: "",
    projectType: "",
    budgetRange: "",
    status: "warm",
    source: "Website",
    owner: "Unassigned",
    projectDescription: "",
  });

  const loadLeads = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "GET",
        headers: {
          ...authHeaders(),
        },
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to fetch leads");
      }

      const rawLeads = Array.isArray(payload?.data?.data) ? payload.data.data : [];
      const mapped = rawLeads.map((item: BackendLead, index: number) => mapBackendLead(item, index));
      setLeads(mapped);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load leads from backend");
    } finally {
      setIsRefreshing(false);
    }
  };

  const cleanupDuplicates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dedup/cleanup`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Duplicate cleanup failed");
      }
      const removedCount = Number(payload?.data?.removedCount || 0);
      if (removedCount > 0) {
        toast.success(`Removed ${removedCount} duplicate lead(s)`);
      }
      await loadLeads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cleanup duplicate leads");
    }
  };

  const runAiAnalysisForAllLeads = async () => {
    if (isAnalyzingAll) return;

    try {
      setIsAnalyzingAll(true);
      toast.info("Running AI analysis for all leads...");

      const response = await fetch(`${API_BASE_URL}/leads/analyze-all`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to run AI analysis");
      }

      const jobId = String(payload?.data?.jobId || "");
      if (!jobId) {
        throw new Error("Failed to start analysis job");
      }

      let finalData: any = null;
      for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const statusResponse = await fetch(`${API_BASE_URL}/leads/analyze-all/${jobId}`, {
          method: "GET",
          headers: {
            ...authHeaders(),
          },
        });

        const statusPayload = await statusResponse.json();
        if (!statusResponse.ok || !statusPayload?.success) {
          throw new Error(statusPayload?.message || "Failed to fetch analysis status");
        }

        const status = String(statusPayload?.data?.status || "");
        if (status === "completed") {
          finalData = statusPayload?.data?.data || null;
          break;
        }

        if (status === "failed") {
          throw new Error(statusPayload?.data?.error || "AI analysis failed");
        }
      }

      if (!finalData) {
        throw new Error("AI analysis is still running. Please retry in a few seconds.");
      }

      const successCount = Number(finalData?.successCount || 0);
      const failureCount = Number(finalData?.failureCount || 0);
      setAnalysisSummary({
        total: Number(finalData?.total || 0),
        successCount,
        failureCount,
        provider: finalData?.provider,
        model: finalData?.model,
        durationMs: Number(finalData?.durationMs || 0),
        insights: finalData?.insights,
        results: Array.isArray(finalData?.results) ? finalData.results : [],
        finishedAt: Date.now(),
      });
      toast.success(`AI analyzed ${successCount} lead(s)${failureCount ? `, ${failureCount} failed` : ""}`);
      await loadLeads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to run AI analysis");
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  useEffect(() => {
    const due = runAutoFollowupReminders();
    if (due.length) {
      toast.info(`${due.length} client follow-up reminder(s) sent automatically`);
    }
  }, []);

  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((lead) => lead.status === "hot").length;
    const warm = leads.filter((lead) => lead.status === "warm").length;
    const cold = leads.filter((lead) => lead.status === "cold").length;
    const avgScore = total ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / total) : 0;
    const pipelineValue = leads.reduce((sum, lead) => sum + lead.budgetValue, 0);

    return { total, hot, warm, cold, avgScore, pipelineValue };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const matchesQuery = (lead: Lead) =>
      !query ||
      [lead.name, lead.company, lead.project, lead.source, lead.owner, lead.notes, lead.dealId]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesStatus = (lead: Lead) => statusFilter === "all" || lead.status === statusFilter;

    return [...leads]
      .filter((lead) => matchesQuery(lead) && matchesStatus(lead))
      .sort((a, b) => {
        if (sortBy === "budget-high") {
          return b.budgetValue - a.budgetValue;
        }
        if (sortBy === "score-high") {
          return b.score - a.score;
        }
        if (sortBy === "alphabetical") {
          return a.name.localeCompare(b.name);
        }
        return b.createdAt - a.createdAt;
      });
  }, [leads, searchTerm, sortBy, statusFilter]);

  const priorityLeads = useMemo(
    () =>
      [...leads]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [leads],
  );

  const updateField = <T extends keyof AddLeadForm>(field: T, value: AddLeadForm[T]) => {
    setAddLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setAddLeadForm({
      name: "",
      company: "",
      phone: "",
      email: "",
      projectType: "",
      budgetRange: "",
      status: "warm",
      source: "Website",
      owner: "Unassigned",
      projectDescription: "",
    });
  };

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!addLeadForm.projectType || !addLeadForm.budgetRange) {
      toast.error("Please select project type and budget range");
      return;
    }

    const selectedProject = projectTypeOptions.find((item) => item.value === addLeadForm.projectType)?.label ?? "New Project";
    const selectedBudget = budgetOptions.find((item) => item.value === addLeadForm.budgetRange);

    if (!selectedBudget) {
      toast.error("Please choose a valid budget range");
      return;
    }

    try {
      const payload = {
        name: addLeadForm.name.trim(),
        company: addLeadForm.company.trim() || createCompanyFromEmail(addLeadForm.email, addLeadForm.name.trim()),
        value: selectedBudget.amount,
        stage: addLeadForm.status === "hot" ? "Qualified" : addLeadForm.status === "warm" ? "Contacted" : "Discovery",
        email: addLeadForm.email.trim(),
        phone: addLeadForm.phone.trim(),
        summary: addLeadForm.projectDescription.trim() || `Project type: ${selectedProject}`,
        nextAction: getNextAction(addLeadForm.status),
      };

      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Failed to create lead");
      }

      setIsAddLeadOpen(false);
      resetForm();
      await cleanupDuplicates();
      toast.success("Lead created in backend and duplicates cleaned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create lead");
    }
  };

  const handleOpenLead = (lead: Lead) => {
    navigate(`/leads/${lead.id}`, { state: { lead } });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("latest");
  };

  const sendClientLink = (lead: Lead, channel: "copy" | "email" | "whatsapp") => {
    const link = getClientIntakeLinkForLead(asCollaborationLead(lead));

    if (channel === "copy") {
      navigator.clipboard.writeText(link);
      window.open(link, "_blank", "noopener,noreferrer");
      toast.success("Client intake link copied");
      return;
    }

    if (channel === "email") {
      window.open(`mailto:${lead.email}?subject=Complete Your Project Intake&body=Hi ${lead.name}, please complete your project intake form here: ${link}`, "_blank");
      window.open(link, "_blank", "noopener,noreferrer");
      toast.success("Email draft opened");
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${lead.name}, please fill this intake form: ${link}`)}`, "_blank");
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp message opened");
  };

  const sendProposal = (lead: Lead) => {
    const link = getProposalLinkForLeadId(leadIdForLink(lead.id));
    navigator.clipboard.writeText(link);
    toast.success("Proposal link copied and ready to share with client");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Lead Workspace
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Leads</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage incoming prospects, prioritize hot opportunities, and keep follow-ups moving.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void runAiAnalysisForAllLeads()} disabled={isAnalyzingAll} className="border-border/50 text-muted-foreground hover:text-foreground">
              {isAnalyzingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />} {isAnalyzingAll ? "Analyzing..." : "Analyze All (Ollama)"}
            </Button>
            <Button variant="outline" onClick={() => void cleanupDuplicates()} className="border-border/50 text-muted-foreground hover:text-foreground">
              <Sparkles className="w-4 h-4 mr-2" /> Remove Duplicates
            </Button>
            <Button variant="outline" onClick={copyLeadFormLink} className="border-border/50 text-muted-foreground hover:text-foreground">
              <Share2 className="w-4 h-4 mr-2" /> Share Lead Form
            </Button>
            <Button onClick={() => setIsAddLeadOpen(true)} className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add Lead
            </Button>
          </div>
        </div>

        <GlassCard className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card/90 to-accent/10">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top_right,hsl(var(--primary)/0.28),transparent_55%)]" />
          <div className="relative space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary/80">AI Command Center</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Ollama Lead Intelligence Engine</h2>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${isAnalyzingAll ? "border-primary/40 bg-primary/20 text-primary" : "border-border/60 bg-secondary/40 text-muted-foreground"}`}>
                {isAnalyzingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isAnalyzingAll ? "AI Running" : "AI Ready"}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-card/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Processed</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{analysisSummary?.total ?? 0}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Success</p>
                <p className="mt-1 text-lg font-semibold text-success">{analysisSummary?.successCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Failures</p>
                <p className="mt-1 text-lg font-semibold text-destructive">{analysisSummary?.failureCount ?? 0}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Run health</span>
                <span>
                  {analysisSummary?.provider ? `${analysisSummary.provider} ${analysisSummary.model || ""}`.trim() : "No run yet"}
                  {analysisSummary?.durationMs ? ` • ${(analysisSummary.durationMs / 1000).toFixed(1)}s` : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary/60">
                {isAnalyzingAll ? (
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                ) : (
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${analysisSummary?.total ? Math.round((analysisSummary.successCount / Math.max(analysisSummary.total, 1)) * 100) : 0}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {analysisSummary ? (
              <p className="text-xs text-muted-foreground">
                Last run {new Date(analysisSummary.finishedAt).toLocaleTimeString()} • {analysisSummary.successCount} successful, {analysisSummary.failureCount} failed.
              </p>
            ) : null}
          </div>
        </GlassCard>

        {analysisSummary ? (
          <GlassCard className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card/95 to-secondary/20">
            <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary/80">AI Analysis Report</p>
                  <h3 className="mt-1 text-xl font-semibold text-foreground">Complete Lead Intelligence Details</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Full per-lead analysis content with summaries, next actions, confidence, and priority signals.
                  </p>
                </div>
                <div className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                  {analysisSummary.durationMs ? `${(analysisSummary.durationMs / 1000).toFixed(1)}s` : "-"} • {analysisSummary.provider || "ollama"}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Average Score</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{analysisSummary.insights?.avgScore ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hot</p>
                  <p className="mt-1 text-2xl font-semibold text-destructive">{analysisSummary.insights?.stageDistribution.hot ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Warm</p>
                  <p className="mt-1 text-2xl font-semibold text-warning">{analysisSummary.insights?.stageDistribution.warm ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cold</p>
                  <p className="mt-1 text-2xl font-semibold text-muted-foreground">{analysisSummary.insights?.stageDistribution.cold ?? 0}</p>
                </div>
              </div>

              {analysisSummary.insights?.topLeads?.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-primary/80">Top Leads</p>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {analysisSummary.insights.topLeads.map((lead) => (
                      <div key={lead.id} className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4">
                        <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company} • {lead.stage}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Score</p>
                        <p className="text-lg font-semibold text-foreground">{lead.score}/100</p>
                        <p className="mt-2 text-xs text-muted-foreground">Next Action</p>
                        <p className="text-sm text-foreground/90">{lead.nextAction || "Follow-up with client"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.16em] text-primary/80">Per Lead Analysis Content</p>
                <div className="space-y-3">
                  {(analysisSummary.results || []).map((item) => (
                    <div key={item.leadId} className="rounded-xl border border-border/60 bg-card/70 p-4">
                      {item.success && item.lead ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{item.lead.name} • {item.lead.company}</p>
                            <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] text-success">Analyzed</span>
                          </div>
                          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                            <span>Stage: {item.lead.stage}</span>
                            <span>Score: {item.lead.score}/100</span>
                            <span>Value: {formatCurrency(Number(item.lead.value || 0))}</span>
                            <span>Confidence: {Math.round(Number(item.lead.confidence || 0) * 100)}%</span>
                          </div>
                          <p className="text-sm text-foreground/90">{item.lead.summary || "No summary generated"}</p>
                          <p className="text-sm text-primary/90">Next: {item.lead.nextAction || "Follow up"}</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-foreground/90">Lead {item.leadId}</p>
                          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                            Failed: {item.message || "analysis_failed"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        ) : null}

        {isRefreshing ? <p className="text-sm text-muted-foreground">Syncing leads from backend...</p> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Leads</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">All prospects tracked in one workspace</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Hot Leads</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{stats.hot}</p>
              </div>
              <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">High-intent leads that need immediate follow-up</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Average Score</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{stats.avgScore}</p>
              </div>
              <div className="rounded-2xl bg-success/10 p-3 text-success">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Lead quality across your current pipeline</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline Value</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{formatCurrency(stats.pipelineValue)}</p>
              </div>
              <div className="rounded-2xl bg-warning/10 p-3 text-warning">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Combined projected value of all open leads</p>
          </GlassCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <AIInsightBox
              insight={`${stats.hot} hot leads are ready for action. The highest-value lead is currently ${formatCurrency(
                priorityLeads[0]?.budgetValue ?? 0,
              )} and should be contacted first.`}
              action="Review Hot Leads"
            />

            <GlassCard className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search leads, companies, owners, or notes..."
                    className="pl-9 bg-card/60 border-border/50 h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[360px]">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="h-11 bg-secondary/50 border-border/50">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={clearFilters} className="h-11 border-border/50 text-muted-foreground hover:text-foreground">
                    <Filter className="w-4 h-4 mr-2" /> Clear Filters
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["all", ...statusOptions.map((option) => option.value)] as const).map((value) => {
                  const count = value === "all" ? leads.length : leads.filter((lead) => lead.status === value).length;
                  const active = statusFilter === value;

                  return (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
                          : "border-border/50 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
                      <span className="rounded-full bg-background/50 px-1.5 py-0.5 text-[10px]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            {filteredLeads.length ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredLeads.map((lead) => (
                  <GlassCard
                    key={lead.id}
                    className="space-y-4 cursor-pointer group"
                    onClick={() => handleOpenLead(lead)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenLead(lead);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
                        {getLeadInitials(lead.name)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{lead.name}</h3>
                          <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{lead.dealId}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground">
                          <span className="rounded-full border border-border/50 bg-secondary/40 px-2 py-0.5">{lead.project}</span>
                          <span className="rounded-full border border-border/50 bg-secondary/40 px-2 py-0.5">{lead.source}</span>
                          <span className="rounded-full border border-border/50 bg-secondary/40 px-2 py-0.5">Owner: {lead.owner}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={lead.status} />
                        <span className="text-xs font-semibold text-foreground">{lead.score}/100</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                      <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                        <p className="text-muted-foreground">Budget</p>
                        <p className="mt-1 font-semibold text-foreground">{lead.budgetLabel}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                        <p className="text-muted-foreground">Last activity</p>
                        <p className="mt-1 font-semibold text-foreground">{lead.lastActivity}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                        <p className="text-muted-foreground">Contact</p>
                        <p className="mt-1 font-semibold text-foreground">{lead.phone}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                        <p className="text-muted-foreground">Email</p>
                        <p className="mt-1 truncate font-semibold text-foreground">{lead.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Brain className="h-3.5 w-3.5 text-primary" /> AI insight
                      </div>
                      <p className="text-sm leading-6 text-foreground/90">{lead.insight}</p>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Next action</p>
                        <p className="text-sm font-medium text-foreground">{lead.nextAction}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(lead.budgetValue)}</p>
                        <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" /> {lead.lastActivity}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <ProgressBar value={lead.score} label="Lead score" />
                      <div
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <LeadActionBar lead={lead} onRefresh={loadLeads} onEdit={() => handleOpenLead(lead)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2" onClick={(event) => event.stopPropagation()}>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => sendClientLink(lead, "copy")}>Send Client Link</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => sendProposal(lead)}>Send Proposal</Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Open complete lead information</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard className="py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No leads match your filters</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a broader search or clear the current status filter to show more leads.
                </p>
                <Button onClick={clearFilters} className="mt-5 gradient-primary text-primary-foreground hover:opacity-90">
                  Reset Filters
                </Button>
              </GlassCard>
            )}
          </div>

          <div className="space-y-6">
            <GlassCard className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Pipeline Health</h3>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <ProgressBar value={stats.total ? Math.round((stats.hot / stats.total) * 100) : 0} label="Hot lead ratio" />
              <ProgressBar value={Math.min(100, stats.avgScore)} label="Average quality" />
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                {stats.hot} hot, {stats.warm} warm, and {stats.cold} cold leads are active right now.
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Follow-up Queue</h3>
              <div className="space-y-3">
                {priorityLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleOpenLead(lead)}
                    className="w-full rounded-xl border border-border/50 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.project}</p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{lead.nextAction}</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              <div className="grid gap-2">
                <Button variant="outline" onClick={() => setIsAddLeadOpen(true)} className="justify-start border-border/50 text-muted-foreground hover:text-foreground">
                  <Plus className="w-4 h-4 mr-2" /> Add another lead
                </Button>
                <Button variant="outline" onClick={copyLeadFormLink} className="justify-start border-border/50 text-muted-foreground hover:text-foreground">
                  <Share2 className="w-4 h-4 mr-2" /> Copy public lead form
                </Button>
                <Button variant="outline" onClick={() => toast.success("Bulk email draft ready")} className="justify-start border-border/50 text-muted-foreground hover:text-foreground">
                  <Mail className="w-4 h-4 mr-2" /> Draft bulk email
                </Button>
                <Button variant="outline" onClick={() => toast.success("WhatsApp follow-up batch prepared")} className="justify-start border-border/50 text-muted-foreground hover:text-foreground">
                  <MessageCircle className="w-4 h-4 mr-2" /> Prepare WhatsApp follow-up
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>

        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogContent className="max-w-3xl overflow-hidden border border-primary/20 bg-card/95 p-0 backdrop-blur-xl">
            <div className="relative p-6 pb-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <DialogHeader className="relative">
                <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Add New Lead
                </DialogTitle>
                <DialogDescription>
                  Capture the full lead profile, then it will appear immediately in the leads workspace.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4 px-6 pb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    required
                    value={addLeadForm.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Client full name"
                    className="h-11 border-border/50 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={addLeadForm.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="Company or brand name"
                    className="h-11 border-border/50 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    required
                    type="tel"
                    value={addLeadForm.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 border-border/50 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    required
                    type="email"
                    value={addLeadForm.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 border-border/50 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Type *</Label>
                  <Select value={addLeadForm.projectType} onValueChange={(value) => updateField("projectType", value)}>
                    <SelectTrigger className="h-11 border-border/50 bg-secondary/50">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Range *</Label>
                  <Select value={addLeadForm.budgetRange} onValueChange={(value) => updateField("budgetRange", value)}>
                    <SelectTrigger className="h-11 border-border/50 bg-secondary/50">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lead Status *</Label>
                  <Select value={addLeadForm.status} onValueChange={(value) => updateField("status", value as LeadStatus)}>
                    <SelectTrigger className="h-11 border-border/50 bg-secondary/50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source *</Label>
                  <Select value={addLeadForm.source} onValueChange={(value) => updateField("source", value)}>
                    <SelectTrigger className="h-11 border-border/50 bg-secondary/50">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Assigned Owner *</Label>
                  <Select value={addLeadForm.owner} onValueChange={(value) => updateField("owner", value)}>
                    <SelectTrigger className="h-11 border-border/50 bg-secondary/50">
                      <SelectValue placeholder="Assign an owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project Notes</Label>
                <Textarea
                  value={addLeadForm.projectDescription}
                  onChange={(e) => updateField("projectDescription", e.target.value)}
                  placeholder="Share the client goals, deadlines, deliverables, and special requests..."
                  className="min-h-[120px] resize-none border-border/50 bg-secondary/50"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddLeadOpen(false);
                    resetForm();
                  }}
                  className="border-border/50"
                >
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                  Add Lead
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
