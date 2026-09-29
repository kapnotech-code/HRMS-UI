import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ScheduleTransactionService } from '@core/services/schedule-transaction.service';
import { ScheduleMasterService, ScheduleMasterResponse } from '@core/services/schedule-master.service';
import { ScheduleEmployeeService, ScheduleEmployeeResponse } from '@core/services/schedule-employee.service';
import { EmployeeService } from '@core/services/employee.service';
import { FrontendPermissionService } from '@core/services/frontend-permission.service';
import { ScheduleTransactionResponse } from '@shared/models/schedule-transaction/schedule-transaction-response.model';
import { EmployeeResponse } from '@shared/models/employee/employee-response';

interface TransactionViewModel extends ScheduleTransactionResponse {
  scheduleName?: string;
  department?: string;
  reviewType?: string;
  reviewer?: string;
  reviewee?: string;
  dueDate?: string;
}

@Component({
  selector: 'app-schedule-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ScheduleTransaction.html',
  styleUrls: ['./ScheduleTransaction.css']
})
export class ScheduleTransactionComponent implements OnInit {

  transactions: TransactionViewModel[] = [];
  filteredTransactions: TransactionViewModel[] = [];
  loading = false;
  errorMessage = '';
  saving = false;
  updating = false;

  schedules: ScheduleMasterResponse[] = [];
  scheduleEmployees: ScheduleEmployeeResponse[] = [];
  employees: EmployeeResponse[] = [];

  canAdd = true;
  canEdit = true;
  canDelete = true;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  filterScheduleId: number | null = null;
  filterStatus = '';
  filterTransactionType = '';

  formData: TransactionViewModel = this.emptyForm();

  readonly transactionTypes = ['Review', 'Payment', 'Correction'];
  readonly statusOptions = ['Pending', 'In Progress', 'Completed', 'Approved', 'Rejected', 'Correction', 'Resubmitted', 'Processed'];

  constructor(
    private transactionService: ScheduleTransactionService,
    private scheduleService: ScheduleMasterService,
    private scheduleEmployeeService: ScheduleEmployeeService,
    private employeeService: EmployeeService,
    private frontendPerm: FrontendPermissionService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSchedules();
    this.loadScheduleEmployees();
    this.loadEmployees().then(() => {
      this.loadTransactions();
    });
    this.loadPermissions();
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canAdd = this.frontendPerm.canAddByUrl('/transactions/schedule-transaction');
    this.canEdit = this.frontendPerm.canEditByUrl('/transactions/schedule-transaction');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/transactions/schedule-transaction');
    this.cdr.detectChanges();
  }

