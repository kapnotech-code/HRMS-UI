export interface AttendanceResponse {
  attendanceID: number;
  employeeID: number;
  companyID: number;
  attendanceDate: string;
  shiftID: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  workedHours: number | null;
  status: string;
  remarks: string | null;
  source: string;
  createdAt: string;
  modifiedAt: string | null;
}

export interface AttendanceRequest {
  attendanceID?: number;
  employeeID: number;
  companyID: number;
  attendanceDate: string;
  shiftID?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
  remarks?: string | null;
  source: string;
}
