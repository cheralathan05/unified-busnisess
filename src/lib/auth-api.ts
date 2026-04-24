import { getAuthSession } from "@/lib/auth-store";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string | null;
  profileComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  role?: "admin" | "employee" | "client";
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginResponse = AuthResponse & {
  token: string;
  needsCompanySetup: boolean;
};

export type SimpleMessageResponse = {
  message: string;
};

export type CompleteCompanySetupResponse = {
  userId: string;
  companyName: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const API_FALLBACK_URLS = (import.meta.env.VITE_API_FALLBACK_URLS as string | undefined)
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean) ?? ["http://localhost:5000/api", "http://localhost:5001/api"];

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const getAuthorizationHeader = () => {
  const session = getAuthSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
};

const unwrapResponse = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Request failed.", response.status);
  }

  return unwrapResponse<T>(payload);
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const requestInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(authenticated ? getAuthorizationHeader() : {}),
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, requestInit);
    return parseResponse<T>(response);
  } catch (error) {
    if (!import.meta.env.DEV || API_BASE_URL !== "/api") {
      throw error;
    }

    for (const baseUrl of API_FALLBACK_URLS) {
      try {
        const response = await fetch(`${baseUrl}${path}`, requestInit);
        return await parseResponse<T>(response);
      } catch {
        // Try next fallback URL.
      }
    }

    throw error;
  }
}

export const authApi = {
  signup: (payload: SignUpPayload) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: ({ role: _role, ...payload }: LoginPayload) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((response) => ({
      ...response,
      token: response.accessToken,
      needsCompanySetup: !Boolean(response.user.companyName?.trim()),
    })),

  me: () => request<AuthUser>("/auth/me", { method: "GET" }, true),

  completeCompanySetup: (companyName: string) =>
    request<CompleteCompanySetupResponse>(
      "/onboarding/business",
      {
        method: "POST",
        body: JSON.stringify({ companyName }),
      },
      true,
    ),

  requestPasswordReset: (email: string) =>
    request<SimpleMessageResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyResetOtp: (email: string, otp: string) =>
    request<SimpleMessageResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (email: string, otp: string, password: string) =>
    request<SimpleMessageResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword: password }),
    }),
};

export { ApiError };