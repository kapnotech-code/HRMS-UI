
export interface EmployeeShiftRequest {
  employeeShiftID?: number | null;
  employeeID: number;
  shiftID: number;
  effectiveFrom: string;   // ISO date string, e.g. '2026-07-24'
  effectiveTo?: string | null;
}

export interface EmployeeShiftResponse {
  employeeShiftID: number;
  employeeID: number;
  shiftID: number;
  shiftName?: string | null;
  startTime?: string | null;   // TimeSpan comes back as "HH:mm:ss"
  endTime?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdDate?: string | null;
  modifiedDate?: string | null;
}

// Generic wrapper for the Add endpoint's response
export interface AddShiftResult {
  employeeShiftID: number;
  message: string;
}

export interface ApiMessage {
  message: string;
}
