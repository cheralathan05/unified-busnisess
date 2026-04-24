import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock3,
  Code2,
  Download,
  FileText,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  PlayCircle,
  Send,
  Sparkles,
  TimerReset,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { clearAuthSession } from "@/lib/auth-store";
import { addActivityLog, addWorkUpload, getProjectActivityLogs, getProjectChat, postProjectChat } from "@/lib/collaboration-store";
import { getProjects, updateProjectTaskStatus, type ProjectRecord, type ProjectTask } from "@/lib/project-store";
import { toast } from "sonner";

type WorkspaceSection = "focus" | "tasks" | "details" | "collaboration" | "report";

type MyTask = {
  id: string;
  projectId: string;
  taskId: string;
  project: ProjectRecord;
  task: ProjectTask;
};

const checklistByArea = (task: ProjectTask) => {
  if (task.area === "frontend") {
    return ["Open latest Figma", "Build responsive layout", "Connect cart API", "Test mobile + desktop", "Submit for review"];
  }
  if (task.area === "backend") {
    return ["Review API contract", "Implement endpoint logic", "Add validations", "Write tests", "Submit for review"];
  }
  if (task.area === "integration") {
    return ["Verify integration docs", "Implement webhook flow", "Handle failures", "Test edge cases", "Submit for review"];
  }
  return ["Review scope", "Execute core work", "Validate output", "Submit for review"];
};

const deadlineDays = (dueAt: number) => Math.max(0, Math.ceil((dueAt - Date.now()) / (1000 * 60 * 60 * 24)));

