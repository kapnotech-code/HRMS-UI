import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeShiftService } from '../../core/services/Employeeshift.service';
import { EmployeeShiftRequest, EmployeeShiftResponse } from '../../shared/models/employeeshift/Employee shift';
import { EmployeeService } from '../../core/services/employee.service';
import { EmployeeResponse } from '../../shared/models/employee/ employee-response';
import { ShiftService } from '../../core/services/shift.service';

@Component({
  selector: 'app-employee-shift-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './Employeeshiftlist.html',
  styleUrls: ['./Employeeshiftlist.css']
})
export class EmployeeShiftListComponent implements OnInit {

  shifts: EmployeeShiftResponse[] = [];
  employees: EmployeeResponse[] = [];
  shiftMasters: any[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  // filter
  filterEmployeeId: number | null = null;

  // form state
  showForm = false;
  isEditMode = false;
  saving = false;
  formModel: EmployeeShiftRequest = this.emptyForm();

  constructor(
    private employeeShiftService: EmployeeShiftService,
    private employeeService: EmployeeService,
    private shiftService: ShiftService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadShiftMasters();
    this.loadAll();
  }

  emptyForm(): EmployeeShiftRequest {
    return {
      employeeShiftID: null,
      employeeID: 0,
      shiftID: 0,
      effectiveFrom: this.today(),
      effectiveTo: null
    };
  }

  today(): string {
    return new Date().toISOString().substring(0, 10);
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Employees not loaded:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadShiftMasters(): void {
    this.shiftService.getAll().subscribe({
      next: (res: any) => {
        this.shiftMasters = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Shifts not loaded:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getEmployeeName(employeeID: number): string {
    const emp = this.employees.find(e => e.employeeID === employeeID);
    return emp ? `${emp.firstName} ${emp.lastName}` : `EMP-${employeeID}`;
  }

  getShiftName(shiftID: number): string {
    const shift = this.shiftMasters.find((s: any) => s.shiftID === shiftID);
    return shift ? shift.shiftName : `Shift-${shiftID}`;
  }

  loadAll(): void {
    this.loading = true;
    this.employeeShiftService.getAll().subscribe({
      next: (data) => {
        this.shifts = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load employee shifts. ' + this.extractError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyEmployeeFilter(): void {
    this.clearMessages();
    if (!this.filterEmployeeId) {
      this.loadAll();
      return;
    }
    this.loading = true;
    this.employeeShiftService.getByEmployee(this.filterEmployeeId).subscribe({
      next: (data) => {
        this.shifts = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to filter shifts. ' + this.extractError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearFilter(): void {
    this.filterEmployeeId = null;
    this.clearMessages();
    this.loadAll();
  }

  // Bound to the Refresh button — clears old banners before reloading
  refresh(): void {
    this.clearMessages();
    this.loadAll();
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.formModel = this.emptyForm();
    this.clearMessages();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  openEditForm(row: EmployeeShiftResponse): void {
    this.isEditMode = true;
    this.formModel = {
      employeeShiftID: Number(row.employeeShiftID),
      employeeID: Number(row.employeeID),
      shiftID: Number(row.shiftID),
      effectiveFrom: row.effectiveFrom?.substring(0, 10),
      effectiveTo: row.effectiveTo ? row.effectiveTo.substring(0, 10) : null
    };
    this.clearMessages();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.formModel = this.emptyForm();
    this.cdr.detectChanges();
  }

  cancelForm(): void {
    this.showForm = false;
    this.formModel = this.emptyForm();
    this.clearMessages();
    this.cdr.detectChanges();
  }

  saveForm(): void {
    this.clearMessages();

    if (!this.formModel.employeeID || !this.formModel.shiftID || !this.formModel.effectiveFrom) {
      this.errorMessage = 'Employee, Shift, and Effective From are required.';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.formModel.employeeShiftID) {
      this.employeeShiftService.update(this.formModel.employeeShiftID, this.formModel).subscribe({
        next: (res) => {
          this.saving = false;
          this.successMessage = res.message || 'Employee shift updated successfully.';
          this.showForm = false;
          this.resetForm();
          this.loadAll();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = 'Update failed. ' + this.extractError(err);
          // keep the modal open so the user actually sees the error and can retry
          this.cdr.detectChanges();
        }
      });
    } else {
      this.employeeShiftService.add(this.formModel).subscribe({
        next: (res) => {
          this.saving = false;
          this.successMessage = res.message || 'Employee shift added successfully.';
          this.showForm = false;
          this.resetForm();
          this.loadAll();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = 'Add failed. ' + this.extractError(err);
          // keep the modal open so the user actually sees the error and can retry
          this.cdr.detectChanges();
        }
      });
    }
  }

  // 'force' comes from the HTML (deleteRow(row, true)) — hard-delete flag
  deleteRow(row: EmployeeShiftResponse, force: boolean = true): void {
    if (!confirm(`Delete shift #${row.employeeShiftID}? This cannot be undone.`)) {
      return;
    }

    this.clearMessages();
    this.employeeShiftService.delete(row.employeeShiftID, force).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Employee shift deleted successfully.';
        this.loadAll();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Delete failed. ' + this.extractError(err);
        this.cdr.detectChanges();
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private extractError(err: any): string {
    if (err?.error?.title) return err.error.title;
    if (typeof err?.error === 'string') return err.error;
    if (err?.message) return err.message;
    return 'Please check the server connection.';
  }
}
