import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ScheduleMasterService, ScheduleProcessRequest, ScheduleMasterResponse } from '@core/services/schedule-master.service';
import { ScheduleEmployeeService } from '@core/services/schedule-employee.service';
import { EmployeeService } from '@core/services/employee.service';
import { AuthService } from '@core/services/Auth.service';
import { FrontendPermissionService } from '@core/services/frontend-permission.service';
import { ScheduleEmployeeResponse } from '@shared/models/schedule-employee.model/schedule-employee-response.model';
import { EmployeeResponse } from '@shared/models/employee/employee-response';
import { ScheduleEmployeeRequest } from '@shared/models/schedule-employee.model/schedule-employee-request.model';

@Component({
  selector: 'app-schedule-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ScheduleEmployee.html',
  styleUrls: ['./ScheduleEmployee.css']
})
export class ScheduleEmployeeComponent implements OnInit {

  scheduleId: number | null = null;
  schedule: ScheduleMasterResponse | null = null;
  loading = false;
  errorMessage = '';
  saving = false;

  allEmployees: EmployeeResponse[] = [];
  mappedEmployees: ScheduleEmployeeResponse[] = [];
  availableEmployees: EmployeeResponse[] = [];

  schedules: ScheduleMasterResponse[] = [];

  selectedEmployeeIds: number[] = [];
  selectAll = false;

  canAdd = true;
  canDelete = true;
  canProcess = true;

  showSuccessMessage = false;
  successMessage = '';

  processing = false;

