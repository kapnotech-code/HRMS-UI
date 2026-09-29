export interface ScheduleEmployeeRequest {
  SE_Id?: number;
  SE_SM_Id: number;
  SE_EmployeeId: number;
  SE_Status?: string;       // Pending / Eligible / NotEligible
  SE_Eligible: boolean;
  SE_ReviewRequired: boolean;
  SE_Remarks?: string;
}
