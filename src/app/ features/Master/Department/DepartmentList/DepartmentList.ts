// features/Master/department/DepartmentList/DepartmentList.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../../../core/services/Department.Service';
import { EmployerService } from '../../../../core/services/company.service';
import { DepartmentResponse } from '../../../../shared/models/DepartmentResponse/DepartmentResponse';
import { CompanyRequest } from '../../../../shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../../shared/models/companylist/CompanyResponse';
import { ApiResponse } from '../../../../shared/models/companylist/ ApiResponse';



@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './DepartmentList.html',
  styleUrls: ['./DepartmentList.css']
})
export class DepartmentList implements OnInit {
  departments: DepartmentResponse[] = [];
  filteredDepartments: DepartmentResponse[] = [];
  employers: CompanyResponse[] = [];
  loading = true;
  errorMessage = '';
  saving = false;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // filter
  filterName = '';

  // Form fields
  formDepartmentCode = '';
  formDepartmentName = '';
  formLocation = '';
  formDescription = '';
  formBudget: number | null = null;
  formCompanyID: number | null = null;

  constructor(
    private departmentService: DepartmentService,
    private employerService: EmployerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadEmployers();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.resetForm();
        this.showForm = true;
      } else if (params['action'] === 'edit' && params['id']) {
        const item = this.departments.find(d => d.departmentID === +params['id']);
        if (item) {
          this.isEditMode = true;
          this.currentId = item.departmentID;
          this.formDepartmentCode = item.departmentCode;
          this.formDepartmentName = item.departmentName;
          this.formLocation = item.location || '';
          this.formDescription = item.description || '';
          this.formBudget = item.budget ?? null;
          this.formCompanyID = item.companyID ?? null;
          this.showForm = true;
        }
      } else {
        this.showForm = false;
      }
      this.cdr.detectChanges();
    });
  }

  loadData(): void {
    this.loading = true;
    this.departmentService.getAll().subscribe({
      next: (res) => {
        this.departments = res.data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Departments could not loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployers(): void {
    this.employerService.getAllForDropdown().subscribe({
      next: (res) => {
        this.employers = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Employer list could not loaded', err);
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filteredDepartments = this.departments.filter(d => {
      return !this.filterName || d.departmentName?.toLowerCase().includes(this.filterName.toLowerCase());
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterName = '';
    this.filteredDepartments = this.departments;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formDepartmentCode = '';
    this.formDepartmentName = '';
    this.formLocation = '';
    this.formDescription = '';
    this.formBudget = null;
    this.formCompanyID = null;
  }

  openAddForm(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'add' },
      queryParamsHandling: 'merge'
    });
  }

  openEditForm(item: DepartmentResponse): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'edit', id: item.departmentID },
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
  deleteItem(item: DepartmentResponse): void {
    if (!confirm(`Do you want to delete "${item.departmentName}"?`)) return;

    this.departmentService.delete(item.departmentID).subscribe({
      next: () => {
        alert('Department deleted successfully.');
        this.loadData();
      },
      error: (err) => {
        alert('Delete failed.');
        console.error(err);
      }
    });
  }
  saveDepartment(): void {
    if (!this.formDepartmentCode.trim() || !this.formDepartmentName.trim()) {
      alert('Department Code and Name is needed');
      return;
    }

    const payload = {
      departmentCode: this.formDepartmentCode,
      departmentName: this.formDepartmentName,
      location: this.formLocation,
      description: this.formDescription,
      budget: this.formBudget,
      companyID: this.formCompanyID
    };

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      // Update
      this.departmentService.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Department updated successfully.');
          this.resetForm();
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          alert('Update failed.');
          console.error('Update error:', err);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Add
      this.departmentService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Department added successfully.');
          this.resetForm();
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          alert('Save failed.');
          console.error('Create error:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
