import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PasswordLockOverlay } from "@/components/PasswordLockOverlay";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordOtp from "./pages/ForgotPasswordOtp";
import ResetPassword from "./pages/ResetPassword";
import CompanySetup from "./pages/CompanySetup";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Payments from "./pages/Payments";
import TeamPage from "./pages/Team";
import RequirementsPage from "./pages/RequirementsPage";
import ChatPage from "./pages/Chat";
import DeveloperWorkspace from "./pages/DeveloperWorkspace";
import EmployeeTaskDetail from "./pages/EmployeeTaskDetail";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LeadForm from "./pages/LeadForm";
import ClientLogin from "./pages/ClientLogin";
import ClientPortal from "./pages/ClientPortal";
import ClientIntakePremium from "./pages/ClientIntakePremium";
import ProposalView from "./pages/ProposalView";
import { getAuthSession, getDefaultRouteForSession, type AuthRole } from "@/lib/auth-store";

const queryClient = new QueryClient();

function RequireRole({ allowed }: { allowed: AuthRole[] }) {
  const session = getAuthSession();
  if (!session || !allowed.includes(session.role)) {
    if (session?.role === "client") {
      return <Navigate to="/client/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (session.role !== "client" && session.profileComplete === false) {
    return <Navigate to="/company-setup" replace />;
  }

  return <Outlet />;
}

function RequireSession({ allowed, allowIncomplete = false }: { allowed: AuthRole[]; allowIncomplete?: boolean }) {
  const session = getAuthSession();
  if (!session || !allowed.includes(session.role)) {
    if (session?.role === "client") {
      return <Navigate to="/client/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (!allowIncomplete && session.role !== "client" && session.profileComplete === false) {
    return <Navigate to="/company-setup" replace />;
  }

  return <Outlet />;
}

function PublicAuthRedirect({ children }: { children: JSX.Element }) {
  const session = getAuthSession();
  if (!session) {
    return children;
  }
  if (session.role !== "client" && session.profileComplete === false) {
    return <Navigate to="/company-setup" replace />;
  }
  return <Navigate to={getDefaultRouteForSession(session)} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicAuthRedirect><Login /></PublicAuthRedirect>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/otp" element={<ForgotPasswordOtp />} />
        <Route path="/forgot-password/new-password" element={<ResetPassword />} />
        <Route path="/client/login" element={<PublicAuthRedirect><ClientLogin /></PublicAuthRedirect>} />
        <Route path="/client/intake/:accessId" element={<ClientIntakePremium />} />

        <Route element={<RequireSession allowed={["admin", "employee"]} allowIncomplete />}>
          <Route path="/company-setup" element={<CompanySetup />} />
        </Route>

        <Route element={<RequireRole allowed={["admin"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/lead-form" element={<LeadForm />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/requirements" element={<RequirementsPage />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route element={<RequireRole allowed={["employee"]} />}>
          <Route path="/developer-workspace/:name/:section?" element={<DeveloperWorkspace />} />
          <Route path="/task/:projectId/:taskId" element={<EmployeeTaskDetail />} />
        </Route>

        <Route element={<RequireRole allowed={["admin", "employee"]} />}>
          <Route path="/chat" element={<ChatPage />} />
        </Route>

        <Route element={<RequireRole allowed={["client"]} />}>
          <Route path="/client/portal/:accessId" element={<ClientPortal />} />
          <Route path="/proposal/:leadId" element={<ProposalView />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PasswordLockOverlay appName="Digital Nexus" />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
