import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PayrollDetailsService } from '../../../core/services/payrolldetail.service';
import {
  PayrollDetailsResponse,
  PayrollDetailsRequest,
  COMPONENT_TYPES,
  CALCULATION_TYPES
} from '../../../shared/models/Payrolldetail/Payrolldetail.model';
import { PayrollService } from '../../../core/services/payroll.service';
import { PayrollResponse } from '../../../shared/models/payroll/payroll.model';

import { SalaryStructureService } from '../../../core/services/salary-structure.service';
import { SalaryStructureResponse } from '../../../shared/models/salary-structure/salary-structure';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/ employee-response';

@Component({
  selector: 'app-payroll-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payrolldetail.component.html',
  styleUrl: './payrolldetail.component.css'
})
export class PayrollDetailsComponent implements OnInit {
  details: PayrollDetailsResponse[] = [];
  payrolls: PayrollResponse[] = [];
  structures: SalaryStructureResponse[] = [];
  employees: EmployeeResponse[] = [];

  readonly componentTypes = COMPONENT_TYPES;
  readonly calculationTypes = CALCULATION_TYPES;

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;
  formError = '';

  fieldErrors: {
    pd_PR_Id?: string;
    pd_ComponentName?: string;
    pd_ComponentType?: string;
    pd_CalculationType?: string;
    pd_Amount?: string;
  } = {};

  formPRId: number | null = null;
  formSCId: number | null = null;
  formComponentName = '';
  formComponentType = 'Earning';
  formCalculationType = 'Fixed';
  formRateOrValue: number | null = null;
  formAmount: number | null = null;

  pendingDeleteId: number | null = null;

  constructor(
    private detailsService: PayrollDetailsService,
    private payrollService: PayrollService,
    private structureService: SalaryStructureService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadDetails();
    this.loadPayrolls();
    this.loadStructures();
    this.loadEmployees();
  }

  loadDetails(): void {
    this.loading = true;
    this.errorMessage = '';
    this.detailsService.getAll().subscribe({
      next: (response) => {
        this.details = response?.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Could not load payroll detail records.');
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  loadPayrolls(): void {
    this.payrollService.getAll().subscribe({
      next: (response: any) => {
        this.payrolls = response?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load payrolls:', err)
    });
  }

  loadStructures(): void {
    this.structureService.getAll().subscribe({
      next: (response: any) => {
        this.structures = response?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load salary structures:', err)
    });
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (response: any) => {
        this.employees = response?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load employees:', err)
    });
  }

  employeeName(empId: number): string {
    const emp = this.employees.find(e => e.employeeID === empId);
    if (!emp) return `#${empId}`;
    return `${emp.firstName} ${emp.lastName}`;
  }

  structureName(ssId: number): string {
    const s = this.structures.find(x => x.ss_Id === ssId);
    if (!s) return `#${ssId}`;
    return s.ss_StructureName;
  }

  // Human-readable label for a payroll record — shows employee name
  payrollLabel(prId: number): string {
    const p = this.payrolls.find(x => Number(x.pr_Id) === Number(prId));
    if (!p) return `#${prId}`;
    return this.employeeName(p.pr_EmployeeId);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  private extractErrorMessage(err: any, fallback: string): string {
    const backendMessage =
      err?.error?.message ??
      (typeof err?.error === 'string' ? err.error : null) ??
      err?.message;
    return typeof backendMessage === 'string' && backendMessage ? backendMessage : fallback;
  }

  // =========================
  // ADD / EDIT
  // =========================
  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(item: PayrollDetailsResponse): void {
    this.isEditMode = true;
    this.currentId = item.pd_Id;
    this.formPRId = item.pd_PR_Id;
    this.formSCId = item.pd_SC_Id;
    this.formComponentName = item.pd_ComponentName;
    this.formComponentType = item.pd_ComponentType;
    this.formCalculationType = item.pd_CalculationType;
    this.formRateOrValue = item.pd_RateOrValue;
    this.formAmount = item.pd_Amount;
    this.formError = '';
    this.fieldErrors = {};
    this.showForm = true;
  }

  closeForm(): void {
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formPRId = null;
    this.formSCId = null;
    this.formComponentName = '';
    this.formComponentType = 'Earning';
    this.formCalculationType = 'Fixed';
    this.formRateOrValue = null;
    this.formAmount = null;
    this.formError = '';
    this.fieldErrors = {};
  }

  private validateForm(): boolean {
    this.fieldErrors = {};

    if (!this.formPRId) {
      this.fieldErrors.pd_PR_Id = 'Please select a payroll record.';
    }
    if (!this.formComponentName || !this.formComponentName.trim()) {
      this.fieldErrors.pd_ComponentName = 'Component name is required.';
    }
    if (!this.formComponentType) {
      this.fieldErrors.pd_ComponentType = 'Component type is required.';
    }
    if (!this.formCalculationType) {
      this.fieldErrors.pd_CalculationType = 'Calculation type is required.';
    }
    if (this.formAmount === null || this.formAmount < 0) {
      this.fieldErrors.pd_Amount = 'Enter a valid, non-negative amount.';
    }

    return Object.values(this.fieldErrors).every(v => !v);
  }

  saveDetail(): void {
    this.formError = '';

    if (!this.validateForm()) {
      this.formError = 'Please fix the highlighted fields before saving.';
      this.cdr.detectChanges();
      return;
    }

    const model: PayrollDetailsRequest = {
      pd_PR_Id: this.formPRId!,
      pd_SC_Id: this.formSCId ?? 0,
      pd_ComponentName: this.formComponentName.trim(),
      pd_ComponentType: this.formComponentType,
      pd_CalculationType: this.formCalculationType,
      pd_RateOrValue: this.formRateOrValue,
      pd_Amount: this.formAmount!
    };

    this.saving = true;

    if (this.isEditMode && this.currentId !== null) {
      this.detailsService.update(this.currentId, model).subscribe({
        next: () => {
          this.saving = false;
          this.closeForm();
          this.loadDetails();
          this.showSuccess('Payroll detail updated successfully.');
        },
        error: (err) => {
          this.saving = false;
          this.formError = this.extractErrorMessage(err, 'Update failed. Please try again.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.detailsService.add(model).subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.loadDetails();
        this.showSuccess('Payroll detail added successfully.');
      },
      error: (err) => {
        this.saving = false;
        this.formError = this.extractErrorMessage(err, 'Save failed. Please try again.');
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // DELETE
  // =========================
  askDelete(id: number): void {
    this.pendingDeleteId = id;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId === null) return;
    const id = this.pendingDeleteId;

    this.detailsService.delete(id).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.loadDetails();
        this.showSuccess('Payroll detail deleted successfully.');
      },
      error: (err) => {
        this.pendingDeleteId = null;
        this.errorMessage = this.extractErrorMessage(err, 'Delete failed. Please try again.');
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}
