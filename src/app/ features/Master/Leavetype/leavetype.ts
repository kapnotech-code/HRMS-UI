import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveTypeService } from '../../../core/services/leavetype.service';
import { LeaveTypeRequest } from '../../../shared/models/leavetype/leave-type-request';
import { LeaveTypeResponse } from '../../../shared/models/leavetype/leave-type-response/leave-type-response';
@Component({
  selector: 'app-leave-type-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leavetype.html',
  styleUrls: ['./leavetype.css']
})
export class LeaveTypeList implements OnInit {
  leaveTypes: LeaveTypeResponse[] = [];
  filteredLeaveTypes: LeaveTypeResponse[] = [];
  loading = false;
  errorMessage = '';
  showForm = false;
  isEditMode = false;
  currentId: number | null = null;
  saving = false;

  // filter
  filterName = '';

  formData: LeaveTypeRequest = {
    leaveTypeName: '',
    defaultDaysPerYear: 0,
    isPaid: true
  };
  constructor(
    private leaveTypeService: LeaveTypeService,
    private cdr: ChangeDetectorRef
  ) { }
  ngOnInit(): void {
    this.loadLeaveTypes();
  }
  loadLeaveTypes(): void {
    this.loading = true;
    this.leaveTypeService.getAll().subscribe({
      next: (res) => {
        this.leaveTypes = res || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Leave types load nahi ho paye.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  applyFilter(): void {
    this.filteredLeaveTypes = this.leaveTypes.filter(item => {
      return !this.filterName || item.leaveTypeName?.toLowerCase().includes(this.filterName.toLowerCase());
    });
    this.cdr.detectChanges();
  }
  resetFilter(): void {
    this.filterName = '';
    this.filteredLeaveTypes = this.leaveTypes;
    this.cdr.detectChanges();
  }
  openAddForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.errorMessage = '';
    this.formData = {
      leaveTypeName: '',
      defaultDaysPerYear: 0,
      isPaid: true
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }
  editLeaveType(item: LeaveTypeResponse): void {
    this.isEditMode = true;
    this.currentId = item.leaveTypeID;
    this.errorMessage = '';
    this.formData = {
      leaveTypeName: item.leaveTypeName,
      defaultDaysPerYear: item.defaultDaysPerYear,
      isPaid: item.isPaid
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }
  saveLeaveType(): void {
    if (!this.formData.leaveTypeName.trim()) {
      alert('Leave Type naam likhna zaroori hai');
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      this.leaveTypeService.update(this.currentId, this.formData).subscribe({
        next: () => {
          this.saving = false;
          alert('Leave Type updated successfully.');
          this.resetForm();
          this.showForm = false;
          this.loadLeaveTypes();
        },
        error: (err) => {
          this.saving = false;
          alert('Leave Type update failed.');
          console.error(err);
          this.errorMessage = 'Update fail ho gaya.';
          this.cdr.detectChanges();
        }
      });

    } else {
      this.leaveTypeService.add(this.formData).subscribe({
        next: () => {
          this.saving = false;
          alert('Leave Type added successfully.');
          this.resetForm();
          this.showForm = false;
          this.loadLeaveTypes();
        },
        error: (err) => {
          this.saving = false;
          alert('Leave Type already exists.');
          console.error(err);
          this.errorMessage = 'Add fail ho gaya.';
          this.cdr.detectChanges();
        }
      });
    }
  }
  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.errorMessage = '';

    this.formData = {
      leaveTypeName: '',
      defaultDaysPerYear: 0,
      isPaid: true
    };

    this.cdr.detectChanges();
  }
  cancelForm(): void {
    this.showForm = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }
  deleteLeaveType(id: number): void {
    if (!confirm('Do you want to delete this leave type?')) return;

    this.leaveTypeService.delete(id).subscribe({
      next: () => {
        alert('Leave type deleted successfully.');
        this.loadLeaveTypes();
      },
      error: (err) => {
        console.error(err);
        alert('Delete failed.');
        this.errorMessage = 'Unable to delete leave type';
        this.cdr.detectChanges();
      }
    });
  }
}
