import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { LeaveRequest, LeaveResponse } from '../../../shared/models/Leave/leaverequest/leaverequest';
import { LeaveBalanceRequest, LeaveBalanceResponse } from '../../../shared/models/Leave balance.model.ts/Request/Leave balance.model';
import { LeaveTypeResponse } from '../../../shared/models/leavetype/leave-type-response/leave-type-response';
import { EmployeeResponse } from '../../../shared/models/employee/ employee-response';
import { LeaveRequestService } from '../../../core/services/leaverequest.service';
import { LeaveBalanceService } from '../../../core/services/leavebalance.service';
import { LeaveTypeService } from '../../../core/services/leavetype.service';
import { EmployeeService } from '../../../core/services/employee.service';

type TabKey = 'requests' | 'balances';
type ModalMode = 'add' | 'edit' | null;

@Component({
  selector: 'app-leave-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave transaction.component.html',
  styleUrls: ['./leave transaction.component.css']
})
export class LeaveTransactionComponent implements OnInit {
  activeTab: TabKey = 'requests';

  requests: LeaveResponse[] = [];
  balances: LeaveBalanceResponse[] = [];
  leaveTypes: LeaveTypeResponse[] = [];
  employees: EmployeeResponse[] = [];

  loading = false;
  errorMsg = '';

  // Used only as the default pre-selection in the Add form / as the
  // "acting as" approver id — NOT used to filter what's displayed anymore,
  // since this page manages leave for all employees (it has approve/reject
  // actions and an employee picker), not just one person's own leave.
  currentEmployeeId = 9;
  currentApproverId = 9;

  modalMode: ModalMode = null;
  modalTab: TabKey = 'requests';

  requestForm: LeaveRequest = this.emptyRequestForm();
  balanceForm: LeaveBalanceRequest = this.emptyBalanceForm();
  editingBalanceId: number | null = null;
  editingRequestId: number | null = null;

  confirmDeleteFor: { tab: TabKey; id: number } | null = null;

