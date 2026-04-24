export type AuthRole = "admin" | "employee" | "client";

export type AuthSession = {
  role: AuthRole;
  token?: string;
  userId?: string;
  email?: string;
  name?: string;
  companyName?: string;
  profileComplete?: boolean;
  employeeName?: string;
  clientAccessId?: string;
  createdAt?: number;
};

const AUTH_KEY = "ai-project-os.auth-session";
const PASSWORD_RESET_KEY = "ai-project-os.password-reset-flow";

export const getAuthSession = (): AuthSession | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as AuthSession & { role?: string };
    const role = String(parsed.role ?? "");
    if (!role) return undefined;
    if (role === "USER") {
      parsed.role = "admin";
    }
    if (parsed.role !== "admin" && parsed.role !== "employee" && parsed.role !== "client") {
      return undefined;
    }
    if ((parsed.role === "admin" || parsed.role === "employee") && !parsed.token) return undefined;
    if (!parsed.createdAt) {
      parsed.createdAt = Date.now();
    }
    return parsed;
  } catch {
    return undefined;
  }
};

export const setAuthSession = (session: AuthSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify({ ...session, createdAt: session.createdAt ?? Date.now() }));
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
};

export type PasswordResetFlow = {
  email: string;
  otp?: string;
  requestedAt: number;
};

export const setPasswordResetFlow = (flow: PasswordResetFlow) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(flow));
};

export const getPasswordResetFlow = (): PasswordResetFlow | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(PASSWORD_RESET_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as PasswordResetFlow;
  } catch {
    return undefined;
  }
};

export const clearPasswordResetFlow = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PASSWORD_RESET_KEY);
};

export const getDefaultRouteForSession = (session?: AuthSession) => {
  if (!session) return "/login";
  if (session.role !== "client" && session.profileComplete === false) return "/company-setup";
  if (session.role === "admin") return "/dashboard";
  if (session.role === "employee") {
    return `/developer-workspace/${encodeURIComponent(session.name ?? session.employeeName ?? "Employee")}`;
  }
  if (session.role === "client") {
    return session.clientAccessId ? `/client/portal/${encodeURIComponent(session.clientAccessId)}` : "/client/login";
  }
  return "/login";
};
