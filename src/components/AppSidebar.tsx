import {
  LayoutDashboard, Users, FolderKanban, ListTodo,
  CreditCard, Settings, LogOut, ChevronLeft, UserPlus, Clipboard, MessageSquare
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { clearAuthSession } from "@/lib/auth-store";

const mainNav = [
  { title: "Mission Control", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Requirements", url: "/requirements", icon: Clipboard },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Team", url: "/team", icon: UserPlus },
  { title: "Payments", url: "/payments", icon: CreditCard },
];

const bottomNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path.replace(/\/\d+$/, ''));

  const logout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">AI Project OS</h2>
              <p className="text-xs text-muted-foreground">Operating System</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">
            {!collapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive(item.url)
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                      activeClassName=""
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {bottomNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.url)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  activeClassName=""
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