  showScheduleSelector = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleService: ScheduleMasterService,
    private scheduleEmployeeService: ScheduleEmployeeService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private frontendPerm: FrontendPermissionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.scheduleId = +id;
        this.showScheduleSelector = false;
        this.loadSchedule();
        this.loadEmployees();
        this.loadMappedEmployees();
        this.loadPermissions();
      } else {
        this.showScheduleSelector = true;
        this.loadSchedules();
        this.loadEmployees();
        this.loadPermissions();
        this.errorMessage = '';
      }
    });
  }

  loadSchedules(): void {
    this.scheduleService.getAll().subscribe({
      next: (res) => {
        this.schedules = res?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Schedules load failed:', err)
    });
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) {
      // Admin: grant all permissions explicitly
      this.canAdd = true;
      this.canDelete = true;
      this.canProcess = true;
      this.cdr.detectChanges();
      return;
    }
    this.canAdd = this.frontendPerm.canAddByUrl('/transactions/schedule-employee');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/transactions/schedule-employee');
    this.canProcess = this.frontendPerm.canEditByUrl('/transactions/schedule-employee');
    this.cdr.detectChanges();
  }

  onScheduleChange(): void {
    if (this.scheduleId) {
      this.loadSchedule();
      this.loadMappedEmployees();
    } else {
      this.schedule = null;
      this.mappedEmployees = [];
      this.updateAvailableEmployees();
    }
  }

  loadSchedule(): void {
    if (!this.scheduleId) return;
    this.scheduleService.getById(this.scheduleId).subscribe({
      next: (res) => {
        this.schedule = res?.data ?? null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Schedule could not be loaded.';
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAllForDropdown().subscribe({
      next: (emps) => {
        this.allEmployees = emps || [];
        this.updateAvailableEmployees();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Employees could not be loaded:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadMappedEmployees(): void {
    if (!this.scheduleId) return;
    this.scheduleEmployeeService.getByScheduleId(this.scheduleId).subscribe({
      next: (res) => {
        this.mappedEmployees = res?.data ?? [];
        this.updateAvailableEmployees();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Mapped employees could not be loaded:', err);
        this.cdr.detectChanges();
      }
    });
  }

  updateAvailableEmployees(): void {
    const mappedIds = new Set(this.mappedEmployees.map(m => m.sE_EmployeeId));
    this.availableEmployees = this.allEmployees.filter(e => !mappedIds.has(e.employeeID));
    this.selectedEmployeeIds = [];
    this.selectAll = false;
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedEmployeeIds = this.availableEmployees.map(e => e.employeeID);
    } else {
      this.selectedEmployeeIds = [];
    }
  }

  toggleEmployee(empId: number): void {
    const idx = this.selectedEmployeeIds.indexOf(empId);
    if (idx > -1) {
      this.selectedEmployeeIds.splice(idx, 1);
    } else {
      this.selectedEmployeeIds.push(empId);
    }
    this.selectAll = this.selectedEmployeeIds.length === this.availableEmployees.length && this.availableEmployees.length > 0;
  }

  isEmployeeSelected(empId: number): boolean {
    return this.selectedEmployeeIds.includes(empId);
  }

  saveMapping(): void {
    if (!this.scheduleId || this.selectedEmployeeIds.length === 0) return;

    this.saving = true;
    this.errorMessage = '';
    this.showSuccessMessage = false;
    this.successMessage = '';

    const currentUser = JSON.parse(localStorage.getItem('userId') || '0');
    const updatedBy = currentUser || 0;

    const requests: ScheduleEmployeeRequest[] = this.selectedEmployeeIds.map(empId => ({
      SE_SM_Id: this.scheduleId!,
      SE_EmployeeId: empId,
      SE_Status: 'Pending',
      SE_Eligible: true,
      SE_ReviewRequired: this.schedule?.sM_ScheduleType?.toLowerCase() === 'review',
      SE_Remarks: '',
      SE_CreatedBy: updatedBy
    }));

    let completed = 0;
    let hasError = false;

    requests.forEach(req => {
      this.scheduleEmployeeService.add(req).subscribe({
        next: () => {
          completed++;
          if (completed === requests.length && !hasError) {
            this.saving = false;
            this.showSuccessMessage = true;
            this.successMessage = `${completed} employee(s) mapped successfully. You can now process the schedule.`;
            this.loadMappedEmployees();
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          if (!hasError) {
            hasError = true;
            this.saving = false;
            this.errorMessage = err?.error?.message || 'Mapping failed.';
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  removeMapping(mapping: ScheduleEmployeeResponse): void {
    if (!this.canDelete) return;
    if (!confirm(`Remove employee "${mapping.employeeName}" from this schedule?`)) return;

    const currentUser = JSON.parse(localStorage.getItem('userId') || '0');
    const updatedBy = currentUser || 0;

    this.scheduleEmployeeService.delete(mapping.sE_Id, updatedBy).subscribe({
      next: () => {
        alert('Employee removed successfully.');
        this.loadMappedEmployees();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        const msg = err?.error?.message || '';
        if (msg.includes('FK_') || msg.includes('REFERENCE constraint') || msg.includes('conflicted')) {
          alert('Cannot remove this employee. They have related transactions. Please delete those transactions first.');
        } else {
          alert(msg || 'Remove failed.');
        }
      }
    });
  }

  navigateToProcess(): void {
    if (this.scheduleId) {
      // TODO: Navigate to Process Schedule page when implemented
      // this.router.navigate(['/masters/schedule-process', this.scheduleId]);
      this.router.navigate(['/masters/schedule-master']);
    }
  }

  processSchedule(): void {
    if (!this.scheduleId || !this.canProcess) return;

    this.processing = true;
    this.errorMessage = '';
    this.showSuccessMessage = false;

    this.scheduleEmployeeService.getByScheduleId(this.scheduleId).subscribe({
      next: (res) => {
        const mapped: ScheduleEmployeeResponse[] = (res?.data ?? []).filter(
          (e: ScheduleEmployeeResponse) => e.sE_Eligible !== false
        );

        const employeeIds = mapped.map(e => e.sE_EmployeeId);
        const employeeIdCsv = employeeIds.join(',');

        if (!employeeIdCsv) {
          this.processing = false;
          this.errorMessage = 'No eligible employees are mapped to this schedule. Map employees first.';
          this.cdr.detectChanges();
          return;
        }

        // Use a simple modal/prompt for required fields since we don't have a full modal here
        const transactionDate = prompt('Transaction Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        if (!transactionDate) {
          this.processing = false;
          this.cdr.detectChanges();
          return;
        }

        const reviewType = prompt('Review Type (HR_TO_EMPLOYEE or EMPLOYEE_TO_HR):', 'HR_TO_EMPLOYEE');
        if (!reviewType) {
          this.processing = false;
          this.cdr.detectChanges();
          return;
        }

        const reviewerIdStr = prompt('Reviewer Employee ID:', String(this.authService.getEmployeeId() || ''));
        const reviewerId = reviewerIdStr ? parseInt(reviewerIdStr, 10) : 0;
        if (!reviewerId) {
          this.processing = false;
          this.errorMessage = 'Reviewer ID is required.';
          this.cdr.detectChanges();
          return;
        }

        let revieweeId: number | null = null;
        if (reviewType === 'EMPLOYEE_TO_HR') {
          const revieweeIdStr = prompt('Reviewee (HR) Employee ID:');
          revieweeId = revieweeIdStr ? parseInt(revieweeIdStr, 10) : null;
          if (!revieweeId) {
            this.processing = false;
            this.errorMessage = 'Reviewee ID is required for Employee to HR reviews.';
            this.cdr.detectChanges();
            return;
          }
          // Validate reviewee exists in mapped employees
          if (!employeeIds.includes(revieweeId)) {
            this.processing = false;
            this.errorMessage = 'Reviewee must be one of the mapped employees. Select a valid employee ID from the mapped list.';
            this.cdr.detectChanges();
            return;
          }
          // Validate reviewee belongs to same company as mapped employees
          const mappedEmployee = this.allEmployees.find(e => e.employeeID === employeeIds[0]);
          const revieweeEmployee = this.allEmployees.find(e => e.employeeID === revieweeId);
          if (mappedEmployee && revieweeEmployee && mappedEmployee.companyID !== revieweeEmployee.companyID) {
            this.processing = false;
            this.errorMessage = `Reviewee (ID: ${revieweeId}) belongs to a different company (ID: ${revieweeEmployee.companyID}). Mapped employees are in company ID: ${mappedEmployee.companyID}.`;
            this.cdr.detectChanges();
            return;
          }
        } else {
          // For HR_TO_EMPLOYEE, revieweeId MUST be null (backend auto-assigns each mapped employee)
          revieweeId = null;
        }

        // Check reviewer not in mapped employees (for HR_TO_EMPLOYEE)
        if (reviewType === 'HR_TO_EMPLOYEE' && employeeIds.includes(reviewerId)) {
          this.processing = false;
          this.errorMessage = 'The reviewer is also one of the mapped employees. Choose a different reviewer.';
          this.cdr.detectChanges();
          return;
        }

        const request: ScheduleProcessRequest = {
          employeeIdCsv,
          transactionType: this.getScheduleType() || 'Review',
          transactionDate,
          emailSubjectPrefix: `${this.getScheduleName()} Review`,
          reviewerId,
          revieweeId,
          reviewType
        };

        this.scheduleService.processSchedule(this.scheduleId!, request).subscribe({
          next: (res) => {
            this.processing = false;
            if (res?.success) {
              this.showSuccessMessage = true;
              this.successMessage = 'Schedule processed successfully. Review transactions generated.';
              this.loadMappedEmployees();
              this.cdr.detectChanges();
            } else {
              this.errorMessage = res?.message || 'Processing failed.';
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            this.processing = false;
            const msg = err?.error?.message || 'Schedule processing failed.';
            if (msg.includes('50014') || msg.includes('already mapped') || msg.includes('already processed')) {
              this.errorMessage = 'Some employees already have transactions for this schedule. Cannot process again.';
            } else if (msg.includes('50022') || msg.includes('Reviewee does not exist')) {
              this.errorMessage = 'Invalid reviewee. For HR→Employee: leave reviewee blank (auto). For Employee→HR: reviewee must be a mapped employee in same company.';
            } else {
              this.errorMessage = msg;
            }
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Unable to load mapped employees.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'eligible') return 'badge-eligible';
    if (s === 'pending') return 'badge-pending';
    if (s === 'noteligible') return 'badge-noteligible';
    return 'badge-default';
  }

  getStatusLabel(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'eligible') return 'Eligible';
    if (s === 'pending') return 'Pending';
    if (s === 'noteligible') return 'Not Eligible';
    return status || 'Pending';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  }

  getEmployeeDepartment(empId: number): string {
    const emp = this.allEmployees.find(e => e.employeeID === empId);
    return emp?.department ?? '-';
  }

  getEmployeeDesignation(empId: number): string {
    const emp = this.allEmployees.find(e => e.employeeID === empId);
    return emp?.designation ?? '-';
  }

  getScheduleName(): string {
    return this.schedule?.sM_ScheduleName ?? '-';
  }

  getScheduleType(): string {
    return this.schedule?.sM_ScheduleType ?? '-';
  }

  getStatus(): string {
    return this.schedule?.sM_Status ?? '';
  }

  isScheduleActive(): boolean {
    return (this.schedule?.sM_Status || '').toLowerCase() === 'active' || this.schedule?.sM_IsActive === true;
  }
}