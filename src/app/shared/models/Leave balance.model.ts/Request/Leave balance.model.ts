// Matches HRMS.Models.LeaveBalanceRequest (used for POST/PUT /api/LeaveBalance)
export interface LeaveBalanceRequest {
  leaveBalanceID: number;
  employeeID: number;
  leaveTypeID: number;
  year: number;
  allocatedDays: number;
  usedDays: number;
}

// Matches HRMS.Models.LeaveBalanceResponse (returned by GET endpoints)
export interface LeaveBalanceResponse {
  leaveBalanceID: number;
  employeeID: number;
  leaveTypeID: number;
  year: number;
  allocatedDays: number;
  usedDays: number;
  // Derived, only used client-side if backend doesn't send it
  remainingDays?: number;
}
