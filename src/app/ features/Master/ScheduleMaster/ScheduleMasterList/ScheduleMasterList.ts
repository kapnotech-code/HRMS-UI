import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ScheduleMasterService, ScheduleProcessRequest, ScheduleMasterResponse } from '../../../../core/services/schedule-master.service';
import { ScheduleEmployeeService } from '../../../../core/services/schedule-employee.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/Auth.service';
import { FrontendPermissionService } from '../../../../core/services/frontend-permission.service';
import { ScheduleEmployeeResponse } from '../../../../shared/models/schedule-employee.model/schedule-employee-response.model';
import { EmployeeResponse } from '../../../../shared/models/employee/employee-response';

@Component({
  selector: 'app-schedule-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ScheduleMasterList.html',
  styleUrls: ['./ScheduleMasterList.css']
})
export class ScheduleMasterList implements OnInit {

  // ------------------------------------------------------------------
  // Data state
  // ------------------------------------------------------------------
  schedules: ScheduleMasterResponse[] = [];
  filteredSchedules: ScheduleMasterResponse[] = [];
  employees: EmployeeResponse[] = [];
  loading = false;
  errorMessage = '';
  saving = false;
  processing = false;

  // ------------------------------------------------------------------
  // Permission flags (admin bypasses automatically)
  // ------------------------------------------------------------------
  canAdd = true;
  canEdit = true;
  canDelete = true;

  // ------------------------------------------------------------------
  // CRUD form / modal state
  // ------------------------------------------------------------------
  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // ------------------------------------------------------------------
  // Process modal state (Review-type schedules only)
  // ------------------------------------------------------------------
  showProcessModal = false;
  processingSchedule: ScheduleMasterResponse | null = null;
  processingError = '';

  // ------------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------------
  filterName = '';

  // ------------------------------------------------------------------
  // Static option sets (no data values are hardcoded beyond these
  // option labels which mirror the backend enum contract)
  // ------------------------------------------------------------------
  readonly scheduleTypes: string[] = ['Review', 'Yearly Paid'];
  readonly reviewTypes = [
    { value: 'HR_TO_EMPLOYEE', label: 'HR to Employee' },
    { value: 'EMPLOYEE_TO_HR', label: 'Employee to HR' }
  ];

  // ------------------------------------------------------------------
  // Form model
  // ------------------------------------------------------------------
  formData: ScheduleMasterResponse = this.emptyForm();

  // ------------------------------------------------------------------
  // Process form model — ReviewerId / RevieweeId / ReviewType are
  // passed dynamically to the backend (never hardcoded).
  // ------------------------------------------------------------------
  processForm = {
    transactionDate: '',
    emailSubjectPrefix: '',
    reviewType: 'HR_TO_EMPLOYEE',
    reviewerId: 0,
    revieweeId: 0
  };

