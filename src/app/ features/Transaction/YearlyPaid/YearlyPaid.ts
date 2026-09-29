import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { YearlyPaidService } from '@core/services/yearly-paid.service';
import { ScheduleTransactionService } from '@core/services/schedule-transaction.service';
import { ScheduleMasterService, ScheduleMasterResponse } from '@core/services/schedule-master.service';
import { ScheduleEmployeeService, ScheduleEmployeeResponse } from '@core/services/schedule-employee.service';
import { EmployeeService } from '@core/services/employee.service';
import { FrontendPermissionService } from '@core/services/frontend-permission.service';
import { YearlyPaidResponse } from '@shared/models/yearly-paid/yearly-paid-response.model';
import { ScheduleTransactionResponse } from '@shared/models/schedule-transaction/schedule-transaction-response.model';
import { EmployeeResponse } from '@shared/models/employee/employee-response';
import { YearlyPaidApproveRequest, YearlyPaidMarkPaidRequest, YearlyPaidRequest } from '@shared/models/yearly-paid/yearly-paid-request.model';

interface YearlyPaidViewModel extends YearlyPaidResponse {
  scheduleName?: string;
  employeeName?: string;
  department?: string;
}

@Component({
  selector: 'app-yearly-paid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './YearlyPaid.html',
  styleUrls: ['./YearlyPaid.css']
})
export class YearlyPaidComponent implements OnInit {

  // ---------- Table data ----------
  records: YearlyPaidViewModel[] = [];
  filteredRecords: YearlyPaidViewModel[] = [];
  loading = false;
  processing = false;
  errorMessage = '';

  // ---------- Lookup data ----------
  scheduleTransactions: ScheduleTransactionResponse[] = [];
  scheduleEmployees: ScheduleEmployeeResponse[] = [];
  schedules: ScheduleMasterResponse[] = [];
  employees: EmployeeResponse[] = [];

  // ---------- Permissions ----------
  canAdd = true;
  canEdit = true;
  canDelete = true;

  // ---------- Modals ----------
  showViewModal = false;
  showAddModal = false;
  selectedRecord: YearlyPaidViewModel | null = null;
  yearlyPaidForm: YearlyPaidRequest = this.emptyForm();

  // ---------- Search + pagination ----------
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  readonly statusOptions = ['Pending', 'Approved', 'Processed', 'Paid', 'Cancelled'];

  constructor(
    private yearlyPaidService: YearlyPaidService,
    private transactionService: ScheduleTransactionService,
    private scheduleService: ScheduleMasterService,
    private scheduleEmployeeService: ScheduleEmployeeService,
    private employeeService: EmployeeService,
    private frontendPerm: FrontendPermissionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.loadAll();
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canAdd = this.frontendPerm.canAddByUrl('/transactions/yearly-paid');
    this.canEdit = this.frontendPerm.canEditByUrl('/transactions/yearly-paid');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/transactions/yearly-paid');
  }

