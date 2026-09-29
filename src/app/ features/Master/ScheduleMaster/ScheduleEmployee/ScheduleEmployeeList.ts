import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ScheduleEmployeeService } from '@core/services/schedule-employee.service';
import { ScheduleMasterService, ScheduleMasterResponse } from '@core/services/schedule-master.service';
import { FrontendPermissionService } from '@core/services/frontend-permission.service';
import { ScheduleEmployeeResponse } from '@shared/models/schedule-employee.model/schedule-employee-response.model';

@Component({
  selector: 'app-schedule-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ScheduleEmployeeList.html',
  styleUrls: ['./ScheduleEmployeeList.css']
})
export class ScheduleEmployeeListComponent implements OnInit {

  mappings: ScheduleEmployeeResponse[] = [];
  filteredMappings: ScheduleEmployeeResponse[] = [];
  schedules: ScheduleMasterResponse[] = [];
  loading = false;
  errorMessage = '';

  filterScheduleId: number | null = null;
  filterStatus = '';

  canAdd = true;
  canEdit = true;
  canDelete = true;

  constructor(
    private scheduleEmployeeService: ScheduleEmployeeService,
    private scheduleService: ScheduleMasterService,
    private frontendPerm: FrontendPermissionService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSchedules();
    this.loadMappings();
    this.loadPermissions();
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canAdd = this.frontendPerm.canAddByUrl('/transactions/schedule-employee');
    this.canEdit = this.frontendPerm.canEditByUrl('/transactions/schedule-employee');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/transactions/schedule-employee');
    this.cdr.detectChanges();
  }

  loadSchedules(): void {
    this.scheduleService.getAll().subscribe({
      next: (res) => {
        this.schedules = res?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Schedules load failed:', err)
    });
  }

  loadMappings(): void {
    this.loading = true;
    this.errorMessage = '';
    this.scheduleEmployeeService.getAll().subscribe({
      next: (res) => {
        this.mappings = res?.data ?? [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Mappings could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filteredMappings = this.mappings.filter(m => {
      if (this.filterScheduleId && m.sE_SM_Id !== this.filterScheduleId) return false;
      if (this.filterStatus && m.sE_Status?.toLowerCase() !== this.filterStatus.toLowerCase()) return false;
      return true;
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterScheduleId = null;
    this.filterStatus = '';
    this.filteredMappings = [...this.mappings];
    this.cdr.detectChanges();
  }

  getScheduleName(scheduleId: number): string {
    const schedule = this.schedules.find(s => s.sM_Id === scheduleId);
    return schedule?.sM_ScheduleName ?? '—';
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'eligible') return 'badge-eligible';
    if (s === 'pending') return 'badge-pending';
    if (s === 'noteligible') return 'badge-noteligible';
    return 'badge-default';
  }

  getStatusLabel(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'eligible') return 'Eligible';
    if (s === 'pending') return 'Pending';
    if (s === 'noteligible') return 'Not Eligible';
    return status || 'Pending';
  }

  navigateToMap(scheduleId: number): void {
    this.router.navigate(['/transactions/schedule-employee', scheduleId]);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  }
}