export interface YearlyPaidResponse {
  YP_Id: number;
  YP_ST_Id: number;
  YP_EmployeeId: number;
  EmployeeName?: string;
  YP_Year: number;
  YP_EligibleDays: number;
  YP_PaidDays: number;
  YP_Amount: number;
  YP_Status: string;
  YP_PayrollId?: number;
  YP_PaidDate?: string;
  YP_Remarks?: string;
}