  // Lookups + records ek saath load hote hain
  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      tx: this.transactionService.getAll().pipe(catchError(() => of(null))),
      se: this.scheduleEmployeeService.getAll().pipe(catchError(() => of(null))),
      sm: this.scheduleService.getAll().pipe(catchError(() => of(null))),
      emp: this.employeeService.getAllForDropdown().pipe(catchError(() => of([] as EmployeeResponse[]))),
      yp: this.yearlyPaidService.getAll().pipe(catchError((err) => {
        this.errorMessage = err?.error?.message || 'Yearly Paid records could not be loaded.';
        return of(null);
      }))
    }).subscribe(({ tx, se, sm, emp, yp }: any) => {
      this.scheduleTransactions = tx?.data ?? [];
      this.scheduleEmployees = se?.data ?? [];
      this.schedules = sm?.data ?? [];
      this.employees = emp || [];
      this.records = (yp?.data ?? []).map((r: YearlyPaidResponse) => this.enrichRecord(r));
      this.applyFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadYearlyPaid(): void {
    this.loading = true;
    this.errorMessage = '';
    this.yearlyPaidService.getAll().subscribe({
      next: (res: any) => {
        this.records = (res?.data ?? []).map((r: YearlyPaidResponse) => this.enrichRecord(r));
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Yearly Paid records could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  enrichRecord(r: YearlyPaidResponse): YearlyPaidViewModel {
    const st = this.scheduleTransactions.find(t => t.sT_Id === r.YP_ST_Id);
    const se = st ? this.scheduleEmployees.find(s => s.sE_Id === st.sT_SE_Id) : null;
    const schedule = se ? this.schedules.find(s => s.sM_Id === se.sE_SM_Id) : null;
    const emp = this.employees.find(e => e.employeeID === r.YP_EmployeeId);

    return {
      ...r,
      scheduleName: schedule?.sM_ScheduleName ?? '—',
      employeeName:
        r.EmployeeName ||
        emp?.employeeName ||
        `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() ||
        `Employee #${r.YP_EmployeeId}`,
      department: emp?.department || '—'
    };
  }

  // ---------- Search ----------
  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredRecords = !term
      ? [...this.records]
      : this.records.filter(r =>
        [r.employeeName, r.scheduleName, r.department, r.YP_Status, r.YP_Year?.toString(), r.YP_Amount?.toString()]
          .some(v => (v || '').toLowerCase().includes(term))
      );
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // ---------- Pagination ----------
  get totalItems(): number { return this.filteredRecords.length; }
  get totalPages(): number { return Math.ceil(this.totalItems / this.pageSize); }

  get paginatedRecords(): YearlyPaidViewModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(start, start + this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  // ---------- View modal ----------
  viewRecord(record: YearlyPaidViewModel): void {
    this.selectedRecord = record;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedRecord = null;
  }

  // ---------- Add modal ----------
  emptyForm(): YearlyPaidRequest {
    return {
      YP_ST_Id: 0,
      YP_EmployeeId: 0,
      YP_Year: new Date().getFullYear(),
      YP_EligibleDays: 0,
      YP_PaidDays: 0,
      YP_Amount: 0,
      YP_Status: 'Pending',
      YP_Remarks: ''
    };
  }

  openAddModal(): void {
    if (!this.canAdd) return;
    this.yearlyPaidForm = this.emptyForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.yearlyPaidForm = this.emptyForm();
  }

  saveYearlyPaid(): void {
    const f = this.yearlyPaidForm;
    if (!f.YP_ST_Id || !f.YP_EmployeeId || !f.YP_Year) {
      alert('All required fields must be filled.');
      return;
    }

    this.processing = true;
    this.yearlyPaidService.add(f).subscribe({
      next: () => {
        this.processing = false;
        alert('Yearly Paid record added successfully.');
        this.closeAddModal();
        this.loadYearlyPaid();
      },
      error: (err: any) => {
        this.processing = false;
        alert(err?.error?.message || 'Add failed.');
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- Row actions ----------
  approveRecord(record: YearlyPaidViewModel): void {
    if (!confirm(`Approve record #${record.YP_Id}?`)) return;

    const request: YearlyPaidApproveRequest = {
      YP_Id: record.YP_Id,
      YP_Remarks: 'Approved via Yearly Paid page'
    };

    this.processing = true;
    this.yearlyPaidService.approve(record.YP_Id, request).subscribe({
      next: () => {
        this.processing = false;
        alert('Record approved successfully.');
        if (this.selectedRecord?.YP_Id === record.YP_Id) this.closeViewModal();
        this.loadYearlyPaid();
      },
      error: (err: any) => {
        this.processing = false;
        alert(err?.error?.message || 'Approve failed.');
        this.cdr.detectChanges();
      }
    });
  }

  markPaidRecord(record: YearlyPaidViewModel): void {
    const payrollId = prompt('Enter Payroll ID:');
    if (!payrollId) return;

    const paidDate = prompt('Enter Paid Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!paidDate) return;

    if (!confirm(`Mark record #${record.YP_Id} as Paid?`)) return;

    const request: YearlyPaidMarkPaidRequest = {
      YP_Id: record.YP_Id,
      YP_PayrollId: parseInt(payrollId, 10),
      YP_PaidDate: paidDate
    };

    this.processing = true;
    this.yearlyPaidService.markPaid(record.YP_Id, request).subscribe({
      next: () => {
        this.processing = false;
        alert('Record marked as Paid successfully.');
        if (this.selectedRecord?.YP_Id === record.YP_Id) this.closeViewModal();
        this.loadYearlyPaid();
      },
      error: (err: any) => {
        this.processing = false;
        alert(err?.error?.message || 'Mark Paid failed.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteRecord(record: YearlyPaidViewModel): void {
    if (!this.canDelete) return;
    if (!confirm(`Permanently delete record #${record.YP_Id}? This cannot be undone.`)) return;

    this.processing = true;
    this.yearlyPaidService.delete(record.YP_Id!).subscribe({
      next: () => {
        this.processing = false;
        alert('Record deleted successfully.');
        if (this.selectedRecord?.YP_Id === record.YP_Id) this.closeViewModal();
        this.loadYearlyPaid();
      },
      error: (err: any) => {
        this.processing = false;
        const msg = err?.error?.message || '';
        if (msg.includes('FK_') || msg.includes('REFERENCE constraint') || msg.includes('conflicted')) {
          alert('Cannot delete this record. It has related data (payroll, transactions, etc.). Please remove those first.');
        } else {
          alert(msg || 'Delete failed.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  showApproveButton(r: YearlyPaidViewModel): boolean {
    return this.canEdit && r.YP_Status?.toLowerCase() === 'pending';
  }

  showMarkPaidButton(r: YearlyPaidViewModel): boolean {
    const s = r.YP_Status?.toLowerCase();
    return this.canEdit && (s === 'approved' || s === 'processed');
  }

  // ---------- Helpers ----------
  getStatusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'processed': return 'badge-inprogress';
      case 'paid': return 'badge-completed';
      case 'cancelled': return 'badge-draft';
      default: return 'badge-default';
    }
  }

  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
  }

  formatAmount(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  }
}