  loadTransactions(): void {
    this.loading = true;
    this.errorMessage = '';
    this.transactionService.getAll().subscribe({
      next: (res: any) => {
        const raw = res?.data ?? [];
        this.transactions = raw.map((t: ScheduleTransactionResponse) => this.enrichTransaction(t));
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Transactions could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSchedules(): void {
    this.scheduleService.getAll().subscribe({
      next: (res: any) => {
        this.schedules = res?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Schedules load failed:', err)
    });
  }

  loadScheduleEmployees(): void {
    this.scheduleEmployeeService.getAll().subscribe({
      next: (res: any) => {
        this.scheduleEmployees = res?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Schedule employees load failed:', err)
    });
  }

  loadEmployees(): Promise<void> {
    return new Promise((resolve) => {
      this.employeeService.getAllForDropdown().subscribe({
        next: (emps: EmployeeResponse[]) => {
          this.employees = emps || [];
          this.cdr.detectChanges();
          resolve();
        },
        error: (err: any) => {
          console.error('Employees load failed:', err);
          resolve();
        }
      });
    });
  }

  enrichTransaction(t: ScheduleTransactionResponse): TransactionViewModel {
    const se = this.scheduleEmployees.find(s => s.sE_Id === t.sT_SE_Id);
    const schedule = se ? this.schedules.find(s => s.sM_Id === se.sE_SM_Id) : null;
    const emp = this.employees.find(e => e.employeeID === t.sE_EmployeeId);
    const reviewer = t.sT_ActionBy ? this.employees.find(e => e.employeeID === t.sT_ActionBy) : null;

    return {
      ...t,
      scheduleName: schedule?.sM_ScheduleName ?? '—',
      department: emp?.department ?? '—',
      reviewType: schedule?.sM_ScheduleType ?? '—',
      reviewer: reviewer ? (reviewer.employeeName || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || `Employee #${reviewer.employeeID}`) : '—',
      reviewee: t.employeeName || emp?.employeeName || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || `Employee #${emp?.employeeID}` || '—',
      dueDate: '—'
    };
  }

  applyFilter(): void {
    this.filteredTransactions = this.transactions.filter((t: TransactionViewModel) => {
      if (this.filterScheduleId && t.sT_SE_Id) {
        const se = this.scheduleEmployees.find(s => s.sE_Id === t.sT_SE_Id);
        if (se && se.sE_SM_Id !== this.filterScheduleId) return false;
      }
      if (this.filterStatus && t.sT_Status?.toLowerCase() !== this.filterStatus.toLowerCase()) return false;
      if (this.filterTransactionType && t.sT_TransactionType?.toLowerCase() !== this.filterTransactionType.toLowerCase()) return false;
      return true;
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterScheduleId = null;
    this.filterStatus = '';
    this.filterTransactionType = '';
    this.filteredTransactions = [...this.transactions];
    this.cdr.detectChanges();
  }

  emptyForm(): TransactionViewModel {
    return {
      sT_Id: undefined as any,
      sT_SE_Id: 0,
      sE_EmployeeId: 0,
      employeeName: '',
      sT_TransactionType: 'Review',
      sT_TransactionDate: '',
      sT_Status: 'Pending',
      sT_Remarks: '',
      sT_CreatedAt: ''
    } as TransactionViewModel;
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

  editTransaction(item: TransactionViewModel): void {
    if (!this.canEdit) return;
    this.isEditMode = true;
    this.currentId = item.sT_Id ?? null;
    this.errorMessage = '';
    this.formData = {
      sT_Id: item.sT_Id,
      sT_SE_Id: item.sT_SE_Id,
      sE_EmployeeId: item.sE_EmployeeId,
      employeeName: item.employeeName,
      sT_TransactionType: item.sT_TransactionType,
      sT_TransactionDate: this.toDateInput(item.sT_TransactionDate),
      sT_Status: item.sT_Status,
      sT_Remarks: item.sT_Remarks,
      sT_CreatedAt: item.sT_CreatedAt
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveTransaction(): void {
    if (!this.validateForm()) return;

    this.saving = true;
    const currentUser = JSON.parse(localStorage.getItem('userId') || '0');
    const updatedBy = currentUser || 0;

    const payload: any = {
      sT_SE_Id: this.formData.sT_SE_Id,
      sT_TransactionType: this.formData.sT_TransactionType,
      sT_TransactionDate: this.formData.sT_TransactionDate,
      sT_Status: this.formData.sT_Status,
      sT_Remarks: this.formData.sT_Remarks?.trim(),
      sT_UpdatedBy: updatedBy
    };

    if (this.isEditMode && this.currentId) {
      payload.sT_Id = this.currentId;
      this.transactionService.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Transaction updated successfully.');
          this.showForm = false;
          this.loadTransactions();
        },
        error: (err: any) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Update failed.';
          this.cdr.detectChanges();
        }
      });
    } else {
      payload.sT_CreatedBy = updatedBy;
      this.transactionService.add(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Transaction added successfully.');
          this.showForm = false;
          this.loadTransactions();
        },
        error: (err: any) => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'Add failed.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.sT_SE_Id) {
      alert('Schedule Employee is required.');
      return false;
    }
    if (!this.formData.sT_TransactionType) {
      alert('Transaction Type is required.');
      return false;
    }
    if (!this.formData.sT_TransactionDate) {
      alert('Transaction Date is required.');
      return false;
    }
    return true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  deleteTransaction(item: TransactionViewModel): void {
    if (!this.canDelete) return;
    if (!confirm(`Delete transaction #${item.sT_Id}?`)) return;

    const currentUser = JSON.parse(localStorage.getItem('userId') || '0');
    const updatedBy = currentUser || 0;

    this.transactionService.delete(item.sT_Id!, updatedBy).subscribe({
      next: () => {
        alert('Transaction deleted successfully.');
        this.loadTransactions();
      },
      error: (err: any) => {
        console.error(err);
        alert(err?.error?.message || 'Delete failed.');
      }
    });
  }

  updateStatus(item: TransactionViewModel, newStatus: string): void {
    const currentUser = JSON.parse(localStorage.getItem('userId') || '0');
    const actionBy = currentUser || 0;

    this.transactionService.updateStatus({
      sT_Id: item.sT_Id!,
      sT_Status: newStatus,
      sT_ActionBy: actionBy,
      sT_Remarks: `Status updated to ${newStatus}`
    } as any).subscribe({
      next: () => {
        alert('Status updated successfully.');
        this.loadTransactions();
      },
      error: (err: any) => {
        console.error(err);
        alert(err?.error?.message || 'Status update failed.');
      }
    });
  }

  viewReviewDetails(item: TransactionViewModel): void {
    if (item.sT_Id) {
      this.router.navigate(['/transactions/review/details', item.sT_Id]);
    }
  }

  getScheduleName(seId: number): string {
    const se = this.scheduleEmployees.find(s => s.sE_Id === seId);
    if (!se) return '—';
    const schedule = this.schedules.find(s => s.sM_Id === se.sE_SM_Id);
    return schedule?.sM_ScheduleName ?? '—';
  }

  getEmployeeName(empId: number): string {
    const emp = this.employees.find(e => e.employeeID === empId);
    if (!emp) return `Employee #${empId}`;
    return emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee #${empId}`;
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'draft') return 'badge-draft';
    if (s === 'pending') return 'badge-pending';
    if (s === 'in progress') return 'badge-inprogress';
    if (s === 'completed') return 'badge-completed';
    if (s === 'expired') return 'badge-expired';
    return 'badge-default';
  }

  toDateInput(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return this.toDateInput(dateStr);
  }
}
