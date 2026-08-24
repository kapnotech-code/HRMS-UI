export interface SalaryComponentResponse {
  sc_Id: number;
  sc_ComponentCode: string;
  sc_ComponentName: string;
  sc_ComponentType: 'Earning' | 'Deduction';
  sc_CalculationType: 'Fixed' | 'Percentage';
  sc_CalculationValue: number;
  sc_IsTaxable: boolean;
  sc_IsActive: boolean;
  sc_CreatedAt: string;
  sc_UpdatedAt: string | null;
}

export interface SalaryComponentRequest {
  sc_ComponentCode: string;
  sc_ComponentName: string;
  sc_ComponentType: 'Earning' | 'Deduction';
  sc_CalculationType: 'Fixed' | 'Percentage';
  sc_CalculationValue: number;
  sc_IsTaxable: boolean;
  sc_IsActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
