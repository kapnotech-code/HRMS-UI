import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SalaryComponentService } from '../../../core/services/salary-component.service';
import {
  SalaryComponentResponse,
  SalaryComponentRequest
} from '../../../shared/models/salary-component/salary-component.model';

@Component({
  selector: 'app-salary-component-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './salary-component-list.component.html',
  styleUrl: './salary-component-list.component.css'
})
export class SalaryComponentListComponent implements OnInit, OnDestroy {
  components: SalaryComponentResponse[] = [];
  filteredComponents: SalaryComponentResponse[] = [];
  loading = true;
  errorMessage = '';
  saving = false;

  // Row currently being deleted — used to disable its button and avoid double-clicks.
  deletingId: number | null = null;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // filter
  filterName = '';

  // Form fields
  formComponentCode = '';
  formComponentName = '';
  formComponentType: 'Earning' | 'Deduction' = 'Earning';
  formCalculationType: 'Fixed' | 'Percentage' = 'Fixed';
  formCalculationValue: number | null = null;
  formIsTaxable = true;
  formIsActive = true;

  private destroy$ = new Subject<void>();

  constructor(
    private salaryComponentService: SalaryComponentService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();

    // Same pattern as DepartmentList: add/edit is driven by query params
    // on this same route, not a separate page — so no extra route needed.
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['action'] === 'add') {
        this.resetForm();
        this.showForm = true;
      } else if (params['action'] === 'edit' && params['id']) {
        const item = this.components.find(c => c.sc_Id === +params['id']);
        if (item) {
          this.isEditMode = true;
          this.currentId = item.sc_Id;
          this.formComponentCode = item.sc_ComponentCode;
          this.formComponentName = item.sc_ComponentName;
          this.formComponentType = item.sc_ComponentType;
          this.formCalculationType = item.sc_CalculationType;
          this.formCalculationValue = item.sc_CalculationValue ?? null;
          this.formIsTaxable = item.sc_IsTaxable;
          this.formIsActive = item.sc_IsActive;
          this.showForm = true;
        }
      } else {
        this.showForm = false;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.salaryComponentService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.components = res.data || [];
          this.applyFilter();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Salary components could not be loaded.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilter(): void {
    this.filteredComponents = this.components.filter(c => {
      return !this.filterName ||
        c.sc_ComponentName?.toLowerCase().includes(this.filterName.toLowerCase());
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterName = '';
    this.filteredComponents = this.components;
    this.cdr.detectChanges();
  }

  trackByComponentId(_index: number, component: SalaryComponentResponse): number {
    return component.sc_Id;
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formComponentCode = '';
    this.formComponentName = '';
    this.formComponentType = 'Earning';
    this.formCalculationType = 'Fixed';
    this.formCalculationValue = null;
    this.formIsTaxable = true;
    this.formIsActive = true;
  }

  openAddForm(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'add' },
      queryParamsHandling: 'merge'
    });
  }

  openEditForm(item: SalaryComponentResponse): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'edit', id: item.sc_Id },
      queryParamsHandling: 'merge'
    });
  }

  closeForm(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null, id: null },
      queryParamsHandling: 'merge'
    });
  }

  saveComponent(): void {
    if (!this.formComponentCode.trim() || !this.formComponentName.trim()) {
      alert('Component Code and Name are required.');
      return;
    }

    const payload: SalaryComponentRequest = {
      sc_ComponentCode: this.formComponentCode,
      sc_ComponentName: this.formComponentName,
      sc_ComponentType: this.formComponentType,
      sc_CalculationType: this.formCalculationType,
      sc_CalculationValue: this.formCalculationValue ?? 0,
      sc_IsTaxable: this.formIsTaxable,
      sc_IsActive: this.formIsActive
    };

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      this.salaryComponentService.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Salary component updated successfully.');
          this.resetForm();
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Update failed. Please try again.';
          alert(msg);
          console.error('Update error:', err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.salaryComponentService.add(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Salary component added successfully.');
          this.resetForm();
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Save failed. Please try again.';
          alert(msg);
          console.error('Create error:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteComponent(item: SalaryComponentResponse): void {
    if (!confirm(`Do you want to permanently delete "${item.sc_ComponentName}"? This cannot be undone.`)) {
      return;
    }

    this.deletingId = item.sc_Id;

    this.salaryComponentService.delete(item.sc_Id).subscribe({
      next: () => {
        this.deletingId = null;
        alert('Salary component deleted successfully.');
        this.loadData();
      },
      error: (err) => {
        this.deletingId = null;
        const msg = err?.error?.message || 'Delete failed. It may be in use elsewhere.';
        alert(msg);
        console.error('Delete error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
