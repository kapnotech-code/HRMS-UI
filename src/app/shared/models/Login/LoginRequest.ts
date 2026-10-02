export interface LoginRequest {
  userId: string;
  loginName: string;
  password: string;
  deviceId: string;
  companySlug?: string;
  companyId?: number;
}

export interface TenantChoice {
  companyId: number;
  companyName: string;
  slug: string;
  logoUrl?: string | null;
}
