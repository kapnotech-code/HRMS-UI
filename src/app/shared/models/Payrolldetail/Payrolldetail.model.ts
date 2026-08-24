export interface PayrollDetailsResponse {
  pd_Id: number;
  pd_PR_Id: number;
  pd_SC_Id: number;
  pd_ComponentName: string;
  pd_ComponentType: string;
  pd_CalculationType: string;
  pd_RateOrValue: number | null;
  pd_Amount: number;
  pd_CreatedAt?: string;
}

export interface PayrollDetailsRequest {
  pd_Id?: number;
  pd_PR_Id: number;
  pd_SC_Id: number;
  pd_ComponentName: string;
  pd_ComponentType: string;
  pd_CalculationType: string;
  pd_RateOrValue: number | null;
  pd_Amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const COMPONENT_TYPES = ['Earning', 'Deduction'] as const;
export const CALCULATION_TYPES = ['Fixed', 'Percentage'] as const;
