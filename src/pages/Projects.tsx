import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FolderKanban, Sparkles, Target, TrendingUp, User } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProjects } from "@/lib/project-store";

export default function Projects() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState(() => getProjects());

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return projects;
    }

    return projects.filter((project) =>
      [project.title, project.client, project.company, project.owner, project.source]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [projects, query]);

  const totals = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((project) => project.status === "active").length;
    const completed = projects.filter((project) => project.status === "completed").length;
    const avgCompletion = total ? Math.round(projects.reduce((sum, project) => sum + project.completion, 0) / total) : 0;

    return { total, active, completed, avgCompletion };
  }, [projects]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Project Workspace
            </div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground">Every lead automatically appears here as a specific project workflow.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => setProjects(getProjects())}>
              Refresh
            </Button>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => navigate("/leads")}>Go to Leads</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GlassCard>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total projects</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{totals.total}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active projects</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{totals.active}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed projects</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{totals.completed}</p>
          </GlassCard>
          <GlassCard>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Average completion</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{totals.avgCompletion}%</p>
          </GlassCard>
        </div>

        <div className="relative">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by project, client, company, owner..."
            className="h-11 border-border/50 bg-card/60"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <GlassCard
              key={project.id}
              className="space-y-4 cursor-pointer"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.company} · {project.client}</p>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground">Owner</p>
                  <p className="mt-1 text-foreground font-medium inline-flex items-center gap-1"><User className="w-3 h-3" /> {project.owner}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground">Next Milestone</p>
                  <p className="mt-1 text-foreground font-medium">{project.nextMilestone}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground">Budget</p>
                  <p className="mt-1 text-foreground font-medium">{project.budgetLabel}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                  <p className="text-muted-foreground">Completion</p>
                  <p className="mt-1 text-foreground font-medium inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {project.completion}%</p>
                </div>
              </div>

              <ProgressBar value={project.completion} label="Execution progress" />

              <div className="rounded-xl border border-border/50 bg-primary/5 p-3 text-sm text-muted-foreground inline-flex items-center gap-2 w-full justify-between">
                <span className="inline-flex items-center gap-1"><Target className="w-3.5 h-3.5 text-primary" /> Open specific project workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