export default function DeveloperWorkspace() {
  const { name, section } = useParams();
  const navigate = useNavigate();
  const memberName = decodeURIComponent(name ?? "Alex Rivera");

  const validSections: WorkspaceSection[] = ["focus", "tasks", "details", "collaboration", "report"];
  const currentSection: WorkspaceSection = validSections.includes((section ?? "") as WorkspaceSection)
    ? (section as WorkspaceSection)
    : "focus";

  const [projects, setProjects] = useState<ProjectRecord[]>(() => getProjects());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatTick, setChatTick] = useState(0);
  const [uploadLink, setUploadLink] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadVersion, setUploadVersion] = useState("V1");
  const [blockReason, setBlockReason] = useState("");
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [checksByTask, setChecksByTask] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    if (!section) {
      navigate(`/developer-workspace/${encodeURIComponent(memberName)}/focus`, { replace: true });
    }
  }, [memberName, navigate, section]);

  useEffect(() => {
    if (!activeTimerTaskId) return;
    const timer = window.setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeTimerTaskId]);

  const myTasks = useMemo<MyTask[]>(
    () =>
      projects
        .flatMap((project) =>
          project.tasks
            .filter((task) => task.assignee.toLowerCase() === memberName.toLowerCase())
            .map((task) => ({
              id: `${project.id}-${task.id}`,
              projectId: project.id,
              taskId: task.id,
              project,
              task,
            })),
        )
        .sort((a, b) => a.task.dueAt - b.task.dueAt),
    [memberName, projects],
  );

  const selectedTask = useMemo(() => myTasks.find((t) => t.id === selectedTaskId) ?? myTasks[0], [myTasks, selectedTaskId]);
  const currentProject = selectedTask?.project;
  const chats = useMemo(() => (currentProject ? getProjectChat(currentProject.id).filter((m) => m.authorRole !== "client") : []), [currentProject, chatTick]);
  const activities = useMemo(() => (currentProject ? getProjectActivityLogs(currentProject.id).slice(0, 8) : []), [currentProject, projects, chatTick]);

  useEffect(() => {
    if (!selectedTaskId && myTasks.length) {
      setSelectedTaskId(myTasks[0].id);
    }
  }, [myTasks, selectedTaskId]);

  useEffect(() => {
    if (!selectedTask) return;
    if (checksByTask[selectedTask.taskId]) return;
    setChecksByTask((prev) => ({
      ...prev,
      [selectedTask.taskId]: new Array(checklistByArea(selectedTask.task).length).fill(false),
    }));
  }, [checksByTask, selectedTask]);

  const stats = useMemo(() => {
    const total = myTasks.length;
    const done = myTasks.filter((t) => t.task.status === "done").length;
    const blocked = myTasks.filter((t) => t.task.status === "blocked").length;
    const inProgress = myTasks.filter((t) => t.task.status === "in-progress").length;
    return {
      total,
      done,
      blocked,
      inProgress,
      efficiency: total ? Math.round((done / total) * 100) : 0,
    };
  }, [myTasks]);

  const refreshProjects = () => setProjects(getProjects());

  const updateStatus = (status: ProjectTask["status"]) => {
    if (!selectedTask) return;
    updateProjectTaskStatus(selectedTask.projectId, selectedTask.taskId, status);
    addActivityLog(selectedTask.projectId, memberName, `${status === "done" ? "Completed" : "Updated"} ${selectedTask.task.name} (${status})`);
    refreshProjects();
    toast.success(`Task moved to ${status}`);
  };

  const markBlocked = () => {
    if (!selectedTask) return;
    if (!blockReason.trim()) {
      toast.error("Add block reason first");
      return;
    }
    updateProjectTaskStatus(selectedTask.projectId, selectedTask.taskId, "blocked");
    addActivityLog(selectedTask.projectId, memberName, `Blocked ${selectedTask.task.name}: ${blockReason.trim()}`);
    postProjectChat(selectedTask.projectId, "team", memberName, `Blocked ${selectedTask.task.name}. Reason: ${blockReason.trim()}`);
    setBlockReason("");
    setChatTick((prev) => prev + 1);
    refreshProjects();
    toast.success("Block update shared with team");
  };

  const sendTeamMessage = () => {
    if (!currentProject || !chatInput.trim()) return;
    postProjectChat(currentProject.id, "team", memberName, chatInput.trim());
    setChatInput("");
    setChatTick((prev) => prev + 1);
    toast.success("Message sent");
  };

  const submitWork = () => {
    if (!selectedTask || !uploadLink.trim()) {
      toast.error("Add submission link first");
      return;
    }
    addWorkUpload(selectedTask.projectId, selectedTask.taskId, memberName, uploadLink.trim(), uploadVersion.trim() || "V1", uploadNotes.trim() || undefined, "code");
    addActivityLog(selectedTask.projectId, memberName, `Submitted ${selectedTask.task.name} for review (${uploadVersion})`);
    setUploadLink("");
    setUploadNotes("");
    setUploadVersion("V1");
    setProjects(getProjects());
    toast.success("Work submitted for review");
  };

  const toggleCheck = (index: number) => {
    if (!selectedTask) return;
    const current = checksByTask[selectedTask.taskId] ?? [];
    const next = [...current];
    next[index] = !next[index];
    setChecksByTask((prev) => ({ ...prev, [selectedTask.taskId]: next }));
  };

  const formatTimer = () => {
    const h = String(Math.floor(timerSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(timerSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const checks = selectedTask ? checksByTask[selectedTask.taskId] ?? [] : [];
  const checklist = selectedTask ? checklistByArea(selectedTask.task) : [];
  const progress = checklist.length ? Math.round((checks.filter(Boolean).length / checklist.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(0,184,148,0.14),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(245,166,35,0.12),transparent_40%)] bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">Mission Control</p>
              <h2 className="text-xl font-semibold text-foreground">{memberName}</h2>
              <p className="text-xs text-muted-foreground">AI-guided execution workspace</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-black/20 p-2">
                <p className="text-muted-foreground">Tasks</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-black/20 p-2">
                <p className="text-muted-foreground">Done</p>
                <p className="text-lg font-semibold">{stats.done}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-black/20 p-2">
                <p className="text-muted-foreground">Blocked</p>
                <p className="text-lg font-semibold">{stats.blocked}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-black/20 p-2">
                <p className="text-muted-foreground">Efficiency</p>
                <p className="text-lg font-semibold">{stats.efficiency}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button variant={currentSection === "focus" ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate(`/developer-workspace/${encodeURIComponent(memberName)}/focus`)}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Focus
              </Button>
              <Button variant={currentSection === "tasks" ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate(`/developer-workspace/${encodeURIComponent(memberName)}/tasks`)}>
                <ListTodo className="mr-2 h-4 w-4" /> Task Queue
              </Button>
              <Button variant={currentSection === "details" ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate(`/developer-workspace/${encodeURIComponent(memberName)}/details`)}>
                <Code2 className="mr-2 h-4 w-4" /> Task Detail
              </Button>
              <Button variant={currentSection === "collaboration" ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate(`/developer-workspace/${encodeURIComponent(memberName)}/collaboration`)}>
                <MessageSquare className="mr-2 h-4 w-4" /> Collaboration
              </Button>
              <Button variant={currentSection === "report" ? "default" : "ghost"} className="w-full justify-start" onClick={() => navigate(`/developer-workspace/${encodeURIComponent(memberName)}/report`)}>
                <Sparkles className="mr-2 h-4 w-4" /> Daily Report
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              <Button variant="outline" className="w-full" onClick={() => navigate("/chat")}>Open Team Chat</Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  clearAuthSession();
                  navigate("/login");
                }}
              >
                Logout
              </Button>
            </div>
          </aside>

          <main className="space-y-4">
            <GlassCard className="border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-amber-500/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Current Mission</p>
                  <h1 className="text-2xl font-bold text-foreground">{selectedTask?.task.name ?? "No active task"}</h1>
                  <p className="text-sm text-muted-foreground">{selectedTask?.project.title ?? "No project"} • {selectedTask?.project.client ?? "No client"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {selectedTask ? <StatusBadge status={selectedTask.task.status} /> : null}
                    <span className="rounded-full border border-border/60 px-2 py-1 text-xs text-muted-foreground">Deadline: {selectedTask ? `${deadlineDays(selectedTask.task.dueAt)} days` : "-"}</span>
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">AI Confidence: 92%</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => updateStatus("in-progress")}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Start Task
                  </Button>
                  <Button variant="outline" onClick={() => navigate(selectedTask ? `/task/${selectedTask.projectId}/${selectedTask.taskId}` : "/chat")}>
                    Open Detail
                  </Button>
                  <Button variant="outline" onClick={refreshProjects}>Refresh</Button>
                </div>
              </div>
            </GlassCard>

            <div className={currentSection === "focus" ? "grid gap-4 lg:grid-cols-[1.4fr_1fr]" : "hidden"}>
              <GlassCard className="space-y-4">
                <h3 className="text-base font-semibold">Active Task Command Card</h3>
                {selectedTask ? (
                  <>
                    <p className="text-sm text-muted-foreground">AI Instruction: Build exactly as approved design, keep reusable structure, and connect API states cleanly.</p>
                    <ProgressBar value={selectedTask.task.progress || progress} label={`Progress ${selectedTask.task.progress || progress}%`} />
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Button onClick={() => updateStatus("in-progress")}>Start</Button>
                      <Button variant="outline" onClick={() => toast.success("Opening design resources")}>Open Design</Button>
                      <Button variant="outline" onClick={() => toast.success("Opening docs")}>Docs</Button>
                      <Button variant="outline" onClick={() => toast.success("AI assistant ready")}>Ask AI</Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No task assigned yet.</p>
                )}
              </GlassCard>

              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Live Work</h3>
                <div className="rounded-xl border border-border/60 bg-black/20 p-3">
                  <p className="text-xs text-muted-foreground">Timer</p>
                  <p className="font-mono text-2xl font-semibold text-amber-300">{formatTimer()}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setActiveTimerTaskId(selectedTask?.id ?? null)}>
                    <TimerReset className="mr-2 h-4 w-4" /> Start
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setActiveTimerTaskId(null)}>
                    Pause
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Current: {selectedTask?.task.name ?? "No task"}</p>
              </GlassCard>
            </div>

            <div className={currentSection === "tasks" || currentSection === "details" ? "grid gap-4 lg:grid-cols-[1.5fr_1fr]" : "hidden"}>
              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Task Queue</h3>
                <div className="space-y-2">
                  {myTasks.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedTaskId(item.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${selectedTask?.id === item.id ? "border-emerald-400/50 bg-emerald-500/10" : "border-border/50 bg-secondary/20 hover:bg-secondary/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{idx + 1}. {item.task.name}</p>
                          <p className="text-xs text-muted-foreground">{item.project.title} • due {new Date(item.task.dueAt).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={item.task.status} />
                      </div>
                    </button>
                  ))}
                  {!myTasks.length ? <p className="text-sm text-muted-foreground">No tasks assigned.</p> : null}
                </div>
              </GlassCard>

              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Resource Hub</h3>
                <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> API Docs</Button>
                <Button variant="outline" className="w-full justify-start"><GitBranch className="mr-2 h-4 w-4" /> GitHub Repo</Button>
                <Button variant="outline" className="w-full justify-start"><Download className="mr-2 h-4 w-4" /> Assets</Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(selectedTask ? `/task/${selectedTask.projectId}/${selectedTask.taskId}` : "/chat")}>Open Full Task Detail</Button>
              </GlassCard>
            </div>

            <div className={currentSection === "details" ? "grid gap-4 lg:grid-cols-[1.5fr_1fr]" : "hidden"}>
              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Step-by-Step Execution</h3>
                <ProgressBar value={progress} label={`${progress}% checklist complete`} />
                <div className="space-y-2">
                  {checklist.map((step, index) => (
                    <label key={step} className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 p-2 text-sm">
                      <input type="checkbox" checked={!!checks[index]} onChange={() => toggleCheck(index)} />
                      <span className={checks[index] ? "line-through text-muted-foreground" : "text-foreground"}>{step}</span>
                    </label>
                  ))}
                </div>

                <h4 className="pt-2 text-sm font-semibold">Project Flow</h4>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2">Design<br />Done</div>
                  <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-2">Frontend<br />Current</div>
                  <div className="rounded-lg border border-border/60 bg-secondary/20 p-2">Backend<br />Waiting</div>
                  <div className="rounded-lg border border-border/60 bg-secondary/20 p-2">Testing<br />Locked</div>
                  <div className="rounded-lg border border-border/60 bg-secondary/20 p-2">Deploy<br />Locked</div>
                </div>
              </GlassCard>

              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Smart Block System</h3>
                {selectedTask?.task.status === "blocked" ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
                    <p className="flex items-center gap-2 font-medium text-red-300"><AlertTriangle className="h-4 w-4" /> Task currently blocked</p>
                    <p className="mt-2 text-muted-foreground">Dependency: Design approval not completed</p>
                    <p className="text-muted-foreground">Assigned to: Sarah Chen</p>
                    <p className="text-muted-foreground">AI Suggestion: Start with placeholder data and reusable layout.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Task is not blocked.</p>
                )}
                <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Add block reason" />
                <Button variant="outline" className="w-full" onClick={markBlocked}>Mark Blocked</Button>
              </GlassCard>
            </div>

            <div className={currentSection === "collaboration" ? "grid gap-4 lg:grid-cols-[1.4fr_1fr]" : "hidden"}>
              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Team Collaboration</h3>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {chats.slice(-8).map((msg) => (
                    <div key={msg.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                      <p className="text-xs text-muted-foreground">{msg.author}</p>
                      <p className="text-sm text-foreground">{msg.message}</p>
                    </div>
                  ))}
                  {!chats.length ? <p className="text-sm text-muted-foreground">No updates yet.</p> : null}
                </div>
                <div className="flex gap-2">
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Share team update" />
                  <Button onClick={sendTeamMessage}><Send className="h-4 w-4" /></Button>
                </div>
              </GlassCard>

              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">AI Assistant</h3>
                <Button variant="outline" className="w-full justify-start"><Brain className="mr-2 h-4 w-4" /> Explain task</Button>
                <Button variant="outline" className="w-full justify-start"><Brain className="mr-2 h-4 w-4" /> Generate code</Button>
                <Button variant="outline" className="w-full justify-start"><Brain className="mr-2 h-4 w-4" /> Fix bug</Button>
                <Button variant="outline" className="w-full justify-start"><Brain className="mr-2 h-4 w-4" /> Suggest improvements</Button>
              </GlassCard>
            </div>

            <div className={currentSection === "report" ? "grid gap-4 lg:grid-cols-[1.4fr_1fr]" : "hidden"}>
              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Submit Work</h3>
                <Input value={uploadVersion} onChange={(e) => setUploadVersion(e.target.value)} placeholder="Version (V1 / V2 / Final)" />
                <Input value={uploadLink} onChange={(e) => setUploadLink(e.target.value)} placeholder="GitHub / Demo / File Link" />
                <Textarea value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} placeholder="Submission notes" rows={4} />
                <Button className="w-full" onClick={submitWork}><UploadCloud className="mr-2 h-4 w-4" /> Submit for Review</Button>
              </GlassCard>

              <GlassCard className="space-y-3">
                <h3 className="text-base font-semibold">Activity Timeline</h3>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {activities.map((log) => (
                    <div key={log.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2 text-xs">
                      <p className="text-foreground">{log.actor}: {log.action}</p>
                      <p className="text-muted-foreground"><Clock3 className="mr-1 inline h-3 w-3" />{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))}
                  {!activities.length ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
                </div>
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2 text-xs text-emerald-300">
                  Daily score: {stats.efficiency}% • Keep closing blocked tasks early.
                </div>
              </GlassCard>
            </div>

            <div className="sticky bottom-3 z-20 flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-card/80 p-2 backdrop-blur">
              <Button size="sm" onClick={() => updateStatus("in-progress")}>Start</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("done")}><CheckCircle2 className="mr-2 h-4 w-4" />Mark Done</Button>
              <Button size="sm" variant="outline" onClick={() => navigate(selectedTask ? `/task/${selectedTask.projectId}/${selectedTask.taskId}` : "/chat")}>Open Detail Page</Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/chat")}><MessageSquare className="mr-2 h-4 w-4" />Chat</Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
