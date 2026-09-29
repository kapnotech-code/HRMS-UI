
// ============================================================
// REQUEST — sent via POST/PUT. ASP.NET Core's default model
// binder matches JSON property names case-insensitively, so
// ST_Id vs sT_Id makes no functional difference here. Casing
// below is aligned to sT_ purely for consistency with the
// response model above (not required for correctness).
// ============================================================
export interface ScheduleTransactionRequest {
  sT_Id?: number;
  sT_SE_Id: number;
  sT_TransactionType: string;   // e.g. Review / Payment / Correction
  sT_TransactionDate: string;
  sT_Status?: string;           // Add ke time backend set kare to, ya default 'Pending'
  sT_Remarks?: string;
  sT_CreatedBy?: number;
  sT_UpdatedBy?: number;
}

export interface ScheduleTransactionStatusRequest {
  sT_Id: number;
  sT_Status: string;            // Approved / Rejected / Correction / Resubmitted / Processed / Completed
  sT_ActionBy: number;
  sT_Remarks?: string;
}
