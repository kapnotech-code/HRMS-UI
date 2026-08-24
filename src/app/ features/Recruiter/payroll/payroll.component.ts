import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PayrollService } from '../../../core/services/payroll.service';
import {
  PayrollResponse,
  PayrollRequest
} from '../../../shared/models/payroll/payroll.model';

import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/ employee-response';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.css'
})
export class PayrollComponent implements OnInit {
  // 🔧 FIX: was typed as `Payroll[]`, which doesn't exist in the model
  // file (only PayrollResponse/PayrollRequest/PayrollApiResponse do).
  // That mismatch meant TypeScript couldn't catch field-name errors
  // here at all — using the real response type instead.
  payrollList: PayrollResponse[] = [];
  employees: EmployeeResponse[] = [];

  loading = false;
  saving = false;
  errorMessage = '';

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // Modal form fields
  formEmployeeId: number | null = null;
  formPayrollMonth: number = new Date().getMonth() + 1;
  formPayrollYear: number = new Date().getFullYear();
  formWorkingDays: number = 0;
  formPresentDays: number = 0;
  formPaidLeaveDays: number = 0;
  formLOPDays: number = 0;
  formTotalEarnings: number = 0;
  formTotalDeductions: number = 0;
  formGrossSalary: number = 0;
  formNetSalary: number = 0;
  formStatus: string = 'Processed';
  formProcessedDate: string = '';
  formApprovedDate: string = '';

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadPayroll();
    this.loadEmployees();
  }

  loadPayroll(): void {
    this.loading = true;
    this.errorMessage = '';

    this.payrollService.getAll().subscribe({
      next: (response: any) => {
        this.payrollList = response?.data ?? [];

        // 🔍 Temporary diagnostic — check the browser console after this
        // change. If payrollList has entries but most fields (pr_EmployeeId,
        // pr_GrossSalary, etc.) are 0/undefined on them, the problem is in
        // PayrollService's field-name mapping (the `pick()` candidates
        // don't match what the backend actually sends) — paste this log
        // output and I'll fix the mapping precisely.
        console.log('Payroll list loaded:', this.payrollList);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Payroll load failed:', error);
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Unable to load payroll records.';
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (response: any) => {
        this.employees = response?.data ?? [];
        console.log('Employees loaded:', this.employees);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load employees:', err)
    });
  }

  // 🔧 FIX: was `e.employeeID === empId` — a strict equality check that
  // silently fails if one side is a string and the other a number (a very
  // common API/JSON quirk, e.g. "5" vs 5). Comparing as numbers on both
  // sides makes the match work regardless of which type the backend sends.
  employeeName(empId: number): string {
    const emp = this.employees.find(e => Number(e.employeeID) === Number(empId));
    if (!emp) return `#${empId}`;
    return `${emp.firstName} ${emp.lastName}`;
  }

  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(item: PayrollResponse): void {
    this.isEditMode = true;
    this.currentId = item.pr_Id;
    this.formEmployeeId = item.pr_EmployeeId;
    this.formPayrollMonth = item.pr_PayrollMonth;
    this.formPayrollYear = item.pr_PayrollYear;
    this.formWorkingDays = item.pr_WorkingDays;
    this.formPresentDays = item.pr_PresentDays;
    this.formPaidLeaveDays = item.pr_PaidLeaveDays;
    this.formLOPDays = item.pr_LOPDays;
    this.formTotalEarnings = item.pr_TotalEarnings;
    this.formTotalDeductions = item.pr_TotalDeductions;
    this.formGrossSalary = item.pr_GrossSalary;
    this.formNetSalary = item.pr_NetSalary;
    this.formStatus = item.pr_Status;
    this.formProcessedDate = item.pr_ProcessedDate ? item.pr_ProcessedDate.substring(0, 10) : '';
    this.formApprovedDate = item.pr_ApprovedDate ? item.pr_ApprovedDate.substring(0, 10) : '';
    this.showForm = true;
  }

  closeForm(): void {
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formEmployeeId = null;
    this.formPayrollMonth = new Date().getMonth() + 1;
    this.formPayrollYear = new Date().getFullYear();
    this.formWorkingDays = 0;
    this.formPresentDays = 0;
    this.formPaidLeaveDays = 0;
    this.formLOPDays = 0;
    this.formTotalEarnings = 0;
    this.formTotalDeductions = 0;
    this.formGrossSalary = 0;
    this.formNetSalary = 0;
    this.formStatus = 'Processed';
    this.formProcessedDate = '';
    this.formApprovedDate = '';
  }

  savePayroll(): void {
    if (this.formEmployeeId === null) {
      alert('Please select an employee.');
      return;
    }

    const model: PayrollRequest = {
      pr_EmployeeId: this.formEmployeeId,
      pr_PayrollMonth: this.formPayrollMonth,
      pr_PayrollYear: this.formPayrollYear,
      pr_WorkingDays: this.formWorkingDays,
      pr_PresentDays: this.formPresentDays,
      pr_PaidLeaveDays: this.formPaidLeaveDays,
      pr_LOPDays: this.formLOPDays,
      pr_TotalEarnings: this.formTotalEarnings,
      pr_TotalDeductions: this.formTotalDeductions,
      pr_GrossSalary: this.formGrossSalary,
      pr_NetSalary: this.formNetSalary,
      pr_Status: this.formStatus,
      pr_ProcessedDate: this.formProcessedDate || undefined,
      pr_ApprovedDate: this.formApprovedDate || undefined
    };

    if (this.isEditMode && this.currentId !== null) {
      model.pr_Id = this.currentId;
    }

    this.saving = true;

    if (this.isEditMode && this.currentId !== null) {
      this.payrollService.update(this.currentId, model).subscribe({
        next: () => {
          this.saving = false;
          alert('Payroll updated successfully.');
          this.closeForm();
          this.loadPayroll();
        },
        error: (error) => {
          this.saving = false;
          alert(error?.error?.message || 'Update failed. Please try again.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.payrollService.add(model).subscribe({
      next: () => {
        this.saving = false;
        alert('Payroll added successfully.');
        this.closeForm();
        this.loadPayroll();
      },
      error: (error) => {
        this.saving = false;
        alert(error?.error?.message || 'Save failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  deletePayroll(id: number): void {
    const confirmed = confirm('Are you sure you want to delete this payroll record?');
    if (!confirmed) return;

    this.loading = true;

    this.payrollService.delete(id).subscribe({
      next: () => {
        this.loading = false;
        alert('Payroll deleted successfully.');
        this.loadPayroll();
      },
      error: (error) => {
        this.loading = false;
        alert(error?.error?.message || 'Delete failed. Please try again.');
      }
    });
  }
}
