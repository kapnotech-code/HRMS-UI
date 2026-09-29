import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ScheduleEmailService } from '@core/services/schedule-email.service';
import { ScheduleTransactionService } from '@core/services/schedule-transaction.service';
import { ScheduleMasterService, ScheduleMasterResponse } from '@core/services/schedule-master.service';
import { ScheduleEmployeeService, ScheduleEmployeeResponse } from '@core/services/schedule-employee.service';
import { EmployeeService } from '@core/services/employee.service';
import { FrontendPermissionService } from '@core/services/frontend-permission.service';
import { ScheduleEmailResponse } from '@shared/models/schedule-email/schedule-email-response.model';
import { ScheduleTransactionResponse } from '@shared/models/schedule-transaction/schedule-transaction-response.model';
import { EmployeeResponse } from '@shared/models/employee/employee-response';
import { ScheduleEmailRequest } from '@shared/models/schedule-email/schedule-email-request.model';

interface EmailViewModel extends ScheduleEmailResponse {
  scheduleName?: string;
  employeeName?: string;
}

@Component({
  selector: 'app-schedule-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ScheduleEmail.html',
  styleUrls: ['./ScheduleEmail.css']
})
export class ScheduleEmailComponent implements OnInit {

  // ---------- Table data ----------
  emails: EmailViewModel[] = [];
  filteredEmails: EmailViewModel[] = [];
  loading = false;
  saving = false;
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
  selectedEmail: EmailViewModel | null = null;
  emailForm: ScheduleEmailRequest = this.emptyEmailForm();

  // ---------- Search + pagination ----------
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  readonly emailTypes = ['ReviewNotification', 'Reminder', 'ApprovalNotification', 'RejectionNotification', 'CompletionNotification'];

  constructor(
    private emailService: ScheduleEmailService,
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
    this.canAdd = this.frontendPerm.canAddByUrl('/transactions/schedule-email');
    this.canEdit = this.frontendPerm.canEditByUrl('/transactions/schedule-email');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/transactions/schedule-email');
  }

  // Load lookups + emails together, then enrich
  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      tx: this.transactionService.getAll().pipe(catchError(() => of(null))),
      se: this.scheduleEmployeeService.getAll().pipe(catchError(() => of(null))),
      sm: this.scheduleService.getAll().pipe(catchError(() => of(null))),
      emp: this.employeeService.getAllForDropdown().pipe(catchError(() => of([] as EmployeeResponse[]))),
      mail: this.emailService.getAll().pipe(catchError((err) => { this.errorMessage = err?.error?.message || 'Emails could not be loaded.'; return of(null); }))
    }).subscribe(({ tx, se, sm, emp, mail }: any) => {
      this.scheduleTransactions = tx?.data ?? [];
      this.scheduleEmployees = se?.data ?? [];
      this.schedules = sm?.data ?? [];
      this.employees = emp || [];
      this.emails = (mail?.data ?? []).map((e: ScheduleEmailResponse) => this.enrichEmail(e));
      this.applyFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadEmails(): void {
    this.loading = true;
    this.errorMessage = '';
    this.emailService.getAll().subscribe({
      next: (res: any) => {
        this.emails = (res?.data ?? []).map((e: ScheduleEmailResponse) => this.enrichEmail(e));
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Emails could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  enrichEmail(e: ScheduleEmailResponse): EmailViewModel {
    const st = this.scheduleTransactions.find(t => t.sT_Id === e.sE_ST_Id);
    const se = st ? this.scheduleEmployees.find(s => s.sE_Id === st.sT_SE_Id) : null;
    const schedule = se ? this.schedules.find(s => s.sM_Id === se.sE_SM_Id) : null;
    const emp = this.employees.find(x => x.employeeID === st?.sE_EmployeeId);

    return {
      ...e,
      scheduleName: schedule?.sM_ScheduleName ?? '—',
      employeeName:
        st?.employeeName ||
        emp?.employeeName ||
        `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() ||
        (st?.sE_EmployeeId ? `Employee #${st.sE_EmployeeId}` : '—')
    };
  }

  // ---------- Search ----------
  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredEmails = !term
      ? [...this.emails]
      : this.emails.filter(e =>
        [e.sE_Subject, e.sE_ToEmail, e.employeeName, e.scheduleName, e.sE_EmailType, e.sE_Status]
          .some(v => (v || '').toLowerCase().includes(term))
      );
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // ---------- Pagination ----------
  get totalItems(): number { return this.filteredEmails.length; }
  get totalPages(): number { return Math.ceil(this.totalItems / this.pageSize); }

  get paginatedEmails(): EmailViewModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmails.slice(start, start + this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  // ---------- View modal ----------
  viewEmail(email: EmailViewModel): void {
    this.selectedEmail = email;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedEmail = null;
  }

  // ---------- Add modal ----------
  emptyEmailForm(): ScheduleEmailRequest {
    return {
      sE_ST_Id: 0,
      sE_ToEmail: '',
      sE_CCEmail: '',
      sE_Subject: '',
      sE_Body: '',
      sE_EmailType: 'ReviewNotification'
    };
  }

  openAddModal(): void {
    if (!this.canAdd) return;
    this.emailForm = this.emptyEmailForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.emailForm = this.emptyEmailForm();
  }

  saveEmail(): void {
    const f = this.emailForm;
    if (!f.sE_ST_Id || !f.sE_ToEmail || !f.sE_Subject || !f.sE_Body) {
      alert('All required fields must be filled.');
      return;
    }

    this.saving = true;
    this.emailService.add(f).subscribe({
      next: () => {
        this.saving = false;
        alert('Email added successfully.');
        this.closeAddModal();
        this.loadEmails();
      },
      error: (err: any) => {
        this.saving = false;
        alert(err?.error?.message || 'Add failed.');
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- Row actions ----------
  deleteEmail(email: EmailViewModel): void {
    if (!this.canDelete) return;
    if (!confirm(`Permanently delete email #${email.sE_EmailId}? This cannot be undone.`)) return;

    const updatedBy = JSON.parse(localStorage.getItem('userId') || '0') || 0;

    this.saving = true;
    this.emailService.delete(email.sE_EmailId, updatedBy).subscribe({
      next: () => {
        this.saving = false;
        alert('Email deleted successfully.');
        if (this.selectedEmail?.sE_EmailId === email.sE_EmailId) this.closeViewModal();
        this.loadEmails();
      },
      error: (err: any) => {
        this.saving = false;
        const msg = err?.error?.message || '';
        if (msg.includes('FK_') || msg.includes('REFERENCE constraint') || msg.includes('conflicted')) {
          alert('Cannot delete this email. It has related data. Please remove those first.');
        } else {
          alert(msg || 'Delete failed.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  resendEmail(email: EmailViewModel): void {
    if (!confirm(`Resend email #${email.sE_EmailId}?`)) return;

    this.saving = true;
    this.emailService.resend(email.sE_EmailId).subscribe({
      next: () => {
        this.saving = false;
        alert('Email queued for resend successfully.');
        this.loadEmails();
      },
      error: (err: any) => {
        this.saving = false;
        alert(err?.error?.message || 'Resend failed.');
        this.cdr.detectChanges();
      }
    });
  }

  showResendButton(email: EmailViewModel): boolean {
    return this.canEdit && email.sE_Status?.toLowerCase() === 'failed';
  }

  // ---------- Helpers ----------
  getStatusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'sent': return 'badge-completed';
      case 'failed': return 'badge-expired';
      case 'cancelled': return 'badge-draft';
      default: return 'badge-default';
    }
  }

  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB');
  }

  formatDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-GB');
  }
}
