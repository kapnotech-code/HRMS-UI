import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { LeaveRequestService } from '../../../../core/services/leave.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { LeaveTypeService } from '../../../../core/services/leavetype.service';

import { AttendanceResponse } from '../../../../shared/models/Attendance/AttendanceRequest/attendanceRequest';
import { LeaveRequest, LeaveResponse } from '../../../../shared/models/Leave/leaverequest/leaverequest';
import { EmployeeResponse } from '../../../../shared/models/employee/ employee-response'; 
import { LeaveTypeResponse } from '../../../../shared/models/leavetype/leave-type-response/leave-type-response';

type TabType = 'records' | 'applyLeave' | 'approveLeave' | 'absentees';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './AttendanceList.html',
  styleUrls: ['./AttendanceList.css']
})
export class AttendanceList implements OnInit, OnDestroy {
  activeTab: TabType = 'records';

  attendances: AttendanceResponse[] = [];
  employees: EmployeeResponse[] = [];
  leaveTypes: LeaveTypeResponse[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  filterEmployeeId: number | null = null;

  // Split-flap clock digits
  hh0 = '0'; hh1 = '0';
  mm0 = '0'; mm1 = '0';
  ss0 = '0'; ss1 = '0';
  meridiem = 'AM';
  todayLabel = '';
  private clockInterval: any;

  // Quick punch (hero)
  quickEmployeeId: number | null = null;
  quickSource = 'Web';

  // Apply Leave
  leaveData: LeaveRequest = {
    employeeID: 0,
    leaveTypeID: 0,
    startDate: '',
    endDate: '',
    reason: ''
  };

  // Approve/Reject Leave
  pendingLeaves: LeaveResponse[] = [];
  loadingLeaves = false;
  approverId: number | null = null;

  // Mark Absentees
  absenteeDate = '';
  saving = false;

  constructor(
    private attendanceService: AttendanceService,
    private leaveRequestService: LeaveRequestService,
    private employeeService: EmployeeService,
    private leaveTypeService: LeaveTypeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadAttendance();
    this.updateClock();
    this.loadEmployees();
    this.loadLeaveTypes();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private updateClock(): void {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    this.meridiem = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;

    const hs = h.toString().padStart(2, '0');
    const ms = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');

    this.hh0 = hs[0]; this.hh1 = hs[1];
    this.mm0 = ms[0]; this.mm1 = ms[1];
    this.ss0 = ss[0]; this.ss1 = ss[1];

    this.todayLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    this.cdr.detectChanges();
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    if (tab === 'approveLeave') {
      this.loadPendingLeaves();
    }
  }

  loadAttendance(): void {
    this.loading = true;
    this.attendanceService.getAll().subscribe({
      next: (res: any) => {
        this.attendances = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Failed to load attendance records.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Employees load nahi hue:', err)
    });
  }

  loadLeaveTypes(): void {
    this.leaveTypeService.getAll().subscribe({
      next: (res: any) => {
        this.leaveTypes = res.data || res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Leave types load nahi hue:', err)
    });
  }

  getEmployeeName(employeeID: number): string {
    const emp = this.employees.find(e => e.employeeID === employeeID);
    return emp ? `${emp.firstName} ${emp.lastName}` : `EMP-${employeeID}`;
  }

  getInitials(employeeID: number): string {
    const emp = this.employees.find(e => e.employeeID === employeeID);
    if (!emp) return '?';
    return `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
  }

  getLeaveTypeName(leaveTypeID: number): string {
    const lt = this.leaveTypes.find(l => l.leaveTypeID === leaveTypeID);
    return lt ? lt.leaveTypeName : `Type-${leaveTypeID}`;
  }

  filterByEmployee(): void {
    if (!this.filterEmployeeId) { this.loadAttendance(); return; }
    this.loading = true;
    this.attendanceService.getByEmployee(this.filterEmployeeId).subscribe({
      next: (res: any) => {
        this.attendances = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Failed to load employee attendance.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearFilter(): void {
    this.filterEmployeeId = null;
    this.loadAttendance();
  }

  doCheckIn(): void {
    if (!this.quickEmployeeId) { alert('Employee ID is required.'); return; }
    this.saving = true;
    this.attendanceService.checkIn({ employeeID: this.quickEmployeeId, shiftID: null, source: this.quickSource }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.successMessage = res.message || 'Checked in successfully';
        this.loadAttendance();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        console.error(err);
        this.errorMessage = err?.error?.message || 'Check-in failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  doCheckOut(): void {
    if (!this.quickEmployeeId) { alert('Employee ID is required.'); return; }
    this.saving = true;
    this.attendanceService.checkOut({ employeeID: this.quickEmployeeId, source: this.quickSource }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.successMessage = res.message || 'Checked out successfully';
        this.loadAttendance();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        console.error(err);
        this.errorMessage = err?.error?.message || 'Check-out failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  submitLeave(): void {
    if (!this.leaveData.employeeID || !this.leaveData.leaveTypeID || !this.leaveData.startDate || !this.leaveData.endDate) {
      alert('Employee ID, Leave Type, Start Date and End Date are required.'); return;
    }
    this.saving = true;
    this.leaveRequestService.add(this.leaveData).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.successMessage = res.message || 'Leave applied successfully';
        this.leaveData = { employeeID: 0, leaveTypeID: 0, startDate: '', endDate: '', reason: '' };
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        console.error(err);
        const empName = this.getEmployeeName(this.leaveData.employeeID);
        this.errorMessage = `${empName}: Is date range mein pehle se ek leave request maujood hai.`;
        this.cdr.detectChanges();
      }
    });
  }

  loadPendingLeaves(): void {
    this.loadingLeaves = true;
    this.leaveRequestService.getPendingApprovals().subscribe({
      next: (res: any) => {
        this.pendingLeaves = res.data || [];
        this.loadingLeaves = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Failed to load pending leave requests.';
        this.loadingLeaves = false;
        this.cdr.detectChanges();
      }
    });
  }

  approveLeave(item: LeaveResponse): void {
    if (!this.approverId) { alert('Approver ID is required.'); return; }
    this.leaveRequestService.approveOrReject(item.leaveRequestID, 'Approved', this.approverId).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Leave approved';
        this.loadPendingLeaves();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Failed to approve leave. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  rejectLeave(item: LeaveResponse): void {
    if (!this.approverId) { alert('Approver ID is required.'); return; }
    this.leaveRequestService.approveOrReject(item.leaveRequestID, 'Rejected', this.approverId).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Leave rejected';
        this.loadPendingLeaves();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Failed to reject leave. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  submitMarkAbsentees(): void {
    if (!this.absenteeDate) { alert('Please select a date.'); return; }
    this.saving = true;
    this.attendanceService.markAbsentees({ forDate: this.absenteeDate }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.successMessage = res.message || 'Absentees marked successfully';
        this.loadAttendance();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        console.error(err);
        this.errorMessage = err?.error?.message || 'Failed to mark absentees. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteAttendance(id: number): void {
    if (!confirm('Delete this attendance record?')) return;
    this.attendanceService.delete(id, true).subscribe({
      next: () => this.loadAttendance(),
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Failed to delete the record. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
