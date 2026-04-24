import { useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProjects } from "@/lib/project-store";
import { getProjectChat, postProjectChat } from "@/lib/collaboration-store";
import { getAuthSession } from "@/lib/auth-store";
import { toast } from "sonner";

export default function ChatPage() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const isAdmin = session?.role === "admin";
  const projects = useMemo(() => getProjects(), []);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? "");
  const [chatTick, setChatTick] = useState(0);
  const [message, setMessage] = useState("");

  const selectedProject = projects.find((item) => item.id === selectedProjectId);

  const chats = useMemo(() => {
    if (!selectedProjectId) return [];
    return getProjectChat(selectedProjectId).filter((item) => item.authorRole !== "client");
  }, [selectedProjectId, chatTick]);

  const employeesByProject = useMemo(() => {
    const map = new Map<string, string[]>();
    projects.forEach((project) => {
      const uniqueEmployees = Array.from(new Set(project.tasks.map((task) => task.assignee)));
      map.set(project.id, uniqueEmployees);
    });
    return map;
  }, [projects]);

  const selectedEmployees = employeesByProject.get(selectedProjectId) ?? [];

  const handleSend = () => {
    const text = message.trim();
    if (!text || !selectedProjectId) return;

    const authorRole = isAdmin ? "admin" : "team";
    const author = isAdmin ? "Project Manager" : (session?.employeeName ?? "Employee");

    postProjectChat(selectedProjectId, authorRole, author, text);
    setMessage("");
    setChatTick((prev) => prev + 1);
    toast.success("Message sent");
  };

  const formatTime = (value: number) => new Date(value).toLocaleString();

  const content = (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Chat Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin and employee team chat only
          </p>
        </div>
        {!isAdmin && (
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <GlassCard className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {projects.map((project) => {
              const last = getProjectChat(project.id).filter((item) => item.authorRole !== "client").at(-1);
              const employeeCount = (employeesByProject.get(project.id) ?? []).length;
              const active = project.id === selectedProjectId;
              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    active
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/50 bg-secondary/20 hover:bg-secondary/35"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{project.title}</p>
                  <p className="text-xs text-muted-foreground">{project.client} • {employeeCount} employee{employeeCount !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {last ? `${last.author}: ${last.message}` : "No messages yet"}
                  </p>
                </button>
              );
            })}
            {!projects.length ? (
              <p className="text-sm text-muted-foreground">No projects available.</p>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col h-[70vh]">
          <div className="pb-3 border-b border-border/50">
            <h2 className="font-semibold text-foreground">{selectedProject?.title ?? "Select a project"}</h2>
            <p className="text-xs text-muted-foreground">{selectedProject?.client ?? ""}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Employees in this project: {selectedEmployees.length}
            </p>
            {selectedEmployees.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedEmployees.map((employee) => (
                  <span
                    key={employee}
                    className="text-[11px] rounded-full border border-border/50 bg-secondary/25 px-2 py-1 text-muted-foreground"
                  >
                    {employee}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {chats.map((item) => {
              const mine = item.authorRole === (isAdmin ? "admin" : "team");
              return (
                <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-xl border px-3 py-2 ${
                      mine
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/50 bg-secondary/25"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">{item.author} • {formatTime(item.createdAt)}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>
                  </div>
                </div>
              );
            })}
            {!chats.length ? (
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
            ) : null}
          </div>

          <div className="pt-3 border-t border-border/50 flex gap-2">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSend();
                }
              }}
              placeholder="Type a message..."
            />
            <Button onClick={handleSend} disabled={!selectedProjectId || !message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );

  if (isAdmin) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return <div className="h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">{content}</div>;
}
