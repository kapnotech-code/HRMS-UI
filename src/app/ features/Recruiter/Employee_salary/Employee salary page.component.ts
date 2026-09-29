import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EmployeeSalaryRequestModel,
  EmployeeSalaryResponseModel,
} from '../../../shared/models/Employee salary/Employee salary.model';
import { EmployeeSalaryService } from '../../../core/services/Employee salary.service';

import { EmployeeResponse } from '../../../shared/models/employee/employee-response';
import { EmployeeService } from '../../../core/services/employee.service';
import { SalaryStructureResponse } from '../../../shared/models/salary-structure/salary-structure';
import { SalaryStructureService } from '../../../core/services/salary-structure.service';

// Company lookup — same service DepartmentList already uses for its
// company dropdown, reused here so Company ID also shows as a name.
import { CompanyResponse } from '../../../shared/models/companylist/CompanyResponse';
import { EmployerService } from '../../../core/services/company.service';

@Component({
  selector: 'app-employee-salary-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './Employee salary page.component.html',
  styleUrl: './Employee salary page.component.css',
})
export class EmployeeSalaryPageComponent implements OnInit {
  records: EmployeeSalaryResponseModel[] = [];
  loading = false;
  saving = false;
  formLoading = false;
  errorMessage = '';
  formError = '';
  searchTerm = '';

  // lookups — resolve IDs to display names for both the table and the form dropdowns
  employees: EmployeeResponse[] = [];
  salaryStructures: SalaryStructureResponse[] = [];
  companies: CompanyResponse[] = [];
  private employeeNameById = new Map<number, string>();
  private structureNameById = new Map<number, string>();
  private companyNameById = new Map<number, string>();

  // form panel state
  isFormOpen = false;
  editingId: number | null = null;

