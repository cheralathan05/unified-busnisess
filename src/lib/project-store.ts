import { getLeads, type LeadRecord } from "@/lib/lead-store";
import { deduplicateProjects } from "@/lib/deduplication-service";

export type LeadLike = LeadRecord;

export type ProjectTaskStatus = "done" | "in-progress" | "todo" | "blocked";

export type ProjectTaskPriority = "high" | "medium" | "low";

export type ProjectRole = "designer" | "frontend-dev" | "backend-dev" | "integration-dev" | "tester";

export type TaskArea = "design" | "frontend" | "backend" | "integration" | "testing";

export type ProjectMilestoneStatus = "paid" | "pending" | "scheduled";

export type ProjectStatus = "active" | "at-risk" | "completed";

export type TeamMember = {
  id: string;
  name: string;
  role: ProjectRole;
  skills: string[];
  experienceYears: number;
  availability: "active" | "away" | "offline";
  capacity: number;
  currentLoad: number;
};

export type TaskNotification = {
  id: string;
  type: "task-assigned" | "task-completed" | "task-delayed" | "task-reassigned" | "client-update";
  message: string;
  createdAt: number;
  taskId?: string;
};

export type FigmaVersion = {
  id: string;
  label: string;
  url: string;
  createdAt: number;
};

export type ProjectTask = {
  id: string;
  name: string;
  area: TaskArea;
  role: ProjectRole;
  assignee: string;
  status: ProjectTaskStatus;
  progress: number;
  priority: ProjectTaskPriority;
  skill: string;
  experienceRequired: number;
  estimatedDays: number;
  dueAt: number;
  createdAt: number;
  dependsOn: string[];
  delayed: boolean;
  autoAssigned: boolean;
  figma?: {
    requiresClientApproval: boolean;
    approvedVersionId?: string;
    livePreviewUrl?: string;
    versions: FigmaVersion[];
  };
};

export type ProjectRecord = {
  id: string;
  leadId: number;
  title: string;
  client: string;
  company: string;
  budgetLabel: string;
  budgetValue: number;
  owner: string;
  source: string;
  phone: string;
  email: string;
  summary: string;
  notes: string;
  completion: number;
  status: ProjectStatus;
  currentPhase: string;
  nextMilestone: string;
  createdAt: number;
  updatedAt: number;
  deliverables: string[];
  stages: Array<{
    name: string;
    status: ProjectTaskStatus;
    owner: string;
    eta: string;
  }>;
  tasks: ProjectTask[];
  milestones: Array<{
    name: string;
    amount: string;
    status: ProjectMilestoneStatus;
  }>;
  notifications: TaskNotification[];
};

const STORAGE_KEY = "ai-project-os.projects";

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Sarah Chen",
    role: "designer",
    skills: ["wireframe", "figma", "design-system", "ui-design"],
    experienceYears: 6,
    availability: "active",
    capacity: 6,
    currentLoad: 3,
  },
  {
    id: "tm-2",
    name: "Alex Rivera",
    role: "frontend-dev",
    skills: ["react", "frontend", "ui-implementation", "responsive"],
    experienceYears: 5,
    availability: "active",
    capacity: 7,
    currentLoad: 4,
  },
  {
    id: "tm-3",
    name: "James Wilson",
    role: "backend-dev",
    skills: ["node", "api", "auth", "orders", "database"],
    experienceYears: 7,
    availability: "away",
    capacity: 6,
    currentLoad: 2,
  },
  {
    id: "tm-4",
    name: "Nina Shah",
    role: "integration-dev",
    skills: ["payment", "integrations", "webhooks", "api"],
    experienceYears: 4,
    availability: "active",
    capacity: 5,
    currentLoad: 1,
  },
  {
    id: "tm-5",
    name: "Emma Davis",
    role: "tester",
    skills: ["qa", "automation", "e2e", "regression"],
    experienceYears: 5,
    availability: "active",
    capacity: 8,
    currentLoad: 4,
  },
];

type TaskTemplate = {
  id: string;
  name: string;
  area: TaskArea;
  role: ProjectRole;
  skill: string;
  estimatedDays: number;
  priority: ProjectTaskPriority;
  experienceRequired: number;
  dependsOn?: string[];
  figma?: {
    requiresClientApproval: boolean;
  };
};

type ProjectTemplate = {
  deliverables: string[];
  tasks: TaskTemplate[];
};


const safeRead = (): ProjectRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ProjectRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (projects: ProjectRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  // Deduplicate before saving
  const { unique } = deduplicateProjects(projects);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
};

