import { Users, UserPlus, Mail, Shield, MoreHorizontal, Search, Eye, ExternalLink, CheckCircle2, Clock, Pen, Code, Globe, FileImage } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIInsightBox } from "@/components/AIInsightBox";
import { PageTransition } from "@/components/PageTransition";
import { ProgressBar } from "@/components/ProgressBar";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getTeamAssignmentSnapshot } from "@/lib/project-store";

interface WorkItem {
  id: number;
  title: string;
  type: "figma" | "frontend" | "backend" | "design" | "deployed";
  status: "completed" | "in-progress" | "review";
  preview?: string;
  url?: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "away" | "offline";
  avatar: string;
  tasks: number;
  progress: number;
  work: WorkItem[];
}

const initialEmployees: Employee[] = [
  {
    id: 1, name: "Sarah Chen", email: "sarah@aiprojectos.com", role: "Lead Designer", department: "Design",
    status: "active", avatar: "SC", tasks: 12, progress: 78,
    work: [
      { id: 1, title: "Dashboard UI Redesign", type: "figma", status: "completed", url: "#" },
      { id: 2, title: "Mobile App Wireframes", type: "figma", status: "in-progress" },
      { id: 3, title: "Brand Guidelines v2", type: "design", status: "completed" },
      { id: 4, title: "Landing Page Mockup", type: "figma", status: "review" },
    ],
  },
  {
    id: 2, name: "Alex Rivera", email: "alex@aiprojectos.com", role: "Full Stack Developer", department: "Engineering",
    status: "active", avatar: "AR", tasks: 8, progress: 65,
    work: [
      { id: 5, title: "Lead Management Module", type: "frontend", status: "completed", url: "/leads" },
      { id: 6, title: "Payment Integration UI", type: "frontend", status: "in-progress", url: "/payments" },
      { id: 7, title: "Auth Flow (Login/Signup)", type: "frontend", status: "completed", url: "/login" },
      { id: 8, title: "REST API – Leads", type: "backend", status: "completed" },
    ],
  },
  {
    id: 3, name: "Maya Patel", email: "maya@aiprojectos.com", role: "Project Manager", department: "Operations",
    status: "active", avatar: "MP", tasks: 15, progress: 90,
    work: [
      { id: 9, title: "Sprint Planning Doc", type: "design", status: "completed" },
      { id: 10, title: "Client Onboarding Flow", type: "design", status: "in-progress" },
    ],
  },
  {
    id: 4, name: "James Wilson", email: "james@aiprojectos.com", role: "Backend Developer", department: "Engineering",
    status: "away", avatar: "JW", tasks: 6, progress: 45,
    work: [
      { id: 11, title: "Database Schema Design", type: "backend", status: "completed" },
      { id: 12, title: "API – Task Management", type: "backend", status: "in-progress" },
      { id: 13, title: "WebSocket Notifications", type: "backend", status: "review" },
    ],
  },
  {
    id: 5, name: "Emma Davis", email: "emma@aiprojectos.com", role: "QA Engineer", department: "Engineering",
    status: "active", avatar: "ED", tasks: 10, progress: 82,
    work: [
      { id: 14, title: "E2E Test Suite – Leads", type: "frontend", status: "completed" },
      { id: 15, title: "Performance Audit Report", type: "design", status: "completed" },
    ],
  },
  {
    id: 6, name: "Liam Kim", email: "liam@aiprojectos.com", role: "DevOps Engineer", department: "Engineering",
    status: "offline", avatar: "LK", tasks: 4, progress: 100,
    work: [
      { id: 16, title: "CI/CD Pipeline Setup", type: "deployed", status: "completed", url: "#" },
      { id: 17, title: "Production Deploy v2.1", type: "deployed", status: "completed", url: "#" },
    ],
  },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  away: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  offline: "bg-muted text-muted-foreground border-border",
};

const workTypeIcons: Record<string, React.ReactNode> = {
  figma: <Pen className="w-3.5 h-3.5" />,
  frontend: <Code className="w-3.5 h-3.5" />,
  backend: <Code className="w-3.5 h-3.5" />,
  design: <FileImage className="w-3.5 h-3.5" />,
  deployed: <Globe className="w-3.5 h-3.5" />,
};

const workTypeColors: Record<string, string> = {
  figma: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  frontend: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  backend: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  design: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  deployed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const workStatusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  "in-progress": <Clock className="w-3.5 h-3.5 text-amber-400" />,
  review: <Eye className="w-3.5 h-3.5 text-blue-400" />,
};

