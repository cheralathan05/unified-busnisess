import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle2, AlertCircle, Zap, MessageSquare,
  FileText, GitBranch, Palette, Download, Play, Pause, Send, Upload,
  Brain, Target, Link2, Code2
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ProgressBar";
import { getProjects, updateProjectTaskStatus, type ProjectTask } from "@/lib/project-store";
import {
  addActivityLog, getProjectActivityLogs, postProjectChat, getProjectChat
} from "@/lib/collaboration-store";
import { toast } from "sonner";

interface TaskWithContext {
  projectId: string;
  projectTitle: string;
  projectClient: string;
  taskId: string;
  task: ProjectTask;
}

const statusColor = (status: ProjectTask["status"]) => {
  if (status === "done") return "bg-green-500/20 text-green-400 border-green-500/40";
  if (status === "in-progress") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  if (status === "blocked") return "bg-red-500/20 text-red-400 border-red-500/40";
  return "bg-gray-500/20 text-gray-400 border-gray-500/40";
};

const priorityColor = (priority: ProjectTask["priority"]) => {
  if (priority === "high") return "border-red-500/40 bg-red-500/10 text-red-300";
  if (priority === "medium") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";
};

const taskDescription = (task: ProjectTask) => {
  if (task.area === "frontend") return "Build responsive UI components and integrate with approved design output and live APIs.";
  if (task.area === "backend") return "Implement secure endpoints, validation logic, and service integration with stable data schema.";
  if (task.area === "integration") return "Connect third-party services, verify webhook flows, and harden error handling.";
  if (task.area === "testing") return "Execute test checklist, validate regression paths, and report blockers with proof.";
  return "Create polished deliverables and align with product goals.";
};

const taskEndpoints = (task: ProjectTask) => {
  if (task.area === "backend") return ["POST /auth/login", "GET /products", "POST /orders"];
  if (task.area === "integration") return ["POST /payments/session", "POST /webhooks/payment"];
  if (task.area === "frontend") return ["GET /api/products", "POST /api/cart"];
  return ["No direct endpoint required"];
};

const defaultSteps = (task: ProjectTask) => {
  if (task.area === "frontend") {
    return [
      "Review and open Figma design file",
      "Create responsive layout structure",
      "Build reusable components",
      "Integrate with API endpoints",
      "Test on all screen sizes",
      "Submit for review"
    ];
  }
  if (task.area === "backend") {
    return [
      "Review API specification",
      "Design database schema",
      "Implement endpoints",
      "Add validation and error handling",
      "Write tests",
      "Deploy and test"
    ];
  }
  if (task.area === "integration") {
    return [
      "Review integration docs",
      "Set up service credentials",
      "Implement webhook handlers",
      "Test payment flows",
      "Verify error handling",
      "Deploy to production"
    ];
  }
  return ["Start working", "Review progress", "Submit work"];
};

