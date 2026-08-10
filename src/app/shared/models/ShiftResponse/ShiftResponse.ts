// shared/models/ShiftResponse/ShiftResponse.ts
export interface ShiftResponse {
  shiftID: number;
  shiftName: string;
  startTime: string;   // TimeSpan backend se string ki tarah aata hai (e.g. "09:00:00")
  endTime: string;
  graceMinutes: number;
  companyID?: number | null;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
}