export default function TeamPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteDept, setInviteDept] = useState("");
  const [teamMembers, setTeamMembers] = useState<Employee[]>(initialEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const assignmentSnapshot = useMemo(() => getTeamAssignmentSnapshot(), [teamMembers]);

  const normalizedTeam = useMemo(
    () =>
      teamMembers.map((member) => {
        const stats = assignmentSnapshot.find((item) => item.assignee === member.name);
        if (!stats) {
          return member;
        }

        const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : member.progress;
        return {
          ...member,
          tasks: stats.total,
          progress,
        };
      }),
    [assignmentSnapshot, teamMembers],
  );

  const filtered = normalizedTeam.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = () => {
    if (!inviteEmail || !inviteRole || !inviteName) {
      toast({ title: "Missing fields", description: "Please fill name, email, and role.", variant: "destructive" });
      return;
    }
    const newEmployee: Employee = {
      id: Date.now(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      department: inviteDept || "Engineering",
      status: "active",
      avatar: inviteName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      tasks: 0,
      progress: 0,
      work: [],
    };
    setTeamMembers((prev) => [...prev, newEmployee]);
    toast({ title: "Employee invited!", description: `${inviteName} has been added to the team.` });
    setInviteEmail("");
    setInviteName("");
    setInviteRole("");
    setInviteDept("");
    setInviteOpen(false);
    navigate(`/developer-workspace/${encodeURIComponent(inviteName)}`);
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" /> Team
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{teamMembers.length} members</p>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
                  <UserPlus className="w-4 h-4" /> Invite Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <Mail className="w-5 h-5 text-primary" /> Invite Employee
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="bg-secondary/50 border-border/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="employee@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-secondary/50 border-border/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="bg-secondary/50 border-border/50 h-11">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="Designer">Designer</SelectItem>
                        <SelectItem value="Project Manager">Project Manager</SelectItem>
                        <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                        <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Department</Label>
                    <Select value={inviteDept} onValueChange={setInviteDept}>
                      <SelectTrigger className="bg-secondary/50 border-border/50 h-11">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* AI Insight */}
          <AIInsightBox
            insight={`Smart allocation is active. ${assignmentSnapshot.reduce((sum, member) => sum + member.total, 0)} tasks are distributed across the team with live completion tracking.`}
            action="View Workload"
          />

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50 h-10"
            />
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => (
              <GlassCard key={emp.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                      {emp.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.role}</p>
                    </div>
                  </div>
                  <button className="p-1 rounded-md hover:bg-secondary transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-medium text-foreground">{emp.progress}%</span>
                  </div>
                  <ProgressBar value={emp.progress} max={100} />
                </div>

                {/* Status & Department */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[emp.status]}>
                      {emp.status}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      <Shield className="w-3 h-3 mr-1" /> {emp.department}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{emp.tasks} tasks</span>
                </div>

                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-border/50"
                    onClick={() => navigate(`/developer-workspace/${encodeURIComponent(emp.name)}`)}
                  >
                    Open Developer Workspace
                  </Button>
                </div>

                {/* Work Items Preview */}
                {emp.work.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Work</p>
                    {emp.work.slice(0, 2).map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`p-1 rounded border ${workTypeColors[w.type]}`}>
                            {workTypeIcons[w.type]}
                          </span>
                          <span className="text-xs text-foreground truncate">{w.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {workStatusIcons[w.status]}
                          {w.url && (
                            <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer" />
                          )}
                        </div>
                      </div>
                    ))}
                    {emp.work.length > 2 && (
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors w-full text-center py-1"
                      >
                        View all {emp.work.length} items →
                      </button>
                    )}
                    {emp.work.length <= 2 && (
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors w-full text-center py-1"
                      >
                        View details →
                      </button>
                    )}
                  </div>
                )}

                {emp.work.length === 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground text-center py-2">No work assigned yet</p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No team members found.</p>
            </div>
          )}
        </div>

        {/* Employee Detail Modal */}
        <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
          <DialogContent className="bg-card border-border/50 max-w-lg max-h-[80vh] overflow-y-auto">
            {selectedEmployee && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-base font-semibold text-primary-foreground">
                      {selectedEmployee.avatar}
                    </div>
                    <div>
                      <DialogTitle className="text-foreground">{selectedEmployee.name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">{selectedEmployee.role} · {selectedEmployee.department}</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/30 text-center">
                      <p className="text-lg font-bold text-foreground">{selectedEmployee.tasks}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/30 text-center">
                      <p className="text-lg font-bold text-foreground">{selectedEmployee.work.filter(w => w.status === "completed").length}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/30 text-center">
                      <p className="text-lg font-bold text-foreground">{selectedEmployee.progress}%</p>
                      <p className="text-xs text-muted-foreground">Progress</p>
                    </div>
                  </div>

                  {/* All Work Items */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">All Work & Deliverables</p>
                    <div className="space-y-2">
                      {selectedEmployee.work.map((w) => (
                        <div key={w.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`p-1.5 rounded-lg border ${workTypeColors[w.type]}`}>
                              {workTypeIcons[w.type]}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{w.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{w.type} · {w.status.replace("-", " ")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {workStatusIcons[w.status]}
                            {w.url && (
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {selectedEmployee.work.length === 0 && (
                        <div className="text-center py-8">
                          <Code className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No work assigned yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </PageTransition>
    </DashboardLayout>
  );
}