const matches = (value: string, terms: string[]) => {
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term));
};

const availabilityWeight: Record<TeamMember["availability"], number> = {
  active: 1,
  away: 0.65,
  offline: 0.2,
};

const assignmentScore = (member: TeamMember, template: TaskTemplate, loadMap: Record<string, number>) => {
  const load = loadMap[member.id] ?? member.currentLoad;
  const capacityScore = Math.max(0, 1 - load / Math.max(member.capacity, 1));
  const skillScore = member.skills.includes(template.skill) ? 1 : 0;
  const expScore = Math.min(member.experienceYears / Math.max(template.experienceRequired, 1), 1.3);
  return skillScore * 40 + expScore * 25 + availabilityWeight[member.availability] * 20 + capacityScore * 15;
};

const pickBestAssignee = (template: TaskTemplate, loadMap: Record<string, number>) => {
  const candidates = TEAM_MEMBERS.filter((member) => member.role === template.role);
  if (!candidates.length) {
    return "Unassigned";
  }

  const best = candidates
    .map((member) => ({ member, score: assignmentScore(member, template, loadMap) }))
    .sort((a, b) => b.score - a.score)[0]?.member;

  if (!best) {
    return candidates[0].name;
  }

  loadMap[best.id] = (loadMap[best.id] ?? best.currentLoad) + 1;
  return best.name;
};

const defaultTaskTemplates = (): TaskTemplate[] => [
  {
    id: "design-wireframe",
    name: "Create Wireframes",
    area: "design",
    role: "designer",
    skill: "wireframe",
    estimatedDays: 2,
    priority: "high",
    experienceRequired: 3,
  },
  {
    id: "design-ui",
    name: "Create UI Design (Figma)",
    area: "design",
    role: "designer",
    skill: "figma",
    estimatedDays: 3,
    priority: "high",
    experienceRequired: 4,
    dependsOn: ["design-wireframe"],
    figma: { requiresClientApproval: true },
  },
  {
    id: "frontend-core",
    name: "Build Frontend Core Screens",
    area: "frontend",
    role: "frontend-dev",
    skill: "react",
    estimatedDays: 5,
    priority: "medium",
    experienceRequired: 3,
    dependsOn: ["design-ui"],
  },
  {
    id: "backend-core",
    name: "Build Backend APIs",
    area: "backend",
    role: "backend-dev",
    skill: "api",
    estimatedDays: 7,
    priority: "high",
    experienceRequired: 4,
    dependsOn: ["frontend-core"],
  },
  {
    id: "integration-payment",
    name: "Payment Gateway Integration",
    area: "integration",
    role: "integration-dev",
    skill: "payment",
    estimatedDays: 3,
    priority: "high",
    experienceRequired: 3,
    dependsOn: ["frontend-core", "backend-core"],
  },
  {
    id: "testing-release",
    name: "QA and Release Validation",
    area: "testing",
    role: "tester",
    skill: "qa",
    estimatedDays: 2,
    priority: "medium",
    experienceRequired: 3,
    dependsOn: ["integration-payment"],
  },
];

