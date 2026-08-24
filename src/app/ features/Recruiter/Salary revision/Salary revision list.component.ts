import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SalaryRevisionService } from '../../../core/services/Salary revision.service';
import {
  SalaryRevisionRequest,
  SalaryRevisionResponse
} from '../../../shared/models/Salary_revision/Salary revision.model';

import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/ employee-response';

import { EmployeeSalaryService } from '../../../core/services/Employee salary.service';
import { EmployeeSalaryResponseModel } from '../../../shared/models/Employee salary/Employee salary.model';

@Component({
  selector: 'app-salary-revision-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './Salary revision list.component.html',
  styleUrl: './Salary revision list.component.css'
})
export class SalaryRevisionListComponent implements OnInit {

  revisions: SalaryRevisionResponse[] = [];
  employees: EmployeeResponse[] = [];
  allSalaryRecords: EmployeeSalaryResponseModel[] = [];

  private employeeNameById = new Map<number, string>();

  loading = false;
  errorMessage = '';
  saving = false;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // Form fields
  formEmployeeId: number | null = null;
  formPreviousESId: number | null = null;
  formNewESId: number | null = null;
  formRevisionType: 'Increment' | 'Promotion' | 'Adjustment' = 'Increment';
  formRevisionDate = '';
  formReason = '';
  formApprovedBy: number | null = null;

  constructor(
    private service: SalaryRevisionService,
    private employeeService: EmployeeService,
    private employeeSalaryService: EmployeeSalaryService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadLookups();
    this.loadRevisions();
  }

  loadLookups(): void {
    this.employeeService.getAll().subscribe({
      next: (res) => {
        this.employees = res.data ?? [];
        this.employeeNameById = new Map(
          this.employees.map(e => [e.employeeID, this.formatEmployeeName(e)])
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load employees:', err)
    });

    this.employeeSalaryService.getAll().subscribe({
      next: (data) => {
        this.allSalaryRecords = data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load salary records:', err)
    });
  }

  private formatEmployeeName(e: EmployeeResponse): string {
    const fullName = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
    return fullName || e.employeeCode || `#${e.employeeID}`;
  }

  employeeName(id: number): string {
    return this.employeeNameById.get(id) ?? `#${id}`;
  }

  // Salary records belonging to the employee currently selected in the form —
  // used to populate the Previous/New salary-record dropdowns with readable labels.
  get salaryRecordsForFormEmployee(): EmployeeSalaryResponseModel[] {
    if (!this.formEmployeeId) return [];
    return this.allSalaryRecords.filter(r => r.es_EmployeeId === this.formEmployeeId);
  }

  salaryRecordLabel(esId: number | null): string {
    if (esId == null) return '—';
    const record = this.allSalaryRecords.find(r => r.es_Id === esId);
    if (!record) return `#${esId}`;
    const from = record.es_EffectiveFrom ? new Date(record.es_EffectiveFrom).getFullYear() : '';
    return `${record.es_BasicSalary} (from ${from})`;
  }

  // Excludes whatever is currently picked in the *other* dropdown, so the
  // form itself makes it hard to violate CK_SR_DifferentES in the first place.
  get previousESOptions(): EmployeeSalaryResponseModel[] {
    return this.salaryRecordsForFormEmployee.filter(r => r.es_Id !== this.formNewESId);
  }

  get newESOptions(): EmployeeSalaryResponseModel[] {
    return this.salaryRecordsForFormEmployee.filter(r => r.es_Id !== this.formPreviousESId);
  }

  loadRevisions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getAll().subscribe({
      next: (response) => {
        this.revisions = response?.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Salary Revision Error:', error);
        this.errorMessage = error?.error?.message || 'Unable to load salary revisions.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(item: SalaryRevisionResponse): void {
    this.isEditMode = true;
    this.currentId = item.sr_Id;
    this.formEmployeeId = item.sr_EmployeeId;
    this.formPreviousESId = item.sr_PreviousES_Id;
    this.formNewESId = item.sr_NewES_Id;
    this.formRevisionType = item.sr_RevisionType as 'Increment' | 'Promotion' | 'Adjustment';
    this.formRevisionDate = item.sr_RevisionDate ? item.sr_RevisionDate.substring(0, 10) : '';
    this.formReason = item.sr_Reason || '';
    this.formApprovedBy = item.sr_ApprovedBy;
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
    this.formPreviousESId = null;
    this.formNewESId = null;
    this.formRevisionType = 'Increment';
    this.formRevisionDate = '';
    this.formReason = '';
    this.formApprovedBy = null;
  }

  saveRevision(): void {
    if (!this.formEmployeeId) {
      alert('Please select an employee.');
      return;
    }
    if (!this.formNewESId) {
      alert('Please select the new salary record.');
      return;
    }
    if (!this.formRevisionDate) {
      alert('Please select a revision date.');
      return;
    }
    // Mirrors the DB's CK_SR_DifferentES check constraint — catch it
    // client-side so the user gets an immediate, clear message instead
    // of a raw SQL error after hitting Save.
    if (this.formPreviousESId != null && this.formPreviousESId === this.formNewESId) {
      alert('Previous and New salary records must be different. Please pick a different record for at least one of them.');
      return;
    }

    const payload: SalaryRevisionRequest = {
      sr_EmployeeId: this.formEmployeeId,
      sr_PreviousES_Id: this.formPreviousESId,
      sr_NewES_Id: this.formNewESId,
      sr_RevisionType: this.formRevisionType,
      sr_RevisionDate: this.formRevisionDate,
      sr_Reason: this.formReason || null,
      sr_ApprovedBy: this.formApprovedBy
    };

    this.saving = true;

    if (this.isEditMode && this.currentId !== null) {
      this.service.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Salary revision updated successfully.');
          this.closeForm();
          this.loadRevisions();
        },
        error: (error) => {
          this.saving = false;
          alert(error?.error?.message || 'Update failed. Please try again.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.service.add(payload).subscribe({
      next: () => {
        this.saving = false;
        alert('Salary revision added successfully.');
        this.closeForm();
        this.loadRevisions();
      },
      error: (error) => {
        this.saving = false;
        alert(error?.error?.message || 'Save failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteRevision(item: SalaryRevisionResponse): void {
    const confirmed = confirm(
      `Delete this ${item.sr_RevisionType} revision for ${this.employeeName(item.sr_EmployeeId)}? This cannot be undone.`
    );
    if (!confirmed) return;

    this.service.delete(item.sr_Id).subscribe({
      next: () => {
        alert('Salary revision deleted successfully.');
        this.loadRevisions();
      },
      error: (error) => {
        alert(error?.error?.message || 'Unable to delete salary revision.');
      }
    });
  }
}
