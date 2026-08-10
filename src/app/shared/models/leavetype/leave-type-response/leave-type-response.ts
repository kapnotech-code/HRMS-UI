export interface LeaveTypeResponse {
  leaveTypeID: number;
  leaveTypeName: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  isActive: boolean;
  createdDate?: string | null;
  modifiedDate?: string | null;
}