const getProjectTemplate = (title: string): ProjectTemplate => {
  if (matches(title, ["e-commerce", "ecommerce", "store", "shop"])) {
    return {
      deliverables: ["Catalog and product pages", "Cart and checkout", "Payment integration", "Order and shipping dashboard"],
      tasks: [
        { id: "design-wireframe", name: "Wireframe", area: "design", role: "designer", skill: "wireframe", estimatedDays: 2, priority: "high", experienceRequired: 3 },
        { id: "design-ui", name: "UI Design (Figma)", area: "design", role: "designer", skill: "figma", estimatedDays: 3, priority: "high", experienceRequired: 4, dependsOn: ["design-wireframe"], figma: { requiresClientApproval: true } },
        { id: "frontend-home", name: "Home Page", area: "frontend", role: "frontend-dev", skill: "react", estimatedDays: 2, priority: "medium", experienceRequired: 3, dependsOn: ["design-ui"] },
        { id: "frontend-product", name: "Product Page", area: "frontend", role: "frontend-dev", skill: "react", estimatedDays: 2, priority: "medium", experienceRequired: 3, dependsOn: ["design-ui"] },
        { id: "frontend-cart", name: "Cart", area: "frontend", role: "frontend-dev", skill: "react", estimatedDays: 2, priority: "high", experienceRequired: 3, dependsOn: ["design-ui"] },
        { id: "backend-auth", name: "Auth API", area: "backend", role: "backend-dev", skill: "auth", estimatedDays: 3, priority: "high", experienceRequired: 4, dependsOn: ["frontend-cart"] },
        { id: "backend-product", name: "Product API", area: "backend", role: "backend-dev", skill: "api", estimatedDays: 3, priority: "high", experienceRequired: 4, dependsOn: ["backend-auth"] },
        { id: "backend-order", name: "Order System", area: "backend", role: "backend-dev", skill: "orders", estimatedDays: 4, priority: "high", experienceRequired: 5, dependsOn: ["backend-auth"] },
        { id: "integration-payment", name: "Payment Gateway", area: "integration", role: "integration-dev", skill: "payment", estimatedDays: 3, priority: "high", experienceRequired: 3, dependsOn: ["frontend-cart", "backend-order"] },
        { id: "testing-release", name: "Regression Testing", area: "testing", role: "tester", skill: "qa", estimatedDays: 2, priority: "medium", experienceRequired: 3, dependsOn: ["integration-payment"] },
      ],
    };
  }

  if (matches(title, ["mobile", "app", "mvp"])) {
    return {
      deliverables: ["Mobile app architecture", "Authentication and onboarding", "Core app screens", "Beta release package"],
      tasks: defaultTaskTemplates(),
    };
  }

  if (matches(title, ["lms", "education", "learning"])) {
    return {
      deliverables: ["Course and module setup", "Learner dashboard", "Assessment and reporting", "Admin controls"],
      tasks: defaultTaskTemplates(),
    };
  }

  if (matches(title, ["portfolio", "business website", "website"])) {
    return {
      deliverables: ["Visual design system", "Responsive pages", "CMS/content setup", "Performance optimization"],
      tasks: defaultTaskTemplates(),
    };
  }

  return {
    deliverables: ["Project scope document", "UX and visual direction", "Core implementation", "Launch checklist"],
    tasks: defaultTaskTemplates(),
  };
};

const taskStatusFromLead = (status: LeadLike["status"], index: number): ProjectTaskStatus => {
  if (status === "hot") {
    if (index === 0) return "done";
    if (index <= 2) return "in-progress";
    return "todo";
  }

  if (status === "warm") {
    if (index === 0) return "done";
    if (index === 1) return "in-progress";
    return "todo";
  }

  if (index === 0) return "in-progress";
  return "todo";
};

const taskProgressFromStatus = (status: ProjectTaskStatus, index: number) => {
  if (status === "done") return 100;
  if (status === "in-progress") return index === 0 ? 55 : 30;
  if (status === "blocked") return 10;
  return 0;
};

const statusPriority = (status: LeadLike["status"]): number => {
  if (status === "hot") return 2;
  if (status === "warm") return 1;
  return 0;
};

const applyDependencyBlocking = (tasks: ProjectTask[]) => {
  const doneIds = new Set(tasks.filter((task) => task.status === "done").map((task) => task.id));
  return tasks.map((task) => {
    const blockedBy = task.dependsOn.filter((dep) => !doneIds.has(dep));
    if (blockedBy.length && task.status !== "done") {
      return { ...task, status: "blocked" as ProjectTaskStatus, progress: Math.min(task.progress, 10) };
    }

    if (task.status === "blocked") {
      return { ...task, status: "todo" as ProjectTaskStatus, progress: 0 };
    }

    return task;
  });
};

const markDelayedTasks = (tasks: ProjectTask[], now = Date.now()) => {
  return tasks.map((task) => {
    if (task.status === "done") {
      return { ...task, delayed: false };
    }

    return {
      ...task,
      delayed: task.dueAt < now,
    };
  });
};

