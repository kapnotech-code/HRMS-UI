// Matches HRMS.Models.LeaveRequest (used for POST /api/LeaveRequest)
export interface LeaveRequest {
  employeeID: number;
  leaveTypeID: number;
  startDate: string;   // ISO date string, e.g. '2026-08-01'
  endDate: string;     // ISO date string
  reason: string;
}

// Matches HRMS.Models.LeaveRequestResponse (returned by GET endpoints)
export interface LeaveRequestResponse {
  leaveRequestID: number;
  employeeID: number;
  leaveTypeID: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;       // Pending | Approved | Rejected | Cancelled
  approvedBy?: number | null;
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
