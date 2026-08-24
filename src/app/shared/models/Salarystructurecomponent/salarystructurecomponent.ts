export interface SalaryStructureComponentRequest {
  SSC_Id?: number;
  SSC_SS_Id: number;
  SSC_SC_Id: number;
  SSC_CalculationType: 'Fixed' | 'Percentage';
  SSC_Value: number;
  SSC_DisplayOrder?: number | null;
}

export interface SalaryStructureComponentResponse {
  SSC_Id: number;
  SSC_SS_Id: number;
  SSC_SC_Id: number;
  SSC_CalculationType: 'Fixed' | 'Percentage';
  SSC_Value: number;
  SSC_DisplayOrder: number | null;
  SSC_CreatedAt: string | null;
  SSC_UpdatedAt: string | null;
}

// Matches ApiResponse<T>.SuccessResponse / FailResponse on the backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}