  // delete confirm state
  pendingDeleteId: number | null = null;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private salaryService: EmployeeSalaryService,
    private employeeService: EmployeeService,
    private salaryStructureService: SalaryStructureService,
    private employerService: EmployerService,
    // Same as HolidayList — without this, Angular doesn't always re-render
    // the view right after async data arrives inside subscribe(), so the
    // table/dropdowns can look "stuck" until some unrelated click happens.
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      es_EmployeeId: [null as number | null, [Validators.required, Validators.min(1)]],
      es_SS_Id: [null as number | null, [Validators.required, Validators.min(1)]],
      es_CompanyId: [null as number | null, [Validators.required, Validators.min(1)]],
      es_EffectiveFrom: ['', Validators.required],
      es_EffectiveTo: [''],
      es_BasicSalary: [null as number | null, [Validators.required, Validators.min(0)]],
      es_AnnualCTC: [null as number | null, [Validators.min(0)]],
      es_MonthlyGross: [null as number | null, [Validators.min(0)]],
      es_IsActive: [true],
    });
  }

  ngOnInit(): void {
    this.fetchLookups();
    this.fetchAll();
  }

  // =========================
  // LOOKUPS (Employee, Salary Structure, Company names)
  // =========================
  fetchLookups(): void {
    // EmployeeService.getAll() returns EmployeeResponse[] — already unwrapped.
    this.employeeService.getAll().subscribe({
      next: (res) => {
        this.employees = res ?? [];
        this.employeeNameById = new Map(
          this.employees.map((e) => [e.employeeID, this.formatEmployeeName(e)])
        );
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-fatal: table/form fall back to "#<id>" if names can't be loaded.
      },
    });

    // SalaryStructureService.getAll() returns SalaryStructureResponse[].
    this.salaryStructureService.getAll().subscribe({
      next: (res) => {
        this.salaryStructures = res ?? [];
        this.structureNameById = new Map(
          this.salaryStructures.map((s) => [s.ss_Id, s.ss_StructureName])
        );
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-fatal: table/form fall back to "SS-<id>" if names can't be loaded.
      },
    });

    // EmployerService.getAllForDropdown() — same service/method DepartmentList uses.
    this.employerService.getAllForDropdown().subscribe({
      next: (res) => {
        this.companies = res.data ?? [];
        this.companyNameById = new Map(
          this.companies.map((c) => [c.companyID, c.companyName])
        );
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-fatal: table/form fall back to "Company #<id>" if names can't be loaded.
      },
    });
  }

  private formatEmployeeName(e: EmployeeResponse): string {
    const fullName = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
    return fullName || e.employeeCode || `#${e.employeeID}`;
  }

  employeeName(id: number): string {
    return this.employeeNameById.get(id) ?? `#${id}`;
  }

  structureName(id: number): string {
    return this.structureNameById.get(id) ?? `SS-${id}`;
  }

  companyName(id: number): string {
    return this.companyNameById.get(id) ?? `Company #${id}`;
  }

  // =========================
  // LIST
  // =========================
  fetchAll(): void {
    this.loading = true;
    this.errorMessage = '';
    this.salaryService.getAll().subscribe({
      next: (data) => {
        this.records = data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load employee salary records:', err);
        this.errorMessage = err?.error?.message || 'Could not load salary records. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredRecords(): EmployeeSalaryResponseModel[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.records;
    return this.records.filter((r) =>
      this.employeeName(r.es_EmployeeId).toLowerCase().includes(term)
    );
  }

  trackById(_index: number, item: EmployeeSalaryResponseModel): number {
    return item.es_Id;
  }

  // =========================
  // ADD / EDIT (same page)
  // =========================
  get isEditMode(): boolean {
    return this.editingId !== null;
  }

  openAddForm(): void {
    this.editingId = null;
    this.formError = '';
    this.form.reset({
      es_EmployeeId: null,
      es_SS_Id: null,
      es_CompanyId: null,
      es_EffectiveFrom: '',
      es_EffectiveTo: '',
      es_BasicSalary: null,
      es_AnnualCTC: null,
      es_MonthlyGross: null,
      es_IsActive: true,
    });
    this.isFormOpen = true;
    this.cdr.detectChanges();
  }

  openEditForm(id: number): void {
    this.editingId = id;
    this.formError = '';
    this.isFormOpen = true;
    this.formLoading = true;
    this.cdr.detectChanges();

    this.salaryService.getById(id).subscribe({
      next: (record) => {
        this.form.patchValue({
          es_EmployeeId: record.es_EmployeeId,
          es_SS_Id: record.es_SS_Id,
          // BUG FIX: es_CompanyId was missing here before — the Company
          // dropdown would stay empty/null on edit and fail the
          // "required" validator on save. Now patched like every other field.
          es_CompanyId: record.es_CompanyId,
          es_EffectiveFrom: record.es_EffectiveFrom?.substring(0, 10),
          es_EffectiveTo: record.es_EffectiveTo ? record.es_EffectiveTo.substring(0, 10) : '',
          es_BasicSalary: record.es_BasicSalary,
          es_AnnualCTC: record.es_AnnualCTC,
          es_MonthlyGross: record.es_MonthlyGross,
          es_IsActive: record.es_IsActive,
        });
        this.formLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.formError = 'Could not load this record.';
        this.formLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.editingId = null;
    this.formError = '';
    this.cdr.detectChanges();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const payload: EmployeeSalaryRequestModel = {
      es_Id: this.editingId ?? 0,
      es_EmployeeId: value.es_EmployeeId!,
      es_SS_Id: value.es_SS_Id!,
      es_CompanyId: value.es_CompanyId!,
      es_EffectiveFrom: value.es_EffectiveFrom!,
      es_EffectiveTo: value.es_EffectiveTo ? value.es_EffectiveTo : null,
      es_BasicSalary: value.es_BasicSalary!,
      es_AnnualCTC: value.es_AnnualCTC ?? null,
      es_MonthlyGross: value.es_MonthlyGross ?? null,
      es_IsActive: !!value.es_IsActive,
    };

    this.saving = true;
    this.formError = '';

    const onSuccess = () => {
      this.saving = false;
      this.closeForm();
      this.fetchAll();
    };
    const onError = (err: HttpErrorResponse) => {
      this.saving = false;
      this.formError = err?.error?.message || 'Save failed. Please check the details and try again.';
      this.cdr.detectChanges();
    };

    if (this.isEditMode) {
      this.salaryService.update(this.editingId!, payload).subscribe({
        next: onSuccess,
        error: onError,
      });
    } else {
      this.salaryService.add(payload).subscribe({
        next: onSuccess,
        error: onError,
      });
    }
  }

  field(name: string) {
    return this.form.get(name);
  }

  isInvalid(name: string): boolean {
    const control = this.field(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // =========================
  // DELETE
  // =========================
  confirmDelete(id: number): void {
    this.pendingDeleteId = id;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }

  deleteConfirmed(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.salaryService.delete(id).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.fetchAll();
      },
      error: () => {
        this.errorMessage = 'Delete failed. The record may already be removed.';
        this.pendingDeleteId = null;
        this.cdr.detectChanges();
      },
    });
  }
}
