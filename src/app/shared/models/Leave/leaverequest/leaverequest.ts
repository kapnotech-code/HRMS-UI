export interface LeaveResponse {
  leaveRequestID: number;
  employeeID: number;
  leaveTypeID: number;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;          // Pending / Approved / Rejected / Cancelled
  appliedDate?: string;
  approvedBy?: number | null;
}

export interface LeaveRequest {

  employeeID: number;
  leaveTypeID: number;
  startDate: string;
  endDate: string;
  reason?: string;
}
