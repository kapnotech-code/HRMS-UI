// shared/models/ShiftRequest/ShiftRequest.ts
export interface ShiftRequest {
  shiftID?: number | null;
  shiftName: string;
  startTime: string;   // "HH:mm" ya "HH:mm:ss" format me bhejna
  endTime: string;
  graceMinutes: number;
  companyID?: number | null;
}
