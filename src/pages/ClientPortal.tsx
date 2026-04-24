import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { AIInsightBox } from "@/components/AIInsightBox";
import { addActivityLog, addProposalComment, approveProposalAndCreateProject, getClientAccessById, getProjectChat, getProjectWorkUploads, getProposalByLeadId, postProjectChat, requestProposalChanges, touchClientActivity, touchClientReplyForLead, updateWorkUploadStatus } from "@/lib/collaboration-store";
import { getLeads } from "@/lib/lead-store";
import { approveFigmaVersion, getProjectById } from "@/lib/project-store";
import { toast } from "sonner";
import { clearAuthSession } from "@/lib/auth-store";

export default function ClientPortal() {
  const { accessId } = useParams();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [proposalComment, setProposalComment] = useState("");
  const [tick, setTick] = useState(0);

  const access = useMemo(() => getClientAccessById(accessId), [accessId, tick]);
  const lead = useMemo(() => {
    if (!access) return undefined;
    return getLeads().find((item) => item.id === access.leadId);
  }, [access]);

  const project = useMemo(() => {
    if (!access?.projectId) return undefined;
    return getProjectById(access.projectId);
  }, [access, tick]);

  const proposal = useMemo(() => (lead ? getProposalByLeadId(lead.id) : undefined), [lead, tick]);
  const chat = useMemo(() => (project ? getProjectChat(project.id) : []), [project, tick]);
  const workUploads = useMemo(() => (project ? getProjectWorkUploads(project.id) : []), [project, tick]);

  useEffect(() => {
    if (!accessId) return;
    touchClientActivity(accessId);
    const timer = window.setInterval(() => setTick((prev) => prev + 1), 2500);
    return () => window.clearInterval(timer);
  }, [accessId]);

  if (!access || !lead) {
    return <div className="min-h-screen bg-background p-8 text-foreground">Invalid client link.</div>;
  }

  const approve = () => {
    const created = approveProposalAndCreateProject(lead.id);
    if (created) {
      addActivityLog(created.id, lead.name, "Client approved proposal and started project");
    }
    touchClientReplyForLead(lead.id);
    setTick((prev) => prev + 1);
    toast.success(created ? "Approved. Project started." : "Approved.");
  };

  const reject = () => {
    requestProposalChanges(lead.id);
    if (project) {
      addActivityLog(project.id, lead.name, "Client requested proposal changes");
    }
    touchClientReplyForLead(lead.id);
    setTick((prev) => prev + 1);
    toast.success("Feedback submitted.");
  };

  const sendMessage = () => {
    if (!project || !chatInput.trim()) return;
    postProjectChat(project.id, "client", lead.name, chatInput.trim());
    addActivityLog(project.id, lead.name, "Client posted project chat message");
    touchClientReplyForLead(lead.id);
    setChatInput("");
    setTick((prev) => prev + 1);
  };

  const addClientProposalComment = () => {
    if (!proposalComment.trim()) return;
    addProposalComment(lead.id, "client", lead.name, proposalComment.trim());
    if (project) {
      addActivityLog(project.id, lead.name, "Client added proposal comment");
    }
    setProposalComment("");
    setTick((prev) => prev + 1);
  };

  const approveDesignVersion = (taskId: string, versionId: string, label: string) => {
    if (!project) return;
    approveFigmaVersion(project.id, taskId, versionId);
    const upload = getProjectWorkUploads(project.id).find((item) => item.taskId === taskId && item.versionLabel === label);
    if (upload) {
      updateWorkUploadStatus(upload.id, "approved");
    }
    addActivityLog(project.id, lead.name, `Client approved design ${label}`);
    touchClientReplyForLead(lead.id);
    setTick((prev) => prev + 1);
    toast.success("Design version approved");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <GlassCard className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-foreground">Client Portal</h1>
            <Button variant="outline" size="sm" onClick={() => { clearAuthSession(); navigate("/client/login"); }}>Logout</Button>
          </div>
          <p className="text-sm text-muted-foreground">{lead.name} · {lead.company} · {lead.project}</p>
          <p className="text-xs text-muted-foreground">Secure access: {access.id}</p>
        </GlassCard>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-6">
            <GlassCard className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Project Progress</h2>
              <ProgressBar value={project?.completion ?? 0} label="Execution progress" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="text-sm text-foreground">{project?.currentPhase ?? "Planning"} {"->"} Delivery</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <p className="text-sm text-foreground">{project?.milestones.map((item) => `${item.name}: ${item.status}`).join(" | ") ?? "Pending proposal approval"}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Design Preview & Versions</h2>
              <div className="space-y-2">
                {(project?.tasks.filter((task) => task.figma) ?? []).map((task) => (
                  <div key={task.id} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{task.name}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="mt-2 space-y-2">
                      {(task.figma?.versions ?? []).map((version) => (
                        <div key={version.id} className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-foreground">{version.label}</p>
                            <span className="text-[11px] text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <a href={version.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a>
                            <a href={version.url} download className="text-primary hover:underline">Download</a>
                            <span className="rounded-full border border-border/50 px-2 py-0.5 text-muted-foreground">
                              {task.figma?.approvedVersionId === version.id ? "approved" : "pending"}
                            </span>
                            {task.figma?.approvedVersionId !== version.id ? (
                              <Button size="sm" className="h-7 text-xs" onClick={() => approveDesignVersion(task.id, version.id, version.label)}>
                                Approve this version
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {!task.figma?.versions.length ? <p className="text-xs text-muted-foreground">No versions yet</p> : null}
                    </div>

                    <div className="mt-3 rounded-lg border border-border/40 bg-background/30 p-2.5 space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Design History</p>
                      {workUploads
                        .filter((upload) => upload.taskId === task.id && upload.type === "design")
                        .map((upload) => (
                          <p key={upload.id} className="text-xs text-muted-foreground">
                            {upload.versionLabel ?? "Version"} · {upload.reviewStatus ?? "pending"} · {new Date(upload.createdAt).toLocaleDateString()}
                          </p>
                        ))}
                      {!workUploads.filter((upload) => upload.taskId === task.id && upload.type === "design").length ? (
                        <p className="text-xs text-muted-foreground">No design history yet.</p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!project?.tasks.filter((task) => task.figma).length ? <p className="text-sm text-muted-foreground">No design shared yet.</p> : null}
              </div>
            </GlassCard>

            <GlassCard className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Approval</h2>
              <p className="text-sm text-muted-foreground">Proposal status: {proposal?.status ?? "pending"}</p>
              <div className="flex gap-2">
                <Button onClick={approve}>Approve</Button>
                <Button variant="outline" onClick={reject}>Reject / Request Changes</Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Proposal comments</p>
                {(proposal?.comments ?? []).map((comment) => (
                  <div key={`${comment.author}-${comment.createdAt}`} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <p className="text-xs text-muted-foreground">{comment.author} · {comment.role}</p>
                    <p className="text-sm text-foreground">{comment.message}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={proposalComment} onChange={(event) => setProposalComment(event.target.value)} placeholder="Add proposal comment..." />
                  <Button onClick={addClientProposalComment}>Comment</Button>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <AIInsightBox
              insight="AI recommendation: Approve design V2 to unlock frontend sprint immediately and avoid schedule drift."
              action="Review"
            />

            <GlassCard className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Real-time Chat</h3>
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {chat.map((message) => (
                  <div key={message.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <p className="text-xs text-muted-foreground">{message.author} · {message.authorRole}</p>
                    <p className="text-sm text-foreground">{message.message}</p>
                  </div>
                ))}
                {!chat.length ? <p className="text-sm text-muted-foreground">No messages yet.</p> : null}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send message..." />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