const buildAutomatedTasks = (lead: LeadLike, startedAt: number): ProjectTask[] => {
  const template = getProjectTemplate(lead.project);
  const loadMap = Object.fromEntries(TEAM_MEMBERS.map((member) => [member.id, member.currentLoad]));
  const roleDueCursor: Partial<Record<ProjectRole, number>> = {};

  const seeded = template.tasks.map((item, index) => {
    const roleAnchor = roleDueCursor[item.role] ?? startedAt;
    const dueAt = roleAnchor + item.estimatedDays * 24 * 60 * 60 * 1000;
    roleDueCursor[item.role] = dueAt;

    const status = taskStatusFromLead(lead.status, index);
    const assignee = pickBestAssignee(item, loadMap);

    return {
      id: item.id,
      name: item.name,
      area: item.area,
      role: item.role,
      assignee,
      status,
      progress: taskProgressFromStatus(status, index),
      priority: item.priority,
      skill: item.skill,
      experienceRequired: item.experienceRequired,
      estimatedDays: item.estimatedDays,
      dueAt,
      createdAt: startedAt,
      dependsOn: item.dependsOn ?? [],
      delayed: false,
      autoAssigned: true,
      figma: item.figma
        ? {
            requiresClientApproval: item.figma.requiresClientApproval,
            versions: [],
          }
        : undefined,
    };
  });

  const leadPriority = statusPriority(lead.status);
  const unlocked = seeded.filter((task) => !task.dependsOn.length).slice(0, Math.max(1, leadPriority));
  const unlockedIds = new Set(unlocked.map((task) => task.id));
  const warmed = seeded.map((task) => {
    if (!unlockedIds.has(task.id) || task.status === "done") {
      return task;
    }

    return {
      ...task,
      status: "in-progress" as ProjectTaskStatus,
      progress: Math.max(task.progress, 25),
    };
  });

  return markDelayedTasks(applyDependencyBlocking(warmed));
};

const makeNotifications = (tasks: ProjectTask[]): TaskNotification[] => {
  const now = Date.now();
  const assignedNotifications = tasks.slice(0, 4).map((task, index) => ({
    id: `nt-assigned-${task.id}-${now}-${index}`,
    type: "task-assigned" as const,
    message: `${task.name} assigned to ${task.assignee}`,
    createdAt: now - index * 1000,
    taskId: task.id,
  }));

  const delayedNotifications = tasks
    .filter((task) => task.delayed)
    .map((task, index) => ({
      id: `nt-delayed-${task.id}-${now}-${index}`,
      type: "task-delayed" as const,
      message: `${task.name} is delayed. Auto-reassignment suggested.`,
      createdAt: now - 3000 - index * 1000,
      taskId: task.id,
    }));

  return [...assignedNotifications, ...delayedNotifications];
};

const isValidTask = (task: Partial<ProjectTask> | undefined): task is ProjectTask => {
  if (!task) return false;
  return Boolean(
    typeof task.id === "string" &&
      typeof task.name === "string" &&
      typeof task.assignee === "string" &&
      typeof task.status === "string" &&
      typeof task.progress === "number" &&
      Array.isArray(task.dependsOn) &&
      typeof task.dueAt === "number",
  );
};

const normalizeProjectRecord = (project: ProjectRecord): ProjectRecord => {
  const lead = getLeads().find((item) => `${item.id}` === project.id || item.id === project.leadId);
  if (!lead) {
    return {
      ...project,
      notifications: project.notifications ?? [],
      tasks: (project.tasks ?? []).filter((task) => isValidTask(task as Partial<ProjectTask>)),
    };
  }

  const regenerated = projectFromLead(lead);
  const hasInvalidTasks = !Array.isArray(project.tasks) || !project.tasks.length || project.tasks.some((task) => !isValidTask(task as Partial<ProjectTask>));
  if (hasInvalidTasks) {
    return {
      ...project,
      tasks: regenerated.tasks,
      notifications: project.notifications?.length ? project.notifications : regenerated.notifications,
      updatedAt: Date.now(),
      completion: computeProjectCompletion(regenerated.tasks),
    };
  }

  const normalizedTasks = markDelayedTasks(applyDependencyBlocking(project.tasks));
  return {
    ...project,
    tasks: normalizedTasks,
    notifications: project.notifications ?? [],
    completion: computeProjectCompletion(normalizedTasks),
  };
};

