import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { getLeads } from "@/lib/lead-store";
import { addProposalComment, approveProposalAndCreateProject, createOrUpdateProposal, getProposalByLeadId, requestProposalChanges } from "@/lib/collaboration-store";
import { toast } from "sonner";

export default function ProposalView() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const numericLeadId = Number(leadId);
  const [comment, setComment] = useState("");

  const lead = useMemo(() => getLeads().find((item) => item.id === numericLeadId), [numericLeadId]);
  const proposal = useMemo(() => (lead ? getProposalByLeadId(lead.id) : undefined), [lead]);

  if (!lead) {
    return <div className="min-h-screen bg-background p-8 text-foreground">Proposal not found.</div>;
  }

  const sendProposal = () => {
    createOrUpdateProposal(lead.id, `Proposal for ${lead.project}: budget ${lead.budgetLabel}`);
    toast.success("Proposal updated and shared");
  };

  const approve = () => {
    const project = approveProposalAndCreateProject(lead.id);
    toast.success("Proposal approved. Project started automatically.");
    if (project) {
      navigate(`/project/${project.id}`);
    }
  };

  const requestChanges = () => {
    requestProposalChanges(lead.id);
    toast.success("Changes requested successfully");
  };

  const addComment = () => {
    if (!comment.trim()) return;
    addProposalComment(lead.id, "admin", "Admin", comment.trim());
    setComment("");
    toast.success("Comment added");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Project Proposal</h1>
            <p className="text-sm text-muted-foreground">{lead.name} · {lead.company}</p>
            <p className="text-sm text-muted-foreground">Project: {lead.project} · Budget: {lead.budgetLabel}</p>
            <p className="text-sm text-muted-foreground">Status: {proposal?.status ?? "pending"}</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <h2 className="font-semibold text-foreground">Scope Summary</h2>
            <p className="text-sm text-muted-foreground">{lead.notes}</p>
          </GlassCard>

          <GlassCard className="space-y-3">
            <h2 className="font-semibold text-foreground">Timeline & Deliverables</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Week 1: Discovery + Design kickoff</p>
              <p>Week 2-3: Core build and integrations</p>
              <p>Week 4: QA + Launch</p>
            </div>
          </GlassCard>

          <div className="flex flex-wrap gap-2">
            <Button onClick={sendProposal}>Send Proposal</Button>
            <Button variant="outline" onClick={approve}>Approve</Button>
            <Button variant="outline" onClick={requestChanges}>Request Changes</Button>
          </div>

          <GlassCard className="space-y-3">
            <h2 className="font-semibold text-foreground">Comments</h2>
            <div className="space-y-2">
              {(proposal?.comments ?? []).map((item) => (
                <div key={`${item.author}-${item.createdAt}`} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                  <p className="text-xs text-muted-foreground">{item.author} · {item.role}</p>
                  <p className="text-sm text-foreground">{item.message}</p>
                </div>
              ))}
              {!(proposal?.comments ?? []).length ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
            </div>
            <div className="flex gap-2">
              <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add proposal note..." />
              <Button onClick={addComment}>Add</Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}