export default function EmployeeTaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();

  const [taskContext, setTaskContext] = useState<TaskWithContext | null>(null);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTick, setChatTick] = useState(0);
  const [uploadLink, setUploadLink] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadVersion, setUploadVersion] = useState("V1");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      toast.error("Project not found");
      navigate(-1 as any);
      return;
    }

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      toast.error("Task not found");
      navigate(-1 as any);
      return;
    }

    setTaskContext({
      projectId: project.id,
      projectTitle: project.title,
      projectClient: project.client,
      taskId: task.id,
      task
    });

    const steps = defaultSteps(task);
    setCompletedSteps(new Array(steps.length).fill(false));
  }, [projectId, taskId, navigate]);

  useEffect(() => {
    if (!activeTimerTaskId) return;
    const interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTimerTaskId]);

  const steps = taskContext ? defaultSteps(taskContext.task) : [];
  const chats = useMemo(
    () => (taskContext ? getProjectChat(taskContext.projectId).filter((item) => item.authorRole !== "client") : []),
    [taskContext, chatTick]
  );
  const activityLogs = useMemo(
    () => (taskContext ? getProjectActivityLogs(taskContext.projectId).filter((log) => log.action.toLowerCase().includes(taskContext.task.name.toLowerCase())) : []),
    [taskContext]
  );

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartTask = () => {
    if (!taskContext) return;
    updateProjectTaskStatus(taskContext.projectId, taskContext.taskId, "in-progress");
    setActiveTimerTaskId(taskContext.taskId);
    addActivityLog(taskContext.projectId, taskContext.task.assignee, `Started task ${taskContext.task.name}`);
    toast.success("Task started! Focus mode activated ✨");
  };

  const handleCompleteStep = (index: number) => {
    const updated = [...completedSteps];
    updated[index] = !updated[index];
    setCompletedSteps(updated);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !taskContext) return;
    postProjectChat(taskContext.projectId, "team", taskContext.task.assignee, chatInput.trim());
    addActivityLog(taskContext.projectId, taskContext.task.assignee, `Commented on ${taskContext.task.name}`);
    setChatInput("");
    setChatTick((prev) => prev + 1);
    toast.success("Message sent to team");
  };

  const handleSubmitWork = () => {
    if (!uploadLink.trim() || !taskContext) return;
    postProjectChat(
      taskContext.projectId,
      "team",
      taskContext.task.assignee,
      `Submitted work: ${uploadVersion} - ${uploadLink.trim()}\nNotes: ${uploadNotes.trim()}`
    );
    addActivityLog(taskContext.projectId, taskContext.task.assignee, `Submitted work for ${taskContext.task.name} (${uploadVersion})`);
    setUploadLink("");
    setUploadNotes("");
    setUploadVersion("V1");
    setShowSubmitForm(false);
    toast.success("Work submitted for review! 🎉");
  };

  const handleCompleteTask = () => {
    if (!taskContext) return;
    updateProjectTaskStatus(taskContext.projectId, taskContext.taskId, "done");
    addActivityLog(taskContext.projectId, taskContext.task.assignee, `Completed task ${taskContext.task.name}`);
    setActiveTimerTaskId(null);
    toast.success("Task completed! Great work! 🚀");
  };

  if (!taskContext) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <GlassCard className="text-center space-y-3">
          <p className="text-muted-foreground">Loading task...</p>
        </GlassCard>
      </div>
    );
  }

  const completionPercentage = (completedSteps.filter((s) => s).length / steps.length) * 100;
  const depStatus = taskContext.task.status;

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Button variant="outline" onClick={() => navigate(-1 as any)} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{taskContext.task.name}</h1>
            <p className="text-sm text-muted-foreground">{taskContext.projectTitle} • {taskContext.projectClient}</p>
          </div>
          <div className="text-right space-y-2">
            <Badge className={statusColor(depStatus)}>{depStatus.toUpperCase()}</Badge>
            <Badge className={priorityColor(taskContext.task.priority)}>Priority: {taskContext.task.priority.toUpperCase()}</Badge>
            <p className="text-xs text-muted-foreground">Due: {new Date(taskContext.task.dueAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* AI Instructions */}
        <GlassCard className="border-l-4 border-primary/60 space-y-3 bg-primary/5">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">🧠 AI Instructions</h2>
              <p className="text-sm text-muted-foreground mt-1">{taskDescription(taskContext.task)}</p>
              <div className="mt-3 p-3 rounded-lg bg-secondary/25 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">💡 Expected Output:</p>
                <p className="text-sm text-foreground">
                  Complete implementation of {taskContext.task.name} with full functionality, proper error handling, and clean code.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Steps */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Step-by-Step Execution
              </h3>
              <ProgressBar value={completionPercentage} label={`${completionPercentage.toFixed(0)}% Complete`} />
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/20 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={completedSteps[index]}
                      onChange={() => handleCompleteStep(index)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className={`text-sm ${completedSteps[index] ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {index + 1}. {step}
                    </span>
                  </label>
                ))}
              </div>
            </GlassCard>

            {/* Work Panel */}
            {taskContext.task.status === "in-progress" && (
              <GlassCard className="space-y-4 bg-blue-500/5 border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-foreground">⚡ Work in Progress</h3>
                      <p className="text-xs text-muted-foreground">You are actively working on this task</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-blue-400">{formatTime(timerSeconds)}</p>
                    <p className="text-xs text-muted-foreground">Time spent</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setActiveTimerTaskId(null)} variant="outline" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" /> Pause
                  </Button>
                  <Button onClick={handleCompleteTask} className="flex-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
                  </Button>
                </div>
              </GlassCard>
            )}

            {taskContext.task.status !== "in-progress" && taskContext.task.status !== "done" && (
              <GlassCard className="space-y-3">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Ready to Start?</h3>
                </div>
                <Button onClick={handleStartTask} className="w-full gradient-primary text-primary-foreground">
                  <Play className="w-4 h-4 mr-2" /> Start Task Now
                </Button>
              </GlassCard>
            )}

            {/* Block Reason */}
            {taskContext.task.status === "blocked" && (
              <GlassCard className="space-y-3 border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-foreground">🚫 Why Blocked?</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-3 rounded-lg bg-secondary/25 border border-red-500/20">
                    <p className="text-muted-foreground">Dependency: Design approval incomplete</p>
                    <p className="text-foreground mt-1">Assigned to: Sarah Chen (Designer)</p>
                    <p className="text-muted-foreground text-xs mt-1">ETA: Today 6:00 PM</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-300 mb-2">💡 AI Suggestion:</p>
                    <p className="text-sm text-foreground">You can start building layout with placeholder data and mock API responses. This unblocks you and speeds things up.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">Notify Designer</Button>
                  <Button className="flex-1">Start with Mock Data</Button>
                </div>
              </GlassCard>
            )}

            {/* Dependency Flow */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" /> Dependency Pipeline
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg border border-border/50 bg-secondary/25 flex items-center justify-center text-xs font-semibold">Design</div>
                  <p className="mt-1">✔ Done</p>
                </div>
                <div className="flex-1 h-0.5 bg-primary/30 mx-2" />
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center text-xs font-semibold ${
                    taskContext.task.area === "frontend" ? "bg-primary/10 border-primary/50 text-primary" : "border-border/50 bg-secondary/25"
                  }`}>Frontend</div>
                  <p className="mt-1">{taskContext.task.area === "frontend" ? "⏳ Current" : "🔒 Waiting"}</p>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${taskContext.task.area === "frontend" ? "bg-muted/30" : "bg-primary/30"}`} />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg border border-border/50 bg-secondary/25 flex items-center justify-center text-xs font-semibold">Backend</div>
                  <p className="mt-1">🔒 Locked</p>
                </div>
              </div>
            </GlassCard>

            {/* Team Chat */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Team Updates ({chats.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {chats.slice(-5).map((chat) => (
                  <div key={chat.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                    <p className="text-xs text-muted-foreground mb-1">{chat.author}</p>
                    <p className="text-sm text-foreground">{chat.message}</p>
                  </div>
                ))}
                {!chats.length && <p className="text-sm text-muted-foreground">No team updates yet</p>}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send message..." />
                <Button onClick={handleSendChat} disabled={!chatInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resources */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground">📎 Resources</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Palette className="w-4 h-4 mr-2" /> Figma Design
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" /> API Docs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <GitBranch className="w-4 h-4 mr-2" /> GitHub Repo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" /> Assets
                </Button>
              </div>
            </GlassCard>

            {/* Task Info */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground">ℹ️ Task Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Area</p>
                  <p className="text-foreground font-medium">{taskContext.task.area}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Role</p>
                  <p className="text-foreground font-medium">{taskContext.task.role}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Estimated Days</p>
                  <p className="text-foreground font-medium">{taskContext.task.estimatedDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Experience Required</p>
                  <p className="text-foreground font-medium">{taskContext.task.experienceRequired}+ years</p>
                </div>
              </div>
            </GlassCard>

            {/* API Endpoints */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> API Endpoints
              </h3>
              <div className="space-y-1 text-xs">
                {taskEndpoints(taskContext.task).map((endpoint, i) => (
                  <code key={i} className="text-foreground bg-secondary/30 px-2 py-1 rounded block font-mono">
                    {endpoint}
                  </code>
                ))}
              </div>
            </GlassCard>

            {/* AI Assistant */}
            <GlassCard className="space-y-3 bg-primary/5 border-primary/30">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" /> 🤖 AI Assistant
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs">
                  Explain this task
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  Generate code snippet
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  Suggest best practice
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  Fix bug / Debug
                </Button>
              </div>
            </GlassCard>

            {/* Submit Work */}
            {!showSubmitForm ? (
              <Button onClick={() => setShowSubmitForm(true)} className="w-full gradient-primary text-primary-foreground">
                <Upload className="w-4 h-4 mr-2" /> Submit Work
              </Button>
            ) : (
              <GlassCard className="space-y-3 border-green-500/30 bg-green-500/5">
                <h3 className="font-semibold text-foreground">📤 Submit Work</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Version</label>
                    <Input
                      value={uploadVersion}
                      onChange={(e) => setUploadVersion(e.target.value)}
                      placeholder="V1 / V2 / Final"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Link (GitHub / Figma / URL)</label>
                    <Input
                      value={uploadLink}
                      onChange={(e) => setUploadLink(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Textarea value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} placeholder="What you did..." rows={3} className="mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowSubmitForm(false)} variant="outline" className="flex-1 text-xs">
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitWork} className="flex-1 text-xs">
                      <Upload className="w-3 h-3 mr-1" /> Submit
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Activity Log */}
            <GlassCard className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Activity Timeline
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto text-xs text-muted-foreground pr-1">
                {activityLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                    <div>
                      <p>{log.actor}: {log.action}</p>
                      <p className="text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