  constructor(
    private scheduleService: ScheduleMasterService,
    private scheduleEmployeeService: ScheduleEmployeeService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private frontendPerm: FrontendPermissionService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------
  ngOnInit(): void {
    this.loadSchedules();
    this.loadEmployees();
    this.loadPermissions();
  }

  // ------------------------------------------------------------------
  // Data loaders
  // ------------------------------------------------------------------
  loadSchedules(): void {
    this.loading = true;
    this.errorMessage = '';
    this.scheduleService.getAll().subscribe({
      next: (res) => {
        // FIX: the backend "Delete" is a soft delete (status becomes
        // "Cancelled" and SM_IsActive = 0) unless hardDelete=true is
        // sent. GetAll still returns those rows, so hide them here so
        // a cancelled schedule disappears from the list.
        this.schedules = (res?.data ?? []).filter(
          (s: ScheduleMasterResponse) =>
            (s.sM_Status || '').toLowerCase() !== 'cancelled'
        );
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Schedules could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAllForDropdown().subscribe({
      next: (emps) => {
        this.employees = emps || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Employees could not be loaded:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) {
      return;
    }
    this.canAdd = this.frontendPerm.canAddByUrl('/masters/schedule-master');
    this.canEdit = this.frontendPerm.canEditByUrl('/masters/schedule-master');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/masters/schedule-master');
    this.cdr.detectChanges();
  }

  // ------------------------------------------------------------------
  // Filtering
  // ------------------------------------------------------------------
  applyFilter(): void {
    const term = this.filterName.toLowerCase();
    this.filteredSchedules = this.schedules.filter(s => {
      if (!term) return true;
      const name = this.getScheduleName(s).toLowerCase();
      const type = this.getScheduleType(s).toLowerCase();
      const status = this.getStatus(s).toLowerCase();
      return name.includes(term) || type.includes(term) || status.includes(term);
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterName = '';
    this.filteredSchedules = [...this.schedules];
    this.cdr.detectChanges();
  }

  // ------------------------------------------------------------------
  // CRUD form helpers
  // ------------------------------------------------------------------
  emptyForm(): ScheduleMasterResponse {
    return {
      sM_Id: undefined as any,
      sM_ScheduleName: '',
      sM_ScheduleType: 'Review',
      sM_Year: new Date().getFullYear(),
      sM_StartDate: '',
      sM_EndDate: '',
      sM_ReviewDate: '',
      sM_IsActive: true,
      sM_Status: 'Draft',
      sM_Description: '',
      sM_CreatedBy: 0,
      sM_CreatedAt: '',
      sM_PaidDays: 0
    };
  }

  onYearChange(event: any): void {
    this.formData.sM_Year = event ? +event : new Date().getFullYear();
  }

  openAddForm(): void {
    if (!this.canAdd) return;
    this.isEditMode = false;
    this.currentId = null;
    this.errorMessage = '';
    this.formData = this.emptyForm();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  editSchedule(item: ScheduleMasterResponse): void {
    if (!this.canEdit) return;
    this.isEditMode = true;
    this.currentId = item.sM_Id ?? null;
    this.errorMessage = '';
    this.formData = {
      sM_Id: item.sM_Id,
      sM_ScheduleName: item.sM_ScheduleName ?? '',
      sM_ScheduleType: item.sM_ScheduleType ?? 'Review',
      sM_Year: item.sM_Year ?? new Date().getFullYear(),
      sM_StartDate: this.toDateInput(item.sM_StartDate),
      sM_EndDate: this.toDateInput(item.sM_EndDate),
      sM_ReviewDate: this.toDateInput(item.sM_ReviewDate),
      sM_IsActive: item.sM_IsActive ?? true,
      sM_Status: item.sM_Status ?? 'Draft',
      sM_Description: item.sM_Description ?? '',
      sM_CreatedBy: item.sM_CreatedBy ?? 0,
      sM_CreatedAt: item.sM_CreatedAt ?? '',
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveSchedule(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    const currentUser = this.authService.getCurrentUser() ?? {};

    const payload: any = {
      sM_ScheduleName: this.formData.sM_ScheduleName?.trim(),
      sM_ScheduleType: this.formData.sM_ScheduleType,
      sM_Year: this.formData.sM_Year,
      sM_StartDate: this.formData.sM_StartDate,
      sM_EndDate: this.formData.sM_EndDate,
      sM_ReviewDate: this.formData.sM_ReviewDate,
      sM_IsActive: this.formData.sM_IsActive,
      sM_Status: this.formData.sM_Status,
      sM_Description: this.formData.sM_Description?.trim(),
      sM_UpdatedBy: currentUser?.userId ?? null
    };

    if (this.isEditMode && this.currentId) {
      payload.sM_Id = this.currentId;
      this.scheduleService.update(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Schedule updated successfully.');
          this.showForm = false;
          this.loadSchedules();
        },
        error: (err) => {
          this.saving = false;
          this.handleError(err, 'update');
        }
      });
    } else {
      payload.sM_CreatedBy = currentUser?.userId ?? null;
      this.scheduleService.add(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Schedule added successfully.');
          this.showForm = false;
          this.loadSchedules();
        },
        error: (err) => {
          this.saving = false;
          this.handleError(err, 'add');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.sM_ScheduleName?.trim()) {
      alert('Schedule Name is required.');
      return false;
    }
    if (!this.formData.sM_ScheduleType) {
      alert('Schedule Type is required.');
      return false;
    }
    if (!this.formData.sM_Year) {
      alert('Year is required.');
      return false;
    }
    if (!this.formData.sM_StartDate) {
      alert('Start Date is required.');
      return false;
    }
    if (!this.formData.sM_EndDate) {
      alert('End Date is required.');
      return false;
    }
    return true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  // FIX: the backend treats this as a soft delete (cancel) by default,
  // so the wording now says "Cancel" and the list hides cancelled rows.
  deleteSchedule(item: ScheduleMasterResponse): void {
    if (!this.canDelete) return;
    const name = this.getScheduleName(item);
    if (!confirm(`Permanently delete schedule "${name}"? This cannot be undone.`)) return;

    const currentUser = this.authService.getCurrentUser() ?? {};
    this.scheduleService.delete(item.sM_Id!, currentUser?.userId ?? 0, true).subscribe({
      next: () => {
        alert('Schedule deleted successfully.');
        this.loadSchedules();
      },
      error: (err) => {
        const msg = err?.error?.message || '';
        if (msg.includes('FK_ScheduleEmployee_ScheduleMaster') || msg.includes('REFERENCE constraint')) {
          alert('Cannot delete this schedule. It has mapped employees. Please remove all employee mappings first, then try again.');
        } else {
          this.handleError(err, 'delete');
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // Process Schedule flow (Review-type only)
  // ------------------------------------------------------------------

  // FIX: USP_ProcessSchedule only accepts schedules that are Draft AND
  // active (SM_IsActive = 1). It then sets the status to Active itself.
  // Showing the button for Active rows only produced errors 50007/50008.
  canProcess(item: ScheduleMasterResponse): boolean {
    const isDraft = (item.sM_Status || '').toLowerCase() === 'draft';
    const isReview = this.getScheduleType(item).toLowerCase() === 'review';
    return isDraft && item.sM_IsActive === true && isReview;
  }

  openProcessModal(item: ScheduleMasterResponse): void {
    this.processingSchedule = item;
    this.processingError = '';

    // FIX: the proc requires the transaction date to be inside the
    // schedule window. Default to today only if it is, else the start.
    const start = this.toDateInput(item.sM_StartDate);
    const end = this.toDateInput(item.sM_EndDate);
    const today = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
    const defaultDate = today >= start && today <= end ? today : start;

    // FIX: the reviewer must be an EMPLOYEE id, never the login userId.
    const reviewerDefault = Number(this.authService.getEmployeeId()) || 0;

    this.processForm = {
      transactionDate: defaultDate,
      emailSubjectPrefix: `${this.getScheduleName(item)} Review`,
      reviewType: 'HR_TO_EMPLOYEE',
      reviewerId: reviewerDefault,
      revieweeId: 0
    };
    this.showProcessModal = true;
    this.cdr.detectChanges();
  }

  closeProcessModal(): void {
    this.showProcessModal = false;
    this.processingSchedule = null;
    this.processingError = '';
    this.cdr.detectChanges();
  }

  processScheduleNow(): void {
    if (!this.processingSchedule) return;
    if (!this.processForm.reviewType) {
      alert('Review Type is required.');
      return;
    }
    if (!this.processForm.reviewerId) {
      alert('Reviewer is required.');
      return;
    }
    if (
      this.processForm.reviewType === 'EMPLOYEE_TO_HR' &&
      !this.processForm.revieweeId
    ) {
      alert('Reviewee (HR) is required for Employee to HR reviews.');
      return;
    }

    // Client-side check of the schedule window (mirrors proc error 50011)
    const start = this.toDateInput(this.processingSchedule.sM_StartDate);
    const end = this.toDateInput(this.processingSchedule.sM_EndDate);
    const txDate = this.processForm.transactionDate;
    if (!txDate || txDate < start || txDate > end) {
      this.processingError =
        `Transaction date must be between ${start} and ${end}.`;
      this.cdr.detectChanges();
      return;
    }

    this.processing = true;
    this.processingError = '';

    const scheduleId = this.processingSchedule?.sM_Id;
    if (!scheduleId) {
      this.processing = false;
      this.processingError = 'Schedule id is missing.';
      this.cdr.detectChanges();
      return;
    }

    this.scheduleEmployeeService.getByScheduleId(scheduleId).subscribe({
      next: (res) => {
        const mapped: ScheduleEmployeeResponse[] = (res?.data ?? []).filter(
          (e: ScheduleEmployeeResponse) => e.sE_Eligible !== false
        );

        const employeeIds = mapped.map(e => e.sE_EmployeeId);
        const employeeIdCsv = employeeIds.join(',');

        if (!employeeIdCsv) {
          this.processing = false;
          this.processingError =
            'No eligible employees are mapped to this schedule. Map employees first.';
          this.cdr.detectChanges();
          return;
        }

        // A reviewer must not review themselves (HR -> Employee).
        if (
          this.processForm.reviewType === 'HR_TO_EMPLOYEE' &&
          employeeIds.includes(Number(this.processForm.reviewerId))
        ) {
          this.processing = false;
          this.processingError =
            'The reviewer is also one of the mapped employees. Choose a different reviewer.';
          this.cdr.detectChanges();
          return;
        }

        const request: ScheduleProcessRequest = {
          employeeIdCsv,
          transactionType: this.getScheduleType(this.processingSchedule!) || 'Review',
          transactionDate: this.processForm.transactionDate,
          emailSubjectPrefix: this.processForm.emailSubjectPrefix,
          reviewerId: this.processForm.reviewerId,
          revieweeId: this.processForm.revieweeId || null,
          reviewType: this.processForm.reviewType
        };

        this.scheduleService.processSchedule(scheduleId, request).subscribe({
          next: () => {
            this.processing = false;
            alert('Schedule processed successfully. Review transactions generated.');
            this.showProcessModal = false;
            this.loadSchedules();
            this.router.navigate(['/transactions/review/pending']);
          },
          error: (err) => {
            this.processing = false;
            const msg = err?.error?.message || 'Schedule processing failed.';
            if (msg.includes('50014') || msg.includes('already mapped') || msg.includes('already processed')) {
              this.processingError = 'Some employees already have transactions for this schedule. Cannot process again. Delete existing transactions first.';
            } else {
              this.processingError = msg;
            }
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.processing = false;
        this.processingError =
          err?.error?.message || 'Unable to load mapped employees.';
        this.cdr.detectChanges();
      }
    });
  }

  // ------------------------------------------------------------------
  // Display helpers
  // ------------------------------------------------------------------
  getScheduleName(item: ScheduleMasterResponse): string {
    return item.sM_ScheduleName ?? '-';
  }

  getScheduleType(item: ScheduleMasterResponse): string {
    return item.sM_ScheduleType ?? '-';
  }

  getStatus(item: ScheduleMasterResponse): string {
    return item.sM_Status ?? '';
  }

  isScheduleActive(item: ScheduleMasterResponse): boolean {
    return (item.sM_Status || '').toLowerCase() === 'active' || item.sM_IsActive === true;
  }

  mapEmployees(item: ScheduleMasterResponse): void {
    if (!item.sM_Id) return;
    this.router.navigate(['/transactions/schedule-employee', item.sM_Id]);
  }

  getEmployeeName(id: number | undefined | null): string {
    if (!id) return '-';
    const emp = this.employees.find(e => e.employeeID === id);
    if (emp) {
      return emp.employeeName
        || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
        || `Employee #${emp.employeeID}`;
    }
    return `Employee #${id}`;
  }

  // ------------------------------------------------------------------
  // Formatters
  // ------------------------------------------------------------------
  toDateInput(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return this.toDateInput(dateStr);
  }

  private handleError(err: any, action: string): void {
    const msg =
      err?.error?.message ||
      err?.error?.errors?.[Object.keys(err?.error?.errors ?? {})[0]]?.[0] ||
      `${action} failed.`;
    alert(msg);
    console.error(err);
    this.errorMessage = msg;
    this.cdr.detectChanges();
  }
}
