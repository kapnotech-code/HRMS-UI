export interface AttendanceResponse {
  attendanceID: number;
  companyID: number;
  employeeID: number;
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

export interface CheckInRequest {
  employeeID: number;
  shiftID?: number | null;
  source: string;
}

export interface CheckOutRequest {
  employeeID: number;
  source: string;
}

export interface ApplyLeaveRequest {
  employeeID: number;
  leaveTypeID: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ActionLeaveRequest {
  leaveRequestID: number;
  approverID: number;
  newStatus: string;
}

export interface MarkAbsenteesRequest {
  forDate: string;
}
