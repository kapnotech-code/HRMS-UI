export interface YearlyPaidRequest {
  YP_Id?: number;
  YP_ST_Id: number;
  YP_EmployeeId: number;
  YP_Year: number;
  YP_EligibleDays: number;
  YP_PaidDays: number;
  YP_Amount: number;
  YP_Status?: string;       // Pending / Approved / Processed / Paid
  YP_Remarks?: string;
}

export interface YearlyPaidApproveRequest {
  YP_Id: number;
  YP_Remarks?: string;
}

export interface YearlyPaidMarkPaidRequest {
  YP_Id: number;
  YP_PayrollId: number;
  YP_PaidDate: string;
}
