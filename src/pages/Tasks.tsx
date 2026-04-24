import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Filter, FolderKanban, GitBranch, ListTodo, PlayCircle, Search, Sparkles, Timer, WandSparkles } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { AIInsightBox } from "@/components/AIInsightBox";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProjects, startProjectAutomation, updateProjectTaskStatus, type ProjectRecord, type ProjectTaskPriority, type ProjectTaskStatus, type ProjectRole } from "@/lib/project-store";

type FlattenedTask = {
  id: string;
  projectId: string;
  taskId: string;
  project: string;
  client: string;
  company: string;
  owner: string;
  source: string;
  nextMilestone: string;
  budgetLabel: string;
  role: ProjectRole;
  priority: ProjectTaskPriority;
  dueAt: number;
  delayed: boolean;
  dependsOn: string[];
  canStart: boolean;
  assignee: string;
  name: string;
  status: ProjectTaskStatus;
  progress: number;
};

const statusFilters: Array<{ value: "all" | ProjectTaskStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In Progress" },
  { value: "todo", label: "Todo" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const roleLabels: Record<ProjectRole, string> = {
  designer: "Designer",
  "frontend-dev": "Frontend Dev",
  "backend-dev": "Backend Dev",
  "integration-dev": "Integration Dev",
  tester: "Tester",
};

const columns: Array<{ status: ProjectTaskStatus; title: string }> = [
  { status: "todo", title: "Todo" },
  { status: "in-progress", title: "In Progress" },
  { status: "blocked", title: "Blocked" },
  { status: "done", title: "Done" },
];

const dueText = (dueAt: number) => {
  const delta = dueAt - Date.now();
  if (delta <= 0) {
    return "Overdue";
  }

  return `Due in ${formatDistanceToNowStrict(dueAt)}`;
};

const loadProjects = () => getProjects();

export default function Tasks() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectTaskStatus>("all");
  const [projects, setProjects] = useState<ProjectRecord[]>(() => loadProjects());
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const allTasks = useMemo<FlattenedTask[]>(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          id: `${project.id}-${task.id}`,
          projectId: project.id,
          taskId: task.id,
          project: project.title,
          client: project.client,
          company: project.company,
          owner: project.owner,
          source: project.source,
          nextMilestone: project.nextMilestone,
          budgetLabel: project.budgetLabel,
          role: task.role,
          priority: task.priority,
          dueAt: task.dueAt,
          delayed: task.delayed,
          dependsOn: task.dependsOn,
          canStart: task.dependsOn.every((dep) => project.tasks.find((item) => item.id === dep)?.status === "done"),
          assignee: task.assignee,
          name: task.name,
          status: task.status,
          progress: task.progress,
        })),
      ),
    [projects],
  );

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allTasks.filter((task) => {
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const queryMatch =
        !q ||
        [task.name, task.project, task.client, task.assignee]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return statusMatch && queryMatch;
    });
  }, [allTasks, query, statusFilter]);

  const groupedTasks = useMemo(() => {
    const grouped = new Map<ProjectTaskStatus, FlattenedTask[]>();

    filteredTasks.forEach((task) => {
      if (!grouped.has(task.status)) {
        grouped.set(task.status, []);
      }
      grouped.get(task.status)?.push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const leadProjectView = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (!q) return true;
      return [project.client, project.company, project.title, project.owner, project.source]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [projects, query]);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const inProgress = allTasks.filter((task) => task.status === "in-progress").length;
    const done = allTasks.filter((task) => task.status === "done").length;
    const todo = allTasks.filter((task) => task.status === "todo").length;
    const blocked = allTasks.filter((task) => task.status === "blocked").length;
    const delayed = allTasks.filter((task) => task.delayed).length;
    const completion = total ? Math.round((done / total) * 100) : 0;

    return { total, inProgress, done, todo, blocked, delayed, completion };
  }, [allTasks]);

  const refresh = () => setProjects(loadProjects());

  const runOneClickStart = () => {
    projects.forEach((project) => {
      startProjectAutomation(project.id);
    });
    refresh();
    toast.success("Projects started", { description: "Tasks regenerated, auto-assigned, and tracked automatically." });
  };

  const updateTask = (task: FlattenedTask, nextStatus: ProjectTaskStatus) => {
    if (nextStatus === "in-progress" && !task.canStart) {
      toast.error("Dependency locked", { description: "Finish prerequisite tasks before starting this task." });
      return;
    }

    updateProjectTaskStatus(task.projectId, task.taskId, nextStatus);
    refresh();
    toast.success("Task updated", { description: `${task.name} moved to ${nextStatus.replace("-", " ")}.` });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Workflow Board
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-primary" /> Tasks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{stats.total} AI-managed tasks across {projects.length} live projects</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <GlassCard className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">In Progress</p>
              <p className="text-lg font-semibold text-foreground">{stats.inProgress}</p>
            </GlassCard>
            <GlassCard className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Todo</p>
              <p className="text-lg font-semibold text-foreground">{stats.todo}</p>
            </GlassCard>
            <GlassCard className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Done</p>
              <p className="text-lg font-semibold text-foreground">{stats.done}</p>
            </GlassCard>
            <GlassCard className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Blocked</p>
              <p className="text-lg font-semibold text-foreground">{stats.blocked}</p>
            </GlassCard>
            <GlassCard className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Delayed</p>
              <p className="text-lg font-semibold text-foreground">{stats.delayed}</p>
            </GlassCard>
            <GlassCard className="px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Complete</p>
              <p className="text-lg font-semibold text-foreground">{stats.completion}%</p>
            </GlassCard>
          </div>
        </div>

        <AIInsightBox
          insight={`Automation detected ${stats.delayed} delay risks and ${stats.blocked} dependency locks. Use One Click Project Start to regenerate the smartest workload split.`}
          action="Optimize"
        />

        <GlassCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
              <WandSparkles className="w-3.5 h-3.5" /> Smart Assignment Engine
            </div>
            <Button onClick={runOneClickStart} className="gradient-primary text-primary-foreground hover:opacity-90">
              <PlayCircle className="w-4 h-4 mr-2" /> One Click Project Start
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search task, project, client, assignee, role..."
              className="h-11 pl-9 bg-card/60 border-border/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground pr-1">
              <Filter className="w-3.5 h-3.5" /> Status
            </div>
            {statusFilters.map((item) => {
              const active = statusFilter === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/50 bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">Lead to Project Breakdown</h3>
              <p className="text-xs text-muted-foreground">Each lead has a separate project, broken into assigned tasks.</p>
            </div>
            <span className="text-xs text-muted-foreground">{leadProjectView.length} leads</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {leadProjectView.map((project) => {
              const doneCount = project.tasks.filter((task) => task.status === "done").length;
              const delayedCount = project.tasks.filter((task) => task.delayed).length;

              return (
                <div key={`lead-${project.id}`} className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{project.client}</p>
                      <p className="text-xs text-muted-foreground">{project.company} · {project.source}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-border/50" onClick={() => navigate(`/project/${project.id}`)}>
                      Open Project
                    </Button>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <p className="text-xs text-muted-foreground">Project</p>
                    <p className="text-sm font-medium text-foreground">{project.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Owner: {project.owner} · Budget: {project.budgetLabel}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">Tasks: {project.tasks.length}</span>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">Done: {doneCount}</span>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">Delayed: {delayedCount}</span>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">Completion: {project.completion}%</span>
                  </div>

                  <div className="space-y-2">
                    {project.tasks.map((task) => (
                      <div key={`${project.id}-${task.id}-lead-view`} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-foreground">{task.name}</p>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Assigned to {task.assignee} ({roleLabels[task.role]})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const tasks = groupedTasks.get(column.status) ?? [];
            return (
              <GlassCard
                key={column.status}
                className="space-y-3 min-h-[220px]"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!dragTaskId) return;
                  const task = allTasks.find((item) => item.id === dragTaskId);
                  if (!task) return;
                  updateTask(task, column.status);
                  setDragTaskId(null);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <StatusBadge status={column.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">{tasks.length}</span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragTaskId(task.id)}
                      className="rounded-xl border border-border/50 bg-secondary/20 p-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground text-sm">{task.name}</span>
                          {task.delayed ? <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> : null}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                          <span className="rounded-full border border-border/60 px-2 py-0.5">{roleLabels[task.role]}</span>
                          <span className="rounded-full border border-border/60 px-2 py-0.5">{task.priority}</span>
                          <span>{task.assignee}</span>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-background/40 p-2.5 space-y-1">
                          <div className="text-[11px] text-foreground font-medium">{task.project}</div>
                          <div className="text-[11px] text-muted-foreground">{task.client} · {task.company}</div>
                          <div className="text-[11px] text-muted-foreground">Owner: {task.owner} · Source: {task.source}</div>
                          <div className="text-[11px] text-muted-foreground">Budget: {task.budgetLabel}</div>
                          <div className="text-[11px] text-muted-foreground">Next: {task.nextMilestone}</div>
                        </div>

                        {task.dependsOn.length ? (
                          <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <GitBranch className="w-3 h-3" /> {task.canStart ? "Dependencies resolved" : `${task.dependsOn.length} dependencies pending`}
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Timer className="w-3 h-3" /> {dueText(task.dueAt)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] border-border/50"
                            onClick={() => navigate(`/project/${task.projectId}`)}
                          >
                            Open <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                        <ProgressBar value={task.progress} showPercent />
                      </div>
                    </div>
                  ))}

                  {!tasks.length ? (
                    <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 px-3 py-8 text-center text-xs text-muted-foreground">
                      Drop tasks here
                    </div>
                  ) : null}
                </div>
              </GlassCard>
            );
          })}
        </div>

        {!filteredTasks.length ? (
          <GlassCard className="py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">No tasks found</h3>
            <p className="text-sm text-muted-foreground mt-2">Try a different search or status filter.</p>
          </GlassCard>
        ) : null}

        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Smart Project Access</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 text-left transition-colors hover:bg-secondary/40"
              >
                <p className="text-sm font-medium text-foreground">{project.title}</p>
                <p className="text-xs text-muted-foreground">{project.client} · {project.company}</p>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
