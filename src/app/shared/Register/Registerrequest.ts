export interface RegisterRequest {
  // Admin account
  fullName: string;
  loginName: string;
  email: string;
  password: string;
  // Company info
  companyName: string;
  companyEmail: string;
  industry?: string;
  companySize?: string;
  country?: string;
  phone?: string;
  website?: string;
  selectedPlan?: string;
}
