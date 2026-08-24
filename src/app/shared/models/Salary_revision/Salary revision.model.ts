export interface SalaryRevisionRequest {
  sr_Id?: number;
  sr_EmployeeId: number;
  sr_PreviousES_Id?: number | null;
  sr_NewES_Id: number;
  sr_RevisionType: 'Increment' | 'Promotion' | 'Adjustment';
  sr_RevisionDate: string;
  sr_Reason?: string | null;
  sr_ApprovedBy?: number | null;
}

export interface SalaryRevisionResponse {
  sr_Id: number;
  sr_EmployeeId: number;
  sr_PreviousES_Id: number | null;
  sr_NewES_Id: number;
  sr_RevisionType: string;
  sr_RevisionDate: string;
  sr_Reason: string | null;
  sr_ApprovedBy: number | null;
  sr_CreatedAt: string | null;
}

// Matches ApiResponse<T>.SuccessResponse / FailResponse on the backend
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}