  constructor(
    private leaveRequestService: LeaveRequestService,
    private leaveBalanceService: LeaveBalanceService,
    private leaveTypeService: LeaveTypeService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (res: any) => {
        this.employees = res?.data ?? res ?? [];
        this.cdr.detectChanges();
        // Leave requests/balances are fetched per-employee (see loadAll),
        // so they can only start once we know which employees exist.
        this.loadAll();
      },
      error: (err: any) => {
        console.error('Employees load nahi hue:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getEmployeeName(employeeID: number): string {
    const emp = this.employees.find(e => e.employeeID === employeeID);
    return emp ? `${emp.firstName} ${emp.lastName}` : `EMP-${employeeID}`;
  }

  loadLeaveTypes(): void {
    this.leaveTypeService.getAll().subscribe({
      next: (res: any) => {
        this.leaveTypes = res?.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Leave types load nahi hue:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getLeaveTypeName(leaveTypeID: number): string {
    const lt = this.leaveTypes.find(l => l.leaveTypeID === leaveTypeID);
    return lt ? lt.leaveTypeName : `Type-${leaveTypeID}`;
  }

  loadAll(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    // ⚠️ FIX: previously this always called getByEmployee(this.currentEmployeeId)
    // (hardcoded to employee 1), so a request added for ANY other employee
    // via the Add form was saved successfully on the backend but never
    // appeared here — it looked like "nothing got added". This page manages
    // leave for every employee (it has an employee picker + approve/reject),
    // but LeaveRequestService/LeaveBalanceService only expose getByEmployee()
    // — there's no getAll() on the backend — so we fetch every employee's
    // records individually and merge them client-side.
    if (!this.employees.length) {
      this.requests = [];
      this.balances = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const requestCalls = this.employees.map(e => this.leaveRequestService.getByEmployee(e.employeeID));
    const balanceCalls = this.employees.map(e => this.leaveBalanceService.getByEmployee(e.employeeID));

    forkJoin({
      requests: forkJoin(requestCalls),
      balances: forkJoin(balanceCalls)
    }).subscribe({
      next: ({ requests, balances }) => {
        this.requests = requests.flatMap((r: any) => r?.data ?? r ?? []);
        this.balances = balances.flatMap((b: any) => b?.data ?? b ?? []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMsg = 'Could not load transactions. Please try again.';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  switchTab(tab: TabKey): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  remainingDays(b: LeaveBalanceResponse): number {
    return (b.allocatedDays ?? 0) - (b.usedDays ?? 0);
  }

  // Used by the "Apply for leave" form to show the requester how many days
  // they have left for the currently selected employee + leave type, so
  // they don't submit a request that will fail balance checks server-side.
  // Matches on the current calendar year, same as emptyBalanceForm()'s default.
  remainingForCurrentSelection(): number {
    const employeeId = this.requestForm.employeeID;
    const leaveTypeId = this.requestForm.leaveTypeID;
    if (!employeeId || !leaveTypeId) return 0;

    const year = new Date().getFullYear();
    const balance = this.balances.find(b =>
      b.employeeID === employeeId &&
      b.leaveTypeID === leaveTypeId &&
      b.year === year
    );

    if (!balance) return 0;
    return this.remainingDays(balance);
  }

  totalDays(r: LeaveResponse): number {
    if (!r.startDate || !r.endDate) return 0;
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
    return diff > 0 ? diff : 0;
  }

  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'badge badge--approved';
      case 'rejected': return 'badge badge--rejected';
      case 'cancelled': return 'badge badge--cancelled';
      default: return 'badge badge--pending';
    }
  }

  openAdd(tab: TabKey): void {
    this.modalTab = tab;
    this.modalMode = 'add';
    this.editingBalanceId = null;
    this.editingRequestId = null;
    if (tab === 'requests') {
      this.requestForm = this.emptyRequestForm();
    } else {
      this.balanceForm = this.emptyBalanceForm();
    }
    this.cdr.detectChanges();
  }

  openEditRequest(r: LeaveResponse, decision: 'Approved' | 'Rejected'): void {
    // Guard against acting on a request that isn't Pending anymore —
    // e.g. stale row data, or another approver actioned it in the
    // meantime. Without this the backend throws a SQL error
    // ("Sirf Pending requests par action liya ja sakta hai") which
    // surfaces to the user as a raw 500.
    if ((r.status || '').toLowerCase() !== 'pending') {
      alert('Ye request pehle se hi actioned ho chuki hai. List refresh ho rahi hai...');
      this.loadAll();
      return;
    }

    this.leaveRequestService
      .approveOrReject(r.leaveRequestID, decision, this.currentApproverId)
      .subscribe({
        next: () => {
          this.loadAll();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          // Could still happen in a genuine race condition (two approvers
          // acting at the same instant) — refresh so the user sees the
          // real current state instead of a stale row.
          this.errorMsg = `Could not ${decision.toLowerCase()} the request. It may have already been actioned.`;
          console.error(err);
          this.loadAll();
          this.cdr.detectChanges();
        }
      });
  }

  openEditRequestForm(r: LeaveResponse): void {
    this.modalTab = 'requests';
    this.modalMode = 'edit';
    this.editingRequestId = r.leaveRequestID;
    this.requestForm = {
      employeeID: r.employeeID,
      leaveTypeID: r.leaveTypeID,
      startDate: r.startDate?.substring(0, 10),
      endDate: r.endDate?.substring(0, 10),
      reason: r.reason ?? undefined
    };
    this.cdr.detectChanges();
  }

  deleteRequest(r: LeaveResponse): void {
    if (!confirm(`Delete leave request #${r.leaveRequestID}? This cannot be undone.`)) return;

    this.leaveRequestService.delete(r.leaveRequestID).subscribe({
      next: () => {
        this.loadAll();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMsg = 'Could not delete the leave request.';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  openEditBalance(b: LeaveBalanceResponse): void {
    this.modalTab = 'balances';
    this.modalMode = 'edit';
    this.editingBalanceId = b.leaveBalanceID;
    this.balanceForm = {
      leaveBalanceID: b.leaveBalanceID,
      employeeID: b.employeeID,
      leaveTypeID: b.leaveTypeID,
      year: b.year,
      allocatedDays: b.allocatedDays,
      usedDays: b.usedDays
    };
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.modalMode = null;
    this.cdr.detectChanges();
  }
  saveRequest(): void {
    if (this.modalMode === 'edit' && this.editingRequestId != null) {

      this.leaveRequestService.update(this.editingRequestId, this.requestForm).subscribe({
        next: () => {
          alert('Leave request updated successfully.');
          this.closeModal();
          this.loadAll();
        },
        error: (err: any) => {
          alert('Update failed.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });

    } else {

      this.leaveRequestService.add(this.requestForm).subscribe({
        next: () => {
          alert('Leave request added successfully.');
          this.closeModal();
          this.loadAll();
        },
        error: (err: any) => {
          alert('Add failed.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });

    }
  }
  saveBalance(): void {
    if (this.modalMode === 'edit' && this.editingBalanceId != null) {

      this.leaveBalanceService.update(this.editingBalanceId, this.balanceForm).subscribe({
        next: () => {
          alert('Leave balance updated successfully.');
          this.closeModal();
          this.loadAll();
        },
        error: (err: any) => {
          alert('Update failed.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });

    } else {

      this.leaveBalanceService.add(this.balanceForm).subscribe({
        next: () => {
          alert('Leave balance added successfully.');
          this.closeModal();
          this.loadAll();
        },
        error: (err: any) => {
          alert('Add failed.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });

    }
  }
  askDelete(tab: TabKey, id: number): void {
    this.confirmDeleteFor = { tab, id };
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.confirmDeleteFor = null;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.confirmDeleteFor) return;
    const { tab, id } = this.confirmDeleteFor;

    if (tab === 'requests') {
      this.leaveRequestService.cancel(id, this.currentEmployeeId).subscribe({
        next: () => {
          this.confirmDeleteFor = null;
          this.loadAll();
        },
        error: (err: any) => {
          this.errorMsg = 'Could not cancel the leave request.';
          this.confirmDeleteFor = null;
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.leaveBalanceService.delete(id, false).subscribe({
        next: () => {
          this.confirmDeleteFor = null;
          this.loadAll();
        },
        error: (err: any) => {
          this.errorMsg = 'Could not delete the leave balance.';
          this.confirmDeleteFor = null;
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private emptyRequestForm(): LeaveRequest {
    return {
      employeeID: this.currentEmployeeId,
      leaveTypeID: 1,
      startDate: '',
      endDate: '',
      reason: ''
    };
  }

  private emptyBalanceForm(): LeaveBalanceRequest {
    return {
      leaveBalanceID: 0,
      employeeID: this.currentEmployeeId,
      leaveTypeID: 1,
      year: new Date().getFullYear(),
      allocatedDays: 0,
      usedDays: 0
    };
  }
}
