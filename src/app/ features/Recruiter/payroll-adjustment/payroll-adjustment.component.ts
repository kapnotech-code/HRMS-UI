import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PayrollAdjustmentService } from '../../../core/services/payroll-adjustment.service';
import {
  PayrollAdjustmentResponse,
  PayrollAdjustmentRequest
} from '../../../shared/models/payroll-adjustment/payroll-adjustment.model';

import { PayrollService } from '../../../core/services/payroll.service';
import { PayrollResponse } from '../../../shared/models/payroll/payroll.model';

import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/employee-response';

@Component({
  selector: 'app-payroll-adjustment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './payroll-adjustment.component.html',
  styleUrl: './payroll-adjustment.component.css'
})
export class PayrollAdjustmentComponent implements OnInit {
  adjustments: PayrollAdjustmentResponse[] = [];
  payrolls: PayrollResponse[] = [];
  employees: EmployeeResponse[] = [];

  loading = false;
  saving = false;
  errorMessage = '';

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  formPRId: number | null = null;
  formAdjustmentType = '';
  formAdjustmentName = '';
  formAdjustmentCategory = '';
  formAmount: number = 0;
  formReason = '';
  formCreatedBy: number = 0;

  constructor(
    private adjustmentService: PayrollAdjustmentService,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadAdjustments();
    this.loadPayrolls();
    this.loadEmployees();
  }

  loadAdjustments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adjustmentService.getAll().subscribe({
      next: (response: any) => {
        this.adjustments = response?.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Payroll Adjustment load failed:', error);
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Unable to load payroll adjustments.';
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

  payrollLabel(prId: number): string {
    const p = this.payrolls.find(x => Number(x.pr_Id) === Number(prId));
    if (!p) return `#${prId}`;
    return `${this.employeeName(p.pr_EmployeeId)} (${p.pr_PayrollMonth}/${p.pr_PayrollYear})`;
  }

  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(item: PayrollAdjustmentResponse): void {
    this.isEditMode = true;
    this.currentId = item.pa_Id;
    this.formPRId = item.pa_PR_Id;
    this.formAdjustmentType = item.pa_AdjustmentType;
    this.formAdjustmentName = item.pa_AdjustmentName;
    this.formAdjustmentCategory = item.pa_AdjustmentCategory;
    this.formAmount = item.pa_Amount;
    this.formReason = item.pa_Reason || '';
    this.formCreatedBy = item.pa_CreatedBy;
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
    this.formAdjustmentType = '';
    this.formAdjustmentName = '';
    this.formAdjustmentCategory = '';
    this.formAmount = 0;
    this.formReason = '';
    this.formCreatedBy = 0;
  }

  saveAdjustment(): void {
    if (this.formPRId === null) {
      alert('Please select a payroll record.');
      return;
    }
    if (!this.formAdjustmentType.trim()) {
      alert('Please enter adjustment type.');
      return;
    }
    if (!this.formAdjustmentName.trim()) {
      alert('Please enter adjustment name.');
      return;
    }
    if (!this.formAdjustmentCategory.trim()) {
      alert('Please enter adjustment category.');
      return;
    }

    const model: PayrollAdjustmentRequest = {
      pa_PR_Id: this.formPRId,
      pa_AdjustmentType: this.formAdjustmentType,
      pa_AdjustmentName: this.formAdjustmentName,
      pa_AdjustmentCategory: this.formAdjustmentCategory,
      pa_Amount: this.formAmount,
      pa_Reason: this.formReason || undefined,
      pa_CreatedBy: this.formCreatedBy
    };

    this.saving = true;

    if (this.isEditMode && this.currentId !== null) {
      this.adjustmentService.update(this.currentId, model).subscribe({
        next: () => {
          this.saving = false;
          alert('Payroll adjustment updated successfully.');
          this.closeForm();
          this.loadAdjustments();
        },
        error: (error) => {
          this.saving = false;
          alert(error?.error?.message || 'Update failed. Please try again.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.adjustmentService.add(model).subscribe({
      next: () => {
        this.saving = false;
        alert('Payroll adjustment added successfully.');
        this.closeForm();
        this.loadAdjustments();
      },
      error: (error) => {
        this.saving = false;
        alert(error?.error?.message || 'Save failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteAdjustment(id: number): void {
    const confirmed = confirm('Are you sure you want to delete this adjustment record?');
    if (!confirmed) return;

    this.loading = true;

    this.adjustmentService.delete(id).subscribe({
      next: () => {
        this.loading = false;
        alert('Payroll adjustment deleted successfully.');
        this.loadAdjustments();
      },
      error: (error) => {
        this.loading = false;
        alert(error?.error?.message || 'Delete failed. Please try again.');
      }
    });
  }
}
