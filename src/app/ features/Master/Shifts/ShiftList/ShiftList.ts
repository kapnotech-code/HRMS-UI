// features/Master/shift/ShiftList/ShiftList.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShiftService } from '../../../../core/services/shift.service'
import { EmployerService } from '../../../../core/services/company.service';
import { FrontendPermissionService } from '../../../../core/services/frontend-permission.service';
import { ShiftResponse } from '../../../../shared/models/ShiftResponse/ShiftResponse';
import { ShiftRequest } from '../../../../shared/models/ShiftResponse/Shiftrequest';
import { CompanyRequest } from '../../../../shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../../shared/models/companylist/CompanyResponse';
import { ApiResponse } from '../../../../shared/models/companylist/ ApiResponse';

@Component({
  selector: 'app-shift-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ShiftList.html',
  styleUrls: ['./ShiftList.css']
})
export class ShiftList implements OnInit {
  shifts: ShiftResponse[] = [];
  filteredShifts: ShiftResponse[] = [];
  employers: CompanyResponse[] = [];   // Company dropdown ke liye
  loading = true;
  errorMessage = '';
  saving = false;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // filter
  filterName = '';

  // Permission flags (admin bypass)
  canAdd = true;
  canEdit = true;
  canDelete = true;

  // Form fields
  formShiftName = '';
  formStartTime = '';
  formEndTime = '';
  formGraceMinutes = 10;
  formCompanyID: number | null = null;

  constructor(
    private shiftService: ShiftService,
    private employerService: EmployerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private frontendPerm: FrontendPermissionService
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadEmployers();
    this.loadPermissions();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        if (!this.canAdd) return;
        this.resetForm();
        this.showForm = true;
      } else if (params['action'] === 'edit' && params['id']) {
        if (!this.canEdit) return;
        const item = this.shifts.find(s => s.shiftID === +params['id']);
        if (item) {
          this.isEditMode = true;
          this.currentId = item.shiftID;
          this.formShiftName = item.shiftName;
          this.formStartTime = item.startTime?.substring(0, 5) || '';
          this.formEndTime = item.endTime?.substring(0, 5) || '';
          this.formGraceMinutes = item.graceMinutes;
          this.formCompanyID = item.companyID ?? null;
          this.showForm = true;
        }
      } else {
        this.showForm = false;
      }
      this.cdr.detectChanges();
    });
  }

  private loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canAdd = this.frontendPerm.canAddByUrl('/masters/shifts');
    this.canEdit = this.frontendPerm.canEditByUrl('/masters/shifts');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/masters/shifts');
    this.cdr.detectChanges();
  }

  loadData(): void {
    this.loading = true;
    this.shiftService.getAll().subscribe({
      next: (res) => {
        this.shifts = res.data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Shifts load nahi ho paye.';
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
        console.error('Company list load nahi hui', err);
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filteredShifts = this.shifts.filter(s => {
      return !this.filterName || s.shiftName?.toLowerCase().includes(this.filterName.toLowerCase());
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterName = '';
    this.filteredShifts = this.shifts;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formShiftName = '';
    this.formStartTime = '';
    this.formEndTime = '';
    this.formGraceMinutes = 10;
    this.formCompanyID = null;
  }

  openAddForm(): void {
    if (!this.canAdd) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'add' },
      queryParamsHandling: 'merge'
    });
  }

  openEditForm(item: ShiftResponse): void {
    if (!this.canEdit) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'edit', id: item.shiftID },
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

  deleteItem(item: ShiftResponse): void {
    if (!this.canDelete) return;
    if (!confirm(`Are you sure you want to delete "${item.shiftName}"?`)) return;

    this.shiftService.delete(item.shiftID).subscribe({
      next: () => {
        alert('Shift deleted successfully.');
        this.loadData();
      },
      error: (err) => {
        const deleteMsg = err?.error?.message ||
        err?.error?.errors?.[Object.keys(err?.error?.errors ?? {})[0]]?.[0] ||
        'Unable to delete shift. Please remove employee shift assignments first.';
      alert(deleteMsg);
        console.error(err);
      }
    });
  }
  // Company list se naam dhundhne ke liye helper (table me dikhane ke liye)
  getCompanyName(companyID: number | null | undefined): string {
    if (!companyID) return '-';
    const found = this.employers.find(e => e.companyID === companyID);
    return found ? found.companyName : '-';
  }
  saveShift(): void {

    if (!this.formShiftName.trim() || !this.formStartTime || !this.formEndTime) {
      alert('Shift Name, Start Time and End Time is needed');
      return;
    }

    // Duplicate Shift Name Check (per company)
    const duplicate = this.shifts.some(s =>
      s.shiftName.trim().toLowerCase() === this.formShiftName.trim().toLowerCase() &&
      s.companyID === this.formCompanyID &&
      (!this.isEditMode || s.shiftID !== this.currentId)
    );

    if (duplicate) {
      alert('Duplicate Shift Name already exists.');
      return;
    }

    const payload: ShiftRequest = {
      shiftName: this.formShiftName,
      startTime: this.formStartTime,
      endTime: this.formEndTime,
      graceMinutes: this.formGraceMinutes,
      companyID: this.formCompanyID
    };

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      // Update
      this.shiftService.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Shift updated successfully.');
          this.resetForm();
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          alert('Update failed.');
          console.error(err);
        }
      });

    } else {
      // Add
      this.shiftService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Shift added successfully.');
          this.resetForm();
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          alert('Save failed.');
          console.error(err);
        }
      });
    }
  }
}
