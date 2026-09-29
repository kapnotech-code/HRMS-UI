export interface ScheduleTransactionResponse {
  sT_Id: number;
  sT_SE_Id: number;
  sE_EmployeeId: number;
  employeeName?: string;
  sT_TransactionType: string;
  sT_TransactionDate: string;
  sT_Status: string;
  sT_ActionBy?: number | null;
  sT_ActionDate?: string | null;
  sT_Remarks?: string | null;
  sT_CreatedBy?: number;
  sT_CreatedAt: string;
  sT_UpdatedBy?: number;
  sT_UpdatedAt?: string;
}