const projectFromLead = (lead: LeadLike): ProjectRecord => {
  const completion = Math.max(18, Math.min(72, Math.round(lead.score * 0.6)));
  const template = getProjectTemplate(lead.project);
  const tasks = buildAutomatedTasks(lead, Date.now());

  return {
    id: `${lead.id}`,
    leadId: lead.id,
    title: lead.project,
    client: lead.name,
    company: lead.company,
    budgetLabel: lead.budgetLabel,
    budgetValue: lead.budgetValue,
    owner: lead.owner,
    source: lead.source,
    phone: lead.phone,
    email: lead.email,
    summary: lead.projectDescription ?? lead.notes,
    notes: lead.notes,
    completion,
    status: lead.status === "hot" ? "active" : lead.status === "warm" ? "active" : "at-risk",
    currentPhase: lead.status === "hot" ? "Development setup" : lead.status === "warm" ? "Discovery and planning" : "Client re-engagement",
    nextMilestone: "Design approval and engineering kickoff",
    createdAt: lead.createdAt,
    updatedAt: Date.now(),
    deliverables: template.deliverables,
    stages: [
      { name: "Lead promoted", status: "done", owner: lead.owner, eta: "Completed" },
      { name: "Discovery", status: lead.status === "cold" ? "todo" : "done", owner: lead.owner, eta: "Client call" },
      { name: "Planning", status: lead.status === "cold" ? "todo" : lead.status === "warm" ? "in-progress" : "done", owner: lead.owner, eta: "Scope lock" },
      { name: "Design", status: lead.status === "hot" ? "in-progress" : "todo", owner: "Design team", eta: "Wireframes" },
      { name: "Build", status: lead.status === "hot" ? "todo" : "todo", owner: "Engineering", eta: "Implementation" },
      { name: "QA & Launch", status: "todo", owner: "QA team", eta: "Final review" },
    ],
    tasks,
    milestones: [
      { name: "Discovery payment", amount: "₹25,000", status: "paid" },
      { name: "Design approval", amount: "₹50,000", status: lead.status === "hot" ? "scheduled" : "pending" },
      { name: "Launch payment", amount: "₹75,000", status: "pending" },
    ],
    notifications: makeNotifications(tasks),
  };
};

const bootstrapDefaults = () => {
  const existing = safeRead();
  if (existing.length) {
    const normalized = existing.map(normalizeProjectRecord);
    safeWrite(normalized);
    return normalized;
  }

  const seeded = getLeads().map(projectFromLead);

  safeWrite(seeded);
  return seeded;
};

export const getProjects = () => bootstrapDefaults();

export const getProjectById = (id?: string) => {
  if (!id) {
    return undefined;
  }

  return bootstrapDefaults().find((project) => project.id === id);
};

export const saveProject = (project: ProjectRecord) => {
  const projects = bootstrapDefaults();
  const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)];
  safeWrite(nextProjects);
  return project;
};

export const createProjectFromLead = (lead: LeadLike) => {
  const project = projectFromLead(lead);
  return saveProject(project);
};

export const syncProjectsFromLeads = (leads: LeadLike[]) => {
  if (!leads.length) {
    return getProjects();
  }

  const existing = bootstrapDefaults();
  const synced = leads.map((lead) => {
    const current = existing.find((project) => project.leadId === lead.id || project.id === `${lead.id}`);
    const projected = projectFromLead(lead);

    if (!current) {
      return projected;
    }

    return {
      ...current,
      id: `${lead.id}`,
      leadId: lead.id,
      title: lead.project,
      client: lead.name,
      company: lead.company,
      budgetLabel: lead.budgetLabel,
      budgetValue: lead.budgetValue,
      owner: lead.owner,
      source: lead.source,
      phone: lead.phone,
      email: lead.email,
      summary: lead.projectDescription ?? lead.notes,
      notes: lead.notes,
      deliverables: projected.deliverables,
      stages: projected.stages,
      tasks: projected.tasks,
      milestones: projected.milestones,
      notifications: current.notifications?.length ? current.notifications : projected.notifications,
      status: projected.status,
      currentPhase: projected.currentPhase,
      nextMilestone: projected.nextMilestone,
      updatedAt: Date.now(),
      completion: Math.max(current.completion, projected.completion),
    };
  });

  safeWrite(synced);
  return synced;
};

const computeProjectCompletion = (tasks: ProjectTask[]) => {
  if (!tasks.length) return 0;
  const progressSum = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(progressSum / tasks.length);
};

const withUpdatedProject = (projectId: string, updater: (project: ProjectRecord) => ProjectRecord) => {
  const projects = getProjects();
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return undefined;
  }

  const updated = updater(project);
  const nextProjects = [updated, ...projects.filter((item) => item.id !== projectId)];
  safeWrite(nextProjects);
  return updated;
};

export const startProjectAutomation = (projectId: string) => {
  return withUpdatedProject(projectId, (project) => {
    const lead = getLeads().find((item) => `${item.id}` === project.id || item.id === project.leadId);
    if (!lead) {
      return project;
    }

    const regenerated = buildAutomatedTasks(lead, Date.now());
    const now = Date.now();

    return {
      ...project,
      tasks: regenerated,
      completion: computeProjectCompletion(regenerated),
      currentPhase: "Automated Execution",
      nextMilestone: "Client approval on design V1",
      updatedAt: now,
      notifications: [
        {
          id: `nt-client-start-${project.id}-${now}`,
          type: "client-update",
          message: "Project started with auto-generated and auto-assigned task board.",
          createdAt: now,
        },
        ...makeNotifications(regenerated),
        ...project.notifications,
      ].slice(0, 20),
    };
  });
};

