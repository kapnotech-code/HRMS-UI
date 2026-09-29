// models/schedule-master-response.model.ts
export interface ScheduleMasterResponse {
  sM_Id: number;
  sM_ScheduleName: string;
  sM_ScheduleType: string;
  sM_Year: number;
  sM_StartDate: string;
  sM_EndDate: string;
  sM_ReviewDate: string;
  sM_IsActive: boolean;
  sM_Status: string;
  sM_Description: string;
  sM_CreatedBy: number;
  sM_CreatedAt: string;
  sM_UpdatedBy?: number;
  sM_UpdatedAt?: string;
  sM_ReviewerId?: number;
  sM_RevieweeId?: number;
  sM_ReviewType?: string;
  sM_PaidDays?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
