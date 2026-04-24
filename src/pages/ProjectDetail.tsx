import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Brain, CalendarDays, CheckCircle, FileImage, GitBranch, MessageSquare, PlayCircle, Rocket, Sparkles, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { AIInsightBox } from "@/components/AIInsightBox";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addFigmaVersion, approveFigmaVersion, getProjectById, getProjects, getTeamAssignmentSnapshot, startProjectAutomation, type ProjectRecord } from "@/lib/project-store";
import { addActivityLog, addWorkUpload, getClientIntakeLinkForProject, getProjectActivityLogs, getProjectChat, getProjectWorkUploads, getProposalLinkForLeadId, postProjectChat, updateWorkUploadStatus } from "@/lib/collaboration-store";

const getFallbackProject = (id?: string, projectFromState?: ProjectRecord) => {
  const fromState = projectFromState;
  if (fromState) {
    return fromState;
  }

  const fromId = getProjectById(id);
  if (fromId) {
    return fromId;
  }

  return getProjects()[0];
};

const completedCount = (project: ProjectRecord) => project.tasks.filter((task) => task.status === "done").length;

const inProgressCount = (project: ProjectRecord) => project.tasks.filter((task) => task.status === "in-progress").length;

const delayedCount = (project: ProjectRecord) => project.tasks.filter((task) => task.delayed).length;

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const projectFromState = location.state && typeof location.state === "object" ? (location.state as { project?: ProjectRecord }).project : undefined;
  const [project, setProject] = useState<ProjectRecord | undefined>(() => getFallbackProject(id, projectFromState));
  const [figmaLinks, setFigmaLinks] = useState<Record<string, string>>({});
  const [designVersions, setDesignVersions] = useState<Record<string, string>>({});
  const [designNotes, setDesignNotes] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatTick, setChatTick] = useState(0);

  const refreshProject = () => setProject(getFallbackProject(id, projectFromState));

  if (!project) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-16">
          <GlassCard className="text-center space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Project not found</h2>
            <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  const totalTasks = project.tasks.length;
  const completedTasks = completedCount(project);
  const inProgressTasks = inProgressCount(project);
  const delayedTasks = delayedCount(project);
  const blockedTasks = project.tasks.filter((task) => task.status === "blocked").length;
  const designTasks = project.tasks.filter((task) => task.figma);

  const delayRisk = useMemo(() => {
    if (!project.tasks.length) return "low";
    const risk = delayedTasks / project.tasks.length;
    if (risk > 0.35) return "high";
    if (risk > 0.15) return "medium";
    return "low";
  }, [project.tasks.length, delayedTasks]);

  const chatMessages = useMemo(() => getProjectChat(project.id), [project.id, chatTick]);
  const workUploads = useMemo(() => getProjectWorkUploads(project.id), [project.id, project.updatedAt]);
  const activityLogs = useMemo(() => getProjectActivityLogs(project.id), [project.id, project.updatedAt, chatTick]);

  const teamSnapshot = useMemo(() => getTeamAssignmentSnapshot(), [project.updatedAt]);

  const workloadByAssignee = useMemo(() => {
    const map = new Map(teamSnapshot.map((item) => [item.assignee, item]));
    return project.tasks
      .map((task) => {
        const stats = map.get(task.assignee);
        const loadPercent = stats ? Math.round((stats.total / Math.max(stats.total + 2, 1)) * 100) : 0;
        return {
          taskId: task.id,
          taskName: task.name,
          assignee: task.assignee,
          loadPercent,
          suggestion: loadPercent > 70 ? "Suggest assigning backup developer" : "Current assignee is optimal",
        };
      })
      .slice(0, 6);
  }, [project.tasks, teamSnapshot]);

  const startProject = () => {
    startProjectAutomation(project.id);
    addActivityLog(project.id, "Admin", "Started project automation");
    refreshProject();
    toast.success("Project started", { description: "Tasks generated, assigned by role, and tracking activated." });
  };

  const uploadDesign = (taskId: string) => {
    const url = figmaLinks[taskId]?.trim();
    const versionLabel = designVersions[taskId]?.trim() || "V1";
    const notes = designNotes[taskId]?.trim();
    if (!url) {
      toast.error("Add a Figma URL first");
      return;
    }

    addFigmaVersion(project.id, taskId, url);
    addWorkUpload(project.id, taskId, "Designer", url, versionLabel, notes || undefined, "design");
    addActivityLog(project.id, "Designer", `Uploaded design version for ${taskId}`);
    setFigmaLinks((prev) => ({ ...prev, [taskId]: "" }));
    setDesignVersions((prev) => ({ ...prev, [taskId]: "" }));
    setDesignNotes((prev) => ({ ...prev, [taskId]: "" }));
    refreshProject();
    toast.success("Figma version uploaded", { description: "Client approval requested." });
  };

  const approveLatest = (taskId: string) => {
    const task = project.tasks.find((item) => item.id === taskId);
    const latest = task?.figma?.versions.at(-1);
    if (!latest) {
      toast.error("No version available to approve");
      return;
    }

    approveFigmaVersion(project.id, taskId, latest.id);
    const upload = getProjectWorkUploads(project.id).find((item) => item.taskId === taskId && item.versionLabel === latest.label);
    if (upload) {
      updateWorkUploadStatus(upload.id, "approved");
    }
    addActivityLog(project.id, "Client", `Approved design version ${latest.label}`);
    refreshProject();
    toast.success("Design approved", { description: "Frontend dependencies unlocked." });
  };

  const sendClientLink = (channel: "copy" | "email" | "whatsapp") => {
    const link = getClientIntakeLinkForProject(project.id);
    if (!link) {
      toast.error("No client link available for this project");
      return;
    }

    if (channel === "copy") {
      navigator.clipboard.writeText(link);
      window.open(link, "_blank", "noopener,noreferrer");
      toast.success("Client intake link copied");
      return;
    }

    if (channel === "email") {
      window.open(`mailto:${project.email}?subject=Complete Your Project Intake&body=Hi ${project.client}, please complete your project intake form here: ${link}`, "_blank");
      window.open(link, "_blank", "noopener,noreferrer");
      toast.success("Email draft opened");
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${project.client}, please fill this intake form: ${link}`)}`, "_blank");
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp message opened");
  };

  const sendProposal = () => {
    const link = getProposalLinkForLeadId(project.leadId);
    navigator.clipboard.writeText(link);
    toast.success("Proposal link copied and ready to share with client");
  };

  const sendChat = () => {
    if (!chatInput.trim()) {
      return;
    }
    postProjectChat(project.id, "admin", "Project Manager", chatInput.trim());
    addActivityLog(project.id, "Project Manager", "Posted project chat message");
    setChatInput("");
    setChatTick((prev) => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-7">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card/95 via-card/85 to-primary/10 p-6 shadow-2xl shadow-primary/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_35%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_28%)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <Button variant="outline" onClick={() => navigate("/projects")} className="w-fit border-border/50 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
              </Button>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{project.title}</h1>
                    <p className="text-sm text-muted-foreground">{project.company} · {project.client} · {project.budgetLabel}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-sm leading-7 text-muted-foreground max-w-3xl">{project.summary}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tasks Done</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{completedTasks}/{totalTasks}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">In Progress</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{inProgressTasks}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Blocked</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{blockedTasks}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Delayed</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{delayedTasks}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Completion</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{project.completion}%</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:w-[320px]">
              <Button className="gradient-primary text-primary-foreground glow-primary hover:opacity-90" onClick={startProject}>
                <PlayCircle className="w-4 h-4 mr-2" /> Start Project
              </Button>
              <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => toast.success("Client update sent") }>
                <MessageSquare className="w-4 h-4 mr-2" /> Send Client Update
              </Button>
              <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => sendClientLink("email") }>
                <Sparkles className="w-4 h-4 mr-2" /> Send Client Link
              </Button>
              <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={sendProposal }>
                <FileImage className="w-4 h-4 mr-2" /> Send Proposal
              </Button>
              <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => navigate("/tasks") }>
                <Sparkles className="w-4 h-4 mr-2" /> Open Smart Task Board
              </Button>
            </div>
          </div>
        </div>

        <AIInsightBox
          insight={`AI suggestion: delay risk is ${delayRisk}. ${blockedTasks} blocked tasks need dependency clearance. If backend delay continues, add one more backend contributor.`}
          action="Apply Suggestion"
          variant={delayRisk === "high" ? "warning" : "default"}
        />

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <GlassCard className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Task Status and Dependencies</h2>
              </div>
              <ProgressBar value={project.completion} label="Execution progress" />
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.name}</p>
                        <p className="text-xs text-muted-foreground">{task.assignee} · {task.role.replace("-", " ")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.delayed ? <AlertTriangle className="w-4 h-4 text-destructive" /> : null}
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Priority: {task.priority}</span>
                      <span>Due in {task.estimatedDays} days</span>
                      <span>{task.autoAssigned ? "Auto assigned" : "Manual"}</span>
                    </div>
                    {task.dependsOn.length ? (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranch className="w-3.5 h-3.5" /> Depends on {task.dependsOn.join(", ")}
                      </div>
                    ) : null}
                    <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full gradient-primary" style={{ width: `${task.progress}%` }} />
                    </div>
                    <div className="mt-3 space-y-1">
                      {workUploads.filter((upload) => upload.taskId === task.id).slice(0, 3).map((upload) => (
                        <div key={upload.id} className="text-xs text-muted-foreground rounded-md border border-border/40 bg-background/30 px-2 py-1">
                          Output: {upload.versionLabel ?? "Update"} · {upload.uploadedBy} · {upload.reviewStatus ?? "pending"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Figma Design Flow</h2>
              </div>

              {designTasks.length ? (
                <div className="space-y-4">
                  {designTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{task.name}</p>
                          <p className="text-xs text-muted-foreground">Assigned to {task.assignee}</p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={designVersions[task.id] ?? ""}
                          onChange={(event) => setDesignVersions((prev) => ({ ...prev, [task.id]: event.target.value }))}
                          placeholder="Version label: V1 / V2 / Final"
                          className="bg-card/60 border-border/50"
                        />
                        <Input
                          value={figmaLinks[task.id] ?? ""}
                          onChange={(event) => setFigmaLinks((prev) => ({ ...prev, [task.id]: event.target.value }))}
                          placeholder="Paste Figma link for V1 / V2 / Final"
                          className="bg-card/60 border-border/50"
                        />
                        <Button variant="outline" onClick={() => uploadDesign(task.id)}>
                          <Upload className="w-4 h-4 mr-2" /> Upload Version
                        </Button>
                      </div>
                      <Input
                        value={designNotes[task.id] ?? ""}
                        onChange={(event) => setDesignNotes((prev) => ({ ...prev, [task.id]: event.target.value }))}
                        placeholder="What changed in this version?"
                        className="bg-card/60 border-border/50"
                      />

                      <div className="space-y-2">
                        {(task.figma?.versions ?? []).map((version) => (
                          <div key={version.id} className="rounded-lg border border-border/50 bg-background/40 px-3 py-2 flex items-center justify-between gap-2">
                            <a href={version.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                              {version.label} Live Preview
                            </a>
                            <div className="flex items-center gap-2">
                              {task.figma?.approvedVersionId === version.id ? <StatusBadge status="done" /> : null}
                              {task.figma?.approvedVersionId !== version.id ? (
                                <Button size="sm" className="h-7 text-xs" onClick={() => approveLatest(task.id)}>
                                  Approve
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Design History Timeline</p>
                        {workUploads
                          .filter((upload) => upload.taskId === task.id && upload.type === "design")
                          .map((upload) => (
                            <div key={`history-${upload.id}`} className="rounded-lg border border-border/40 bg-card/40 p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-foreground">{upload.versionLabel ?? "Version"}</p>
                                <span className="text-[11px] text-muted-foreground">{new Date(upload.createdAt).toLocaleString()}</span>
                              </div>
                              {upload.notes ? <p className="text-xs text-muted-foreground mt-1">{upload.notes}</p> : null}
                              <div className="mt-2 flex items-center gap-2">
                                <a href={upload.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View</a>
                                <a href={upload.fileUrl} download className="text-xs text-primary hover:underline">Download</a>
                                <span className="text-[11px] rounded-full border border-border/50 px-2 py-0.5 text-muted-foreground">{upload.reviewStatus ?? "pending"}</span>
                              </div>
                            </div>
                          ))}
                        {!workUploads.filter((upload) => upload.taskId === task.id && upload.type === "design").length ? (
                          <p className="text-xs text-muted-foreground">No design timeline entries yet.</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No design tasks with Figma workflow yet.</p>
              )}
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Client Visibility</h3>
              <div className="space-y-2 text-sm">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Design previews and approvals are visible live.</div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Progress board updates when statuses change.</div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">Delay alerts are surfaced to managers immediately.</div>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {project.notifications.length ? (
                  project.notifications.map((notification) => (
                    <div key={notification.id} className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2">
                      <p className="text-sm text-foreground">{notification.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                )}
              </div>
            </GlassCard>

            <GlassCard className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Communication</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => sendClientLink("copy")}>Copy Link</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => sendClientLink("email")}>Send Email</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => sendClientLink("whatsapp")}>WhatsApp</Button>
              </div>
              <Button variant="outline" className="justify-start border-border/50 text-muted-foreground hover:text-foreground" onClick={() => toast.success("Status update sent") }>
                <MessageSquare className="w-4 h-4 mr-2" /> Send status update
              </Button>
              <Button variant="outline" className="justify-start border-border/50 text-muted-foreground hover:text-foreground" onClick={() => toast.success("Meeting scheduled") }>
                <CalendarDays className="w-4 h-4 mr-2" /> Schedule meeting
              </Button>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Smart Team Assignment</h3>
              <div className="space-y-2">
                {workloadByAssignee.map((item) => (
                  <div key={item.taskId} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                    <p className="text-sm font-medium text-foreground">{item.taskName}</p>
                    <p className="text-xs text-muted-foreground">{item.assignee} workload: {item.loadPercent}%</p>
                    <p className="text-xs text-primary mt-1">{item.suggestion}</p>
                  </div>
                ))}
                {!workloadByAssignee.length ? <p className="text-sm text-muted-foreground">No assignment suggestions yet.</p> : null}
              </div>
              <Button variant="outline" onClick={() => toast.success("Auto assign suggestions applied")}>Auto Assign Suggestion</Button>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Project Chat</h3>
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                {chatMessages.map((message) => (
                  <div key={message.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <p className="text-xs text-muted-foreground">{message.author} · {message.authorRole}</p>
                    <p className="text-sm text-foreground">{message.message}</p>
                  </div>
                ))}
                {!chatMessages.length ? <p className="text-sm text-muted-foreground">No messages yet.</p> : null}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Send project update..." />
                <Button onClick={sendChat}>Send</Button>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Admin Sync: Uploads and Completion Logs</h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {workUploads.slice(0, 8).map((upload) => (
                  <div key={upload.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <p className="text-sm text-foreground">{upload.uploadedBy} uploaded {upload.versionLabel ?? "work update"}</p>
                    <a href={upload.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Open file link
                    </a>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(upload.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!workUploads.length ? <p className="text-sm text-muted-foreground">No uploads yet.</p> : null}
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activityLogs.slice(0, 12).map((log) => (
                  <div key={log.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <p className="text-sm text-foreground">{log.actor}: {log.action}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!activityLogs.length ? <p className="text-sm text-muted-foreground">No activity logs yet.</p> : null}
              </div>
            </GlassCard>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Project Brain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AIInsightBox insight="Dependency engine auto-locks frontend until design approval is complete." variant="warning" />
            <AIInsightBox insight={`Completed tasks: ${completedTasks}/${totalTasks}. Execution pace is ${project.completion}% healthy.`} variant="success" />
            <AIInsightBox insight="Smart balancer can reassign delayed tasks to lower-load teammates." variant="default" action="Rebalance" />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
