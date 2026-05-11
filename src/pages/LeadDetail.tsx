import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  CheckCircle,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Target,
  User,
  Building2,
  FolderKanban,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createProjectFromLead, type LeadLike } from "@/lib/project-store";
import { getClientIntakeLinkForLead, getProposalLinkForLeadId } from "@/lib/collaboration-store";
import { getLeadById, updateLead } from "@/lib/lead-store";

type Lead = LeadLike & {
  projectDescription?: string;
};

const fallbackLead: Lead = {
  id: 1,
  dealId: "DEAL-1042",
  name: "Rahul Sharma",
  company: "Rahul Enterprises",
  project: "E-commerce Website",
  status: "hot",
  budgetLabel: "₹1,50,000",
  budgetValue: 150000,
  score: 94,
  source: "Website inquiry",
  owner: "Meera",
  phone: "+91 98765 43210",
  email: "rahul@rahulent.com",
  insight: "Decision maker, ready to close",
  nextAction: "Send proposal and schedule kickoff call",
  lastActivity: "2 hours ago",
  notes: "Prioritize this lead. Client wants a polished launch and a clear delivery plan.",
  projectDescription: "Needs a high-conversion e-commerce website with payments, tracking, and admin dashboard.",
  createdAt: Date.now(),
};

export default function LeadDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const leadFromState = location.state && typeof location.state === "object" ? (location.state as { lead?: Lead }).lead : undefined;
  const lead = leadFromState ?? getLeadById(id) ?? fallbackLead;

  const moveToProject = () => {
    const project = createProjectFromLead(lead);
    toast.success("Lead moved to project workflow");
    navigate(`/project/${project.id}`, { state: { project } });
  };

  const sendClientLink = (channel: "copy" | "email" | "whatsapp") => {
    const intakeLink = getClientIntakeLinkForLead(lead);
    if (channel === "copy") {
      navigator.clipboard.writeText(intakeLink);
      window.open(intakeLink, "_blank", "noopener,noreferrer");
      toast.success("Client intake link copied");
      return;
    }

    if (channel === "email") {
      window.open(`mailto:${lead.email}?subject=Complete Your Project Intake&body=Hi ${lead.name}, please complete your project intake form here: ${intakeLink}`, "_blank");
      window.open(intakeLink, "_blank", "noopener,noreferrer");
      toast.success("Email draft opened");
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${lead.name}, please fill this intake form: ${intakeLink}`)}`, "_blank");
    window.open(intakeLink, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp message opened");
  };

  const sendProposal = () => {
    const proposalLink = getProposalLinkForLeadId(lead.id);
    navigator.clipboard.writeText(proposalLink);
    toast.success("Proposal link copied and ready to share with client");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => navigate("/leads")}
              className="w-fit border-border/50 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leads
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{lead.name}</h1>
                <StatusBadge status={lead.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {lead.company} · {lead.project} · Deal {lead.dealId}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/50 bg-secondary/30 px-2.5 py-1">Owner: {lead.owner ?? "Unassigned"}</span>
                <span className="rounded-full border border-border/50 bg-secondary/30 px-2.5 py-1">Source: {lead.source ?? "Lead form"}</span>
                <span className="rounded-full border border-border/50 bg-secondary/30 px-2.5 py-1">Score: {lead.score ?? 0}/100</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => toast.success("Call started") }>
              <Phone className="w-4 h-4 mr-2" /> Call
            </Button>
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => toast.success("Email draft opened") }>
              <Mail className="w-4 h-4 mr-2" /> Email
            </Button>
            <Button className="gradient-primary text-primary-foreground glow-primary hover:opacity-90" onClick={() => toast.success("Follow-up scheduled") }>
              <CalendarDays className="w-4 h-4 mr-2" /> Schedule Follow-up
            </Button>
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={moveToProject}>
              <FolderKanban className="w-4 h-4 mr-2" /> Move to Project
            </Button>
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => sendClientLink("email")}>
              <MessageCircle className="w-4 h-4 mr-2" /> Send Client Link
            </Button>
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={sendProposal}>
              <Sparkles className="w-4 h-4 mr-2" /> Send Proposal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <GlassCard className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lead Overview</p>
                  <h2 className="text-xl font-semibold text-foreground mt-1">Complete information</h2>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><User className="w-4 h-4" /> Client Name</div>
                  <p className="text-foreground font-medium">{lead.name}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Building2 className="w-4 h-4" /> Company</div>
                  <p className="text-foreground font-medium">{lead.company}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Target className="w-4 h-4" /> Project</div>
                  <p className="text-foreground font-medium">{lead.project}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Clock className="w-4 h-4" /> Last Activity</div>
                  <p className="text-foreground font-medium">{lead.lastActivity}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Budget</p>
                  <p className="text-lg font-semibold text-foreground">{lead.budgetLabel}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Source</p>
                  <p className="text-lg font-semibold text-foreground">{lead.source ?? "Lead form"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Owner</p>
                  <p className="text-lg font-semibold text-foreground">{lead.owner ?? "Unassigned"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Score</p>
                  <p className="text-lg font-semibold text-foreground">{lead.score ?? 0}/100</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Brain className="w-4 h-4 text-primary" /> AI Insight
                </div>
                <p className="text-sm text-muted-foreground leading-6">{lead.insight}</p>
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Project Description</p>
                <p className="text-sm text-muted-foreground leading-6">
                  {lead.projectDescription ?? "This lead is ready for a complete project discussion. Capture business goals, deadlines, and scope here."}
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Internal Notes</p>
                <p className="text-sm text-muted-foreground leading-6">
                  {lead.notes ?? "No internal notes added yet."}
                </p>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" /> Recommended Next Steps
              </h3>
              <div className="grid gap-3">
                {[
                  lead.nextAction ?? "Send proposal and schedule kickoff call",
                  "Confirm budget and timeline",
                  "Share reference projects and scope breakdown",
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground mb-1">Phone</p>
                  <p className="text-foreground font-medium">{lead.phone ?? "+91 00000 00000"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-medium">{lead.email ?? `${lead.name.toLowerCase().replace(/\s+/g, ".")}@company.com`}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground mb-1">Lead ID</p>
                  <p className="text-foreground font-medium">{lead.dealId}</p>
                </div>
              </div>
            </GlassCard>

          </div>
        </div>

        

        <p className="text-xs text-muted-foreground text-center">Viewing lead {id}</p>
      </div>
    </DashboardLayout>
  );
}