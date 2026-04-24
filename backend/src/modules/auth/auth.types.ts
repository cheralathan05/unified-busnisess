// auto-generated
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}