export const updateProjectTaskStatus = (projectId: string, taskId: string, status: ProjectTaskStatus) => {
  return withUpdatedProject(projectId, (project) => {
    const taskMap = new Map(project.tasks.map((task) => [task.id, task]));
    const selected = taskMap.get(taskId);
    if (!selected) {
      return project;
    }

    const dependencyBlocked = selected.dependsOn.some((dep) => taskMap.get(dep)?.status !== "done");
    if (status === "in-progress" && dependencyBlocked) {
      return project;
    }

    const updatedTasks = project.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        status,
        progress: status === "done" ? 100 : status === "in-progress" ? Math.max(task.progress, 35) : status === "blocked" ? 10 : 0,
      };
    });

    const normalized = markDelayedTasks(applyDependencyBlocking(updatedTasks));
    const now = Date.now();

    const nextNotifications = [...project.notifications];
    if (status === "done") {
      nextNotifications.unshift({
        id: `nt-completed-${taskId}-${now}`,
        type: "task-completed",
        message: `${selected.name} completed by ${selected.assignee}`,
        createdAt: now,
        taskId,
      });
    }

    return {
      ...project,
      tasks: normalized,
      completion: computeProjectCompletion(normalized),
      updatedAt: now,
      notifications: nextNotifications.slice(0, 20),
    };
  });
};

export const addFigmaVersion = (projectId: string, taskId: string, url: string) => {
  return withUpdatedProject(projectId, (project) => {
    const now = Date.now();
    const updatedTasks = project.tasks.map((task) => {
      if (task.id !== taskId || !task.figma) {
        return task;
      }

      const versionCount = task.figma.versions.length + 1;
      const version: FigmaVersion = {
        id: `fig-${task.id}-${now}`,
        label: versionCount === 1 ? "V1" : versionCount === 2 ? "V2" : versionCount >= 3 ? "Final" : `V${versionCount}`,
        url,
        createdAt: now,
      };

      return {
        ...task,
        status: "in-progress" as ProjectTaskStatus,
        progress: Math.max(task.progress, 55),
        figma: {
          ...task.figma,
          livePreviewUrl: url,
          versions: [...task.figma.versions, version],
        },
      };
    });

    return {
      ...project,
      tasks: markDelayedTasks(applyDependencyBlocking(updatedTasks)),
      updatedAt: now,
      notifications: [
        {
          id: `nt-figma-${taskId}-${now}`,
          type: "client-update",
          message: "Design link uploaded. Client review requested.",
          createdAt: now,
          taskId,
        },
        ...project.notifications,
      ].slice(0, 20),
    };
  });
};

export const approveFigmaVersion = (projectId: string, taskId: string, versionId: string) => {
  return withUpdatedProject(projectId, (project) => {
    const now = Date.now();
    const updatedTasks = project.tasks.map((task) => {
      if (task.id !== taskId || !task.figma) {
        return task;
      }

      return {
        ...task,
        status: "done" as ProjectTaskStatus,
        progress: 100,
        figma: {
          ...task.figma,
          approvedVersionId: versionId,
        },
      };
    });

    const normalized = markDelayedTasks(applyDependencyBlocking(updatedTasks));
    return {
      ...project,
      tasks: normalized,
      completion: computeProjectCompletion(normalized),
      updatedAt: now,
      notifications: [
        {
          id: `nt-figma-approved-${taskId}-${now}`,
          type: "client-update",
          message: "Client approved design. Frontend tasks unlocked automatically.",
          createdAt: now,
          taskId,
        },
        ...project.notifications,
      ].slice(0, 20),
    };
  });
};

export const getTeamAssignmentSnapshot = () => {
  const projects = getProjects();
  const map = new Map<string, { assignee: string; total: number; done: number; delayed: number; inProgress: number }>();

  projects.forEach((project) => {
    project.tasks.forEach((task) => {
      const current = map.get(task.assignee) ?? {
        assignee: task.assignee,
        total: 0,
        done: 0,
        delayed: 0,
        inProgress: 0,
      };

      current.total += 1;
      if (task.status === "done") current.done += 1;
      if (task.status === "in-progress") current.inProgress += 1;
      if (task.delayed) current.delayed += 1;
      map.set(task.assignee, current);
    });
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
};
