export interface ScheduleEmployeeResponse {
  sE_Id: number;
  sE_SM_Id: number;
  sE_EmployeeId: number;
  employeeName: string;
  sE_Status: string;
  sE_Eligible: boolean;
  sE_ReviewRequired: boolean;
  sE_Remarks: string;
  sE_CreatedAt: string;
  sE_UpdatedAt?: string;
}
