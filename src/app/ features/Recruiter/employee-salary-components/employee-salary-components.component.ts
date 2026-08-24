import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { EmployeeSalaryComponentsService } from '../../../core/services/employee-salary-components.service';
import {
  EmployeeSalaryComponent,
  EmployeeSalaryComponentRequest
} from '../../../shared/models/employee-salary-component/employee-salary-components.model';

// Used to resolve esc_ES_Id -> a readable "Employee Name (period)" label,
// both in the table and in the Add/Edit dropdown.
import { EmployeeSalaryService } from '../../../core/services/Employee salary.service';
import { EmployeeSalaryResponseModel } from '../../../shared/models/Employee salary/Employee salary.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/ employee-response';

@Component({
  selector: 'app-employee-salary-components',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-salary-components.component.html',
  styleUrls: ['./employee-salary-components.component.css']
})
export class EmployeeSalaryComponentsComponent
  implements OnInit {

  components: EmployeeSalaryComponent[] = [];
  componentForm!: FormGroup;

  loading = false;
  saving = false;
  deletingId: number | null = null;

  showModal = false;
  isEdit = false;
  editingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  calculationTypes = [
    'Fixed',
    'Percentage'
  ];

  // ---- lookups for esc_ES_Id -> "Employee Name (period)" -------------
  employeeSalaries: EmployeeSalaryResponseModel[] = [];
  private employeeNameById = new Map<number, string>();
  private employeeSalaryLabelById = new Map<number, string>();

  // NOTE: esc_SC_Id (Salary Component) still shows as a raw ID.
  // The SalaryComponent master model/service hasn't been provided yet —
  // once it is, this same pattern (lookup map + dropdown) applies to it too.

  constructor(
    private fb: FormBuilder,
    private service: EmployeeSalaryComponentsService,
    private employeeSalaryService: EmployeeSalaryService,
    private employeeService: EmployeeService,
    // Same as HolidayList / EmployeeSalaryPageComponent — without this,
    // the table and dropdowns don't reliably repaint right after the
    // subscribe() callbacks set the data, so the page can look "stuck"
    // until some unrelated click forces Angular to check the view again.
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.loadLookups();
    this.loadComponents();
  }

  createForm(): void {
    this.componentForm = this.fb.group({
      esc_ES_Id: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      esc_SC_Id: [
        null,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      esc_CalculationType: [
        'Fixed',
        Validators.required
      ],

      esc_Value: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      esc_Amount: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ]
    });

    this.componentForm
      .get('esc_CalculationType')
      ?.valueChanges
      .subscribe(type => {
        this.updateAmountLabel(type);
      });
  }

  // =========================
  // LOOKUPS
  // =========================
  loadLookups(): void {
    // Employees first, so employeeNameById is ready when the salary
    // records come back and we build the ES_Id -> label map.
    this.employeeService.getAll().subscribe({
      next: res => {
        const employees: EmployeeResponse[] = res.data ?? [];
        this.employeeNameById = new Map(
          employees.map(e => [e.employeeID, this.formatEmployeeName(e)])
        );
        this.rebuildEmployeeSalaryLabels();
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-fatal: falls back to "ES-<id>" in the label.
      }
    });

    this.employeeSalaryService.getAll().subscribe({
      next: data => {
        this.employeeSalaries = data ?? [];
        this.rebuildEmployeeSalaryLabels();
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-fatal: table/form fall back to "ES-<id>".
      }
    });
  }

  private formatEmployeeName(e: EmployeeResponse): string {
    const fullName = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
    return fullName || e.employeeCode || `#${e.employeeID}`;
  }

  private rebuildEmployeeSalaryLabels(): void {
    this.employeeSalaryLabelById = new Map(
      this.employeeSalaries.map(es => {
        const name = this.employeeNameById.get(es.es_EmployeeId) ?? `#${es.es_EmployeeId}`;
        const from = es.es_EffectiveFrom ? new Date(es.es_EffectiveFrom).getFullYear() : '?';
        const to = es.es_EffectiveTo ? new Date(es.es_EffectiveTo).getFullYear() : 'Ongoing';
        return [es.es_Id, `${name} (${from} – ${to})`];
      })
    );
  }

  employeeSalaryLabel(escEsId: number): string {
    return this.employeeSalaryLabelById.get(escEsId) ?? `ES-${escEsId}`;
  }

  // =========================
  // LIST
  // =========================
  loadComponents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getAll().subscribe({
      next: response => {
        this.components = response ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: error => {
        console.error('Salary components load error:', error);
        this.errorMessage =
          error?.error?.message ||
          'Failed to load salary components.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal(): void {
    this.isEdit = false;
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.componentForm.reset({
      esc_ES_Id: null,
      esc_SC_Id: null,
      esc_CalculationType: 'Fixed',
      esc_Value: 0,
      esc_Amount: 0
    });

    this.componentForm.markAsPristine();
    this.componentForm.markAsUntouched();

    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(item: EmployeeSalaryComponent): void {
    this.isEdit = true;
    this.editingId = this.getId(item);
    this.errorMessage = '';
    this.successMessage = '';

    this.componentForm.patchValue({
      esc_ES_Id: this.getEmployeeSalaryId(item),
      esc_SC_Id: this.getSalaryComponentId(item),
      esc_CalculationType: this.getCalculationType(item),
      esc_Value: this.getValue(item),
      esc_Amount: this.getAmount(item)
    });

    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }

    this.showModal = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  submit(): void {
    if (this.componentForm.invalid) {
      this.componentForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const request: EmployeeSalaryComponentRequest = {
      esc_ES_Id: Number(
        this.componentForm.value.esc_ES_Id
      ),
      esc_SC_Id: Number(
        this.componentForm.value.esc_SC_Id
      ),
      esc_CalculationType:
        this.componentForm.value.esc_CalculationType,
      esc_Value: Number(
        this.componentForm.value.esc_Value
      ),
      esc_Amount: Number(
        this.componentForm.value.esc_Amount
      )
    };

    // Separate branches (not a shared request$ variable) so TypeScript
    // never has to unify add()'s and update()'s return types.
    const onSuccess = () => {
      this.saving = false;
      this.showModal = false;

      this.successMessage = this.isEdit
        ? 'Salary component updated successfully.'
        : 'Salary component added successfully.';

      this.loadComponents();
    };
    const onError = (error: any) => {
      console.error('Salary component save error:', error);

      this.errorMessage =
        error?.error?.message ||
        'Failed to save salary component.';

      this.saving = false;
      this.cdr.detectChanges();
    };

    if (this.isEdit && this.editingId) {
      this.service.update(this.editingId, request).subscribe({
        next: onSuccess,
        error: onError
      });
    } else {
      this.service.add(request).subscribe({
        next: onSuccess,
        error: onError
      });
    }
  }

  deleteItem(item: EmployeeSalaryComponent): void {
    const id = this.getId(item);

    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this salary component?'
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = id;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.service.delete(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage =
          'Salary component deleted successfully.';
        this.loadComponents();
      },

      error: error => {
        console.error('Salary component delete error:', error);

        this.deletingId = null;
        this.errorMessage =
          error?.error?.message ||
          'Failed to delete salary component.';
        this.cdr.detectChanges();
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.componentForm.get(controlName);

    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
  }

  hasError(
    controlName: string,
    errorName: string
  ): boolean {
    const control = this.componentForm.get(controlName);

    return !!control &&
      control.hasError(errorName) &&
      (control.touched || control.dirty);
  }

  updateAmountLabel(type: string): void {
    // UI label ke liye reserved method
  }

  getId(item: EmployeeSalaryComponent): number {
    return Number(
      (item as any).esc_Id ??
      (item as any).ESC_Id ??
      0
    );
  }

  getEmployeeSalaryId(
    item: EmployeeSalaryComponent
  ): number {
    return Number(
      (item as any).esc_ES_Id ??
      (item as any).ESC_ES_Id ??
      0
    );
  }

  getSalaryComponentId(
    item: EmployeeSalaryComponent
  ): number {
    return Number(
      (item as any).esc_SC_Id ??
      (item as any).ESC_SC_Id ??
      0
    );
  }

  getCalculationType(
    item: EmployeeSalaryComponent
  ): string {
    return (
      (item as any).esc_CalculationType ??
      (item as any).ESC_CalculationType ??
      '-'
    );
  }

  getValue(item: EmployeeSalaryComponent): number {
    return Number(
      (item as any).esc_Value ??
      (item as any).ESC_Value ??
      0
    );
  }

  getAmount(item: EmployeeSalaryComponent): number {
    return Number(
      (item as any).esc_Amount ??
      (item as any).ESC_Amount ??
      0
    );
  }
}
