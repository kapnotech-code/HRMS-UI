// shared/models/ScheduleMaster/ScheduleMasterRequest.ts
export interface ScheduleMasterRequest {
  sm_Id?: number;
  sm_ScheduleName: string;
  sm_ScheduleType: string;
  sm_Year: number;
  sm_StartDate: string;
  sm_EndDate: string;
  sm_ReviewDate: string;
  sm_IsActive?: boolean;
  sm_Status?: string;
  sm_Description?: string;
  sm_CreatedBy?: number;
  sm_UpdatedBy?: number;
  sm_ReviewerId?: number;
  sm_RevieweeId?: number;
  sm_ReviewType?: string;
}
