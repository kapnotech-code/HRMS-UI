export interface LeaveTypeRequest {
  leaveTypeID?: number | null;
  leaveTypeName: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
}